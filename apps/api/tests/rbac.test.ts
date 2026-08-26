import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { prisma } from '../src/plugins/prisma.js';
import { FastifyInstance } from 'fastify';

describe('RBAC (Role-Based Access Control) Routes', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let profToken: string;
  let studentToken: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    // Login admin
    const adminRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@fatecode.edu.br', password: 'Admin@123456' },
    });
    adminToken = JSON.parse(adminRes.body).tokens?.accessToken;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('Unauthenticated request to protected route should return 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/faculties',
    });

    expect(res.statusCode).toBe(401);
  });

  it('STUDENT should be forbidden (403) from creating a Faculty', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/faculties',
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { name: 'Faculdade Invalida', code: 'FAC-INV' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('PROFESSOR should be forbidden (403) from creating a Faculty', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/faculties',
      headers: { authorization: `Bearer ${profToken}` },
      payload: { name: 'Faculdade Invalida Prof', code: 'FAC-PROF' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('ADMIN should be permitted to create a Faculty', async () => {
    const testCode = `FAC-${Date.now().toString().slice(-4)}`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/faculties',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'Nova Faculdade Fatec RBAC', code: testCode, city: 'Santos', state: 'SP' },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.code).toBe(testCode);

    // Cleanup created test faculty
    await prisma.faculty.delete({ where: { id: body.data.id } });
  });

  it('STUDENT should be forbidden (403) from accessing user list management', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${studentToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('PROFESSOR and ADMIN should be allowed to view user list', async () => {
    const resProf = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${profToken}` },
    });
    expect(resProf.statusCode).toBe(200);

    const resAdmin = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(resAdmin.statusCode).toBe(200);
  });
});
