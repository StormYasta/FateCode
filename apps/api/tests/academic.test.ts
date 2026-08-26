import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { FastifyInstance } from 'fastify';

describe('Academic Hierarchy Routes (Faculty -> Course -> Class)', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    // Login student
    const studentRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'joao.silva@fatecode.edu.br', password: 'Student@123456' },
    });
    token = JSON.parse(studentRes.body).tokens?.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/faculties should return list of seeded faculties', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/faculties',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].code).toBe('FATEC-SP');
  });

  it('GET /api/courses should return courses under faculty', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/courses',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    const codes = body.data.map((c: any) => c.code);
    expect(codes).toContain('ADS');
    expect(codes).toContain('GTI');
  });

  it('GET /api/classes should return classes and member counts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/classes',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/classes/:id should return class details with enrolled members', async () => {
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/classes',
      headers: { authorization: `Bearer ${token}` },
    });
    const classes = JSON.parse(listRes.body).data;
    const firstClass = classes[0];

    const res = await app.inject({
      method: 'GET',
      url: `/api/classes/${firstClass.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.id).toBe(firstClass.id);
    expect(Array.isArray(body.data.members)).toBe(true);
    expect(body.data.members.length).toBeGreaterThan(0);
  });
});
