import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { prisma } from '../src/plugins/prisma.js';
import { FastifyInstance } from 'fastify';

describe('Learning Paths, Modules & Topics Routes (Phase 2)', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let profToken: string;
  let studentToken: string;
  let createdPathId: string;
  let createdModuleId: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    // Login users
    const adminRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@fatecode.edu.br', password: 'Admin@123456' },
    });
    adminToken = JSON.parse(adminRes.body).tokens?.accessToken;

    const profRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'prof.silva@fatecode.edu.br', password: 'Prof@123456' },
    });
    profToken = JSON.parse(profRes.body).tokens?.accessToken;

    const studentRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'joao.silva@fatecode.edu.br', password: 'Student@123456' },
    });
    studentToken = JSON.parse(studentRes.body).tokens?.accessToken;
  });

  afterAll(async () => {
    if (createdPathId) {
      await (prisma as any).learningPath.delete({ where: { id: createdPathId } }).catch(() => {});
    }
    await app.close();
  });

  it('STUDENT should be forbidden (403) from creating a Learning Path', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/learning-paths',
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        title: 'Trilha Proibida Aluno',
        slug: 'trilha-proibida-aluno',
        description: 'Tentativa não autorizada',
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it('PROFESSOR should be allowed to create a Learning Path', async () => {
    const slug = `trilha-test-${Date.now()}`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/learning-paths',
      headers: { authorization: `Bearer ${profToken}` },
      payload: {
        title: 'Estruturas de Dados Avançadas',
        slug,
        description: 'Trilha prática de árvores e grafos.',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.id).toBeDefined();
    expect(body.data.slug).toBe(slug);
    createdPathId = body.data.id;
  });

  it('PROFESSOR should be allowed to create a Module inside the Learning Path', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/modules',
      headers: { authorization: `Bearer ${profToken}` },
      payload: {
        title: 'Módulo 1: Árvores Binárias',
        description: 'Conceitos fundamentais de BST.',
        order: 1,
        learningPathId: createdPathId,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.id).toBeDefined();
    createdModuleId = body.data.id;
  });

  it('PROFESSOR should be allowed to create a Topic inside the Module', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/topics',
      headers: { authorization: `Bearer ${profToken}` },
      payload: {
        title: 'Travessia em Árvores (DFS/BFS)',
        description: 'In-order, Pre-order, Post-order traversal.',
        order: 1,
        moduleId: createdModuleId,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.id).toBeDefined();
  });

  it('GET /api/learning-paths/:id should return complete nested structure for STUDENT', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/learning-paths/${createdPathId}`,
      headers: { authorization: `Bearer ${studentToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.id).toBe(createdPathId);
    expect(body.data.modules.length).toBe(1);
    expect(body.data.modules[0].topics.length).toBe(1);
  });
});
