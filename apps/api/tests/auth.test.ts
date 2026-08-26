import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { prisma } from '../src/plugins/prisma.js';
import { FastifyInstance } from 'fastify';

describe('Authentication Routes', () => {
  let app: FastifyInstance;
  const testUserEmail = `test.student.${Date.now()}@fatecode.edu.br`;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    // Cleanup test user
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.student.' } },
    });
    await app.close();
  });

  it('POST /api/auth/register should register a new student user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Aluno Teste',
        email: testUserEmail,
        password: 'Password@123',
        role: 'STUDENT',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(testUserEmail);
    expect(body.tokens.accessToken).toBeDefined();
  });

  it('POST /api/auth/register should reject duplicate email registration with 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Aluno Duplicado',
        email: testUserEmail,
        password: 'Password@123',
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('POST /api/auth/login should authenticate with valid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testUserEmail,
        password: 'Password@123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.tokens.accessToken).toBeDefined();
    expect(body.user.name).toBe('Aluno Teste');
  });

  it('POST /api/auth/login should reject invalid password with 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testUserEmail,
        password: 'WrongPassword!456',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('GET /api/auth/me should return authenticated user profile', async () => {
    // First login to get token
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testUserEmail,
        password: 'Password@123',
      },
    });
    const { tokens } = JSON.parse(loginRes.body);

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.email).toBe(testUserEmail);
  });
});
