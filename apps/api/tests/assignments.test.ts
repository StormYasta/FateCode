import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { prisma } from '../src/plugins/prisma.js';
import { FastifyInstance } from 'fastify';

describe('Assignments Routes (Phase 2)', () => {
  let app: FastifyInstance;
  let profToken: string;
  let studentToken: string;
  let classId: string;
  let challengeId: string;
  let createdAssignmentId: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    // Login prof
    const profRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'prof.silva@fatecode.edu.br', password: 'Prof@123456' },
    });
    profToken = JSON.parse(profRes.body).tokens?.accessToken;

    // Login student
    const studentRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'joao.silva@fatecode.edu.br', password: 'Student@123456' },
    });
    studentToken = JSON.parse(studentRes.body).tokens?.accessToken;

    // Fetch a sample class and challenge from seed
    const classRes = await app.inject({
      method: 'GET',
      url: '/api/classes',
      headers: { authorization: `Bearer ${profToken}` },
    });
    classId = JSON.parse(classRes.body).data[0].id;

    const challengeRes = await app.inject({
      method: 'GET',
      url: '/api/challenges',
      headers: { authorization: `Bearer ${profToken}` },
    });
    challengeId = JSON.parse(challengeRes.body).data[0].id;
  });

  afterAll(async () => {
    if (createdAssignmentId) {
      await (prisma as any).assignment.delete({ where: { id: createdAssignmentId } }).catch(() => {});
    }
    await app.close();
  });

  it('STUDENT should be forbidden (403) from creating an Assignment', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/assignments',
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        title: 'Atividade Invalida Aluno',
        classId,
        challengeId,
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it('PROFESSOR should be allowed to assign a challenge to a class', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/assignments',
      headers: { authorization: `Bearer ${profToken}` },
      payload: {
        title: 'Lista 01: Algoritmos de Arrays',
        classId,
        challengeId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isOptional: false,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.id).toBeDefined();
    expect(body.data.title).toBe('Lista 01: Algoritmos de Arrays');
    createdAssignmentId = body.data.id;
  });

  it('STUDENT should be able to list class assignments', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/assignments?classId=${classId}`,
      headers: { authorization: `Bearer ${studentToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });
});
