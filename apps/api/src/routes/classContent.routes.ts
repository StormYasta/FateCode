import { FastifyInstance } from 'fastify';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate.js';
import { prisma } from '../plugins/prisma.js';

type ClassContentType = 'POST' | 'TEXT' | 'DOCUMENT';

type ClassContentRecord = {
  id: string;
  classId: string;
  authorId: string;
  type: ClassContentType;
  title: string;
  body: string | null;
  fileName: string | null;
  storedName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

const uploadRoot = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
const fileDir = path.join(uploadRoot, 'files');
const indexPath = path.join(uploadRoot, 'class-content-index.json');

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

let writeQueue: Promise<void> = Promise.resolve();

async function ensureStorage() {
  await mkdir(fileDir, { recursive: true });
}

async function readContents(): Promise<ClassContentRecord[]> {
  await ensureStorage();
  try {
    const raw = await readFile(indexPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeContents(records: ClassContentRecord[]) {
  const doWrite = async () => {
    await ensureStorage();
    const tempPath = `${indexPath}.tmp`;
    await writeFile(tempPath, JSON.stringify(records, null, 2), 'utf8');
    await rename(tempPath, indexPath);
  };

  writeQueue = writeQueue.then(doWrite, doWrite);
  await writeQueue;
}

async function classExists(classId: string) {
  return Boolean(await (prisma as any).class.findUnique({ where: { id: classId }, select: { id: true } }));
}

async function canManageClass(user: any, classId: string) {
  if (user?.role === 'ADMIN') return true;
  if (user?.role !== 'PROFESSOR') return false;

  const membership = await (prisma as any).classMember.findUnique({
    where: { classId_userId: { classId, userId: user.id } },
    select: { role: true },
  });

  return membership?.role === 'PROFESSOR' || membership?.role === 'ASSISTANT';
}

async function hydrateAuthors(records: ClassContentRecord[]) {
  const authorIds = [...new Set(records.map((record) => record.authorId))];
  const authors = authorIds.length
    ? await (prisma as any).user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true, avatarUrl: true, role: true },
      })
    : [];

  const authorMap = new Map(authors.map((author: any) => [author.id, author]));
  return records.map((record) => ({ ...record, author: authorMap.get(record.authorId) || null }));
}

export async function classContentRoutes(fastify: FastifyInstance) {
  fastify.get('/:classId/contents', { preHandler: [authenticate] }, async (request, reply) => {
    const { classId } = request.params as { classId: string };

    if (!(await classExists(classId))) {
      return reply.status(404).send({ error: 'Not Found', message: 'Turma não encontrada.' });
    }

    const contents = (await readContents())
      .filter((item) => item.classId === classId)
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return reply.send({ data: await hydrateAuthors(contents) });
  });

  fastify.post('/:classId/contents', { preHandler: [authenticate] }, async (request, reply) => {
    const { classId } = request.params as { classId: string };
    const user = (request as any).user;

    if (!(await classExists(classId))) {
      return reply.status(404).send({ error: 'Not Found', message: 'Turma não encontrada.' });
    }
    if (!(await canManageClass(user, classId))) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Você não pode publicar nesta turma.' });
    }

    const schema = z.object({
      type: z.enum(['POST', 'TEXT']),
      title: z.string().min(3).max(180),
      body: z.string().min(1),
      isPinned: z.boolean().optional().default(false),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
    }

    const now = new Date().toISOString();
    const item: ClassContentRecord = {
      id: randomUUID(),
      classId,
      authorId: user.id,
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body,
      fileName: null,
      storedName: null,
      fileUrl: null,
      mimeType: null,
      fileSize: null,
      isPinned: parsed.data.isPinned,
      createdAt: now,
      updatedAt: now,
    };

    const records = await readContents();
    records.push(item);
    await writeContents(records);

    const [hydrated] = await hydrateAuthors([item]);
    return reply.status(201).send({ message: 'Conteúdo publicado com sucesso.', data: hydrated });
  });

  fastify.post('/:classId/contents/documents', { preHandler: [authenticate] }, async (request, reply) => {
    const { classId } = request.params as { classId: string };
    const user = (request as any).user;

    if (!(await classExists(classId))) {
      return reply.status(404).send({ error: 'Not Found', message: 'Turma não encontrada.' });
    }
    if (!(await canManageClass(user, classId))) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Você não pode enviar documentos nesta turma.' });
    }

    await ensureStorage();
    const fields: Record<string, string> = {};
    let upload: { originalName: string; storedName: string; mimeType: string; size: number } | null = null;

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        if (upload) {
          part.file.resume();
          continue;
        }
        if (!allowedMimeTypes.has(part.mimetype)) {
          part.file.resume();
          return reply.status(400).send({
            error: 'Invalid File',
            message: 'Formato não permitido. Use PDF, Office, TXT/CSV ou imagem.',
          });
        }

        const extension = path.extname(part.filename || '').toLowerCase();
        const storedName = `${Date.now()}-${randomUUID()}${extension}`;
        const destination = path.join(fileDir, storedName);
        let size = 0;
        part.file.on('data', (chunk) => { size += chunk.length; });
        await pipeline(part.file, createWriteStream(destination));

        upload = {
          originalName: path.basename(part.filename || 'documento'),
          storedName,
          mimeType: part.mimetype,
          size,
        };
      } else {
        fields[part.fieldname] = String(part.value ?? '');
      }
    }

    if (!upload) {
      return reply.status(400).send({ error: 'Validation Error', message: 'Selecione um documento para enviar.' });
    }

    const now = new Date().toISOString();
    const item: ClassContentRecord = {
      id: randomUUID(),
      classId,
      authorId: user.id,
      type: 'DOCUMENT',
      title: (fields.title || upload.originalName).trim(),
      body: fields.body?.trim() || null,
      fileName: upload.originalName,
      storedName: upload.storedName,
      fileUrl: `/uploads/${upload.storedName}`,
      mimeType: upload.mimeType,
      fileSize: upload.size,
      isPinned: fields.isPinned === 'true',
      createdAt: now,
      updatedAt: now,
    };

    const records = await readContents();
    records.push(item);
    await writeContents(records);

    const [hydrated] = await hydrateAuthors([item]);
    return reply.status(201).send({ message: 'Documento enviado com sucesso.', data: hydrated });
  });

  fastify.put('/:classId/contents/:contentId', { preHandler: [authenticate] }, async (request, reply) => {
    const { classId, contentId } = request.params as { classId: string; contentId: string };
    const user = (request as any).user;

    if (!(await canManageClass(user, classId))) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Você não pode editar conteúdos desta turma.' });
    }

    const schema = z.object({
      title: z.string().min(3).max(180).optional(),
      body: z.string().optional().nullable(),
      isPinned: z.boolean().optional(),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
    }

    const records = await readContents();
    const index = records.findIndex((item) => item.id === contentId && item.classId === classId);
    if (index < 0) {
      return reply.status(404).send({ error: 'Not Found', message: 'Conteúdo não encontrado.' });
    }

    records[index] = {
      ...records[index],
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.body !== undefined && { body: parsed.data.body }),
      ...(parsed.data.isPinned !== undefined && { isPinned: parsed.data.isPinned }),
      updatedAt: new Date().toISOString(),
    };
    await writeContents(records);

    const [hydrated] = await hydrateAuthors([records[index]]);
    return reply.send({ message: 'Conteúdo atualizado com sucesso.', data: hydrated });
  });

  fastify.delete('/:classId/contents/:contentId', { preHandler: [authenticate] }, async (request, reply) => {
    const { classId, contentId } = request.params as { classId: string; contentId: string };
    const user = (request as any).user;

    if (!(await canManageClass(user, classId))) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Você não pode remover conteúdos desta turma.' });
    }

    const records = await readContents();
    const item = records.find((record) => record.id === contentId && record.classId === classId);
    if (!item) {
      return reply.status(404).send({ error: 'Not Found', message: 'Conteúdo não encontrado.' });
    }

    await writeContents(records.filter((record) => record.id !== contentId));
    if (item.storedName) {
      await unlink(path.join(fileDir, item.storedName)).catch(() => undefined);
    }

    return reply.send({ message: 'Conteúdo removido com sucesso.' });
  });
}
