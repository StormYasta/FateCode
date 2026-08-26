import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { updateProfileSchema, Role } from '@fatecode/shared';
import { z } from 'zod';

export async function userRoutes(fastify: FastifyInstance) {
  // List Users (Admin and Professor only)
  fastify.get(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const requester = (request as any).user;
      const querySchema = z.object({
        role: z.enum(['ADMIN', 'PROFESSOR', 'STUDENT']).optional(),
        search: z.string().optional(),
        classId: z.string().optional(),
        includeInactive: z.coerce.boolean().optional().default(false),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(200).default(20),
      });

      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const { role, search, classId, includeInactive, page, limit } = parsed.data;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (!(requester.role === 'ADMIN' && includeInactive)) where.isActive = true;
      if (role) where.role = role as Role;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (classId) {
        where.classMemberships = {
          some: { classId },
        };
      }

      const [users, total] = await Promise.all([
        (prisma as any).user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            avatarUrl: true,
            bio: true,
            profile: {
              select: {
                totalXP: true,
                githubUsername: true,
              },
            },
            streak: {
              select: {
                currentStreak: true,
                maxStreak: true,
              },
            },
            classMemberships: {
              select: {
                role: true,
                class: { select: { id: true, name: true, code: true } },
              },
            },
            createdAt: true,
          },
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        (prisma as any).user.count({ where }),
      ]);

      return reply.send({
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  );

  // Provision user accounts from the backoffice (Admin only)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(['ADMIN', 'PROFESSOR', 'STUDENT']).default('PROFESSOR'),
      });
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const email = parsed.data.email.toLowerCase();
      const existing = await (prisma as any).user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'Este e-mail já está cadastrado.' });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 10);
      const user = await (prisma as any).user.create({
        data: {
          name: parsed.data.name,
          email,
          passwordHash,
          role: parsed.data.role as Role,
          profile: { create: { totalXP: 0 } },
          streak: { create: { currentStreak: 0, maxStreak: 0 } },
        },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      });

      return reply.status(201).send({ message: 'Usuário criado pelo backoffice.', data: user });
    }
  );

  // Update own profile
  fastify.put(
    '/profile',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userReq = (request as any).user;
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const { name, bio, avatarUrl } = parsed.data;

      const updatedUser = await (prisma as any).user.update({
        where: { id: userReq.id },
        data: {
          ...(name && { name }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          bio: true,
          updatedAt: true,
        },
      });

      return reply.send({
        message: 'Perfil atualizado com sucesso.',
        user: updatedUser,
      });
    }
  );

  // Backoffice update (Admin only)
  fastify.put(
    '/:id/admin',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const schema = z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        role: z.enum(['ADMIN', 'PROFESSOR', 'STUDENT']).optional(),
        password: z.string().min(6).optional(),
      });
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const data: any = {};
      if (parsed.data.name) data.name = parsed.data.name;
      if (parsed.data.email) data.email = parsed.data.email.toLowerCase();
      if (parsed.data.role) data.role = parsed.data.role as Role;
      if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 10);

      const updated = await (prisma as any).user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true, isActive: true, updatedAt: true },
      });

      return reply.send({ message: 'Usuário atualizado.', data: updated });
    }
  );

  // Activate/deactivate account (Admin only)
  fastify.patch(
    '/:id/status',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const requester = (request as any).user;
      const { id } = request.params as { id: string };
      const parsed = z.object({ isActive: z.boolean() }).safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }
      if (requester.id === id && parsed.data.isActive === false) {
        return reply.status(400).send({ error: 'Invalid Operation', message: 'Você não pode desativar a própria conta.' });
      }

      const updated = await (prisma as any).user.update({
        where: { id },
        data: { isActive: parsed.data.isActive },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      return reply.send({ message: parsed.data.isActive ? 'Usuário reativado.' : 'Usuário desativado.', data: updated });
    }
  );

  // Get User by ID (Public Profile)
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await (prisma as any).user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        bio: true,
        profile: {
          select: {
            totalXP: true,
            githubUsername: true,
            codewarsUsername: true,
            preferredLanguage: true,
          },
        },
        streak: {
          select: {
            currentStreak: true,
            maxStreak: true,
          },
        },
        classMemberships: {
          select: {
            role: true,
            class: {
              select: {
                id: true,
                name: true,
                code: true,
                semester: true,
                year: true,
                course: {
                  select: {
                    name: true,
                    code: true,
                    faculty: {
                      select: {
                        name: true,
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Not Found', message: 'Usuário não encontrado.' });
    }

    return reply.send({ user });
  });

  // Change User Role (Admin only)
  fastify.patch(
    '/:id/role',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const roleSchema = z.object({
        role: z.enum(['ADMIN', 'PROFESSOR', 'STUDENT']),
      });

      const parsed = roleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).user.update({
        where: { id },
        data: { role: parsed.data.role as Role },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });

      return reply.send({
        message: 'Papel do usuário atualizado com sucesso.',
        user: updated,
      });
    }
  );
}
