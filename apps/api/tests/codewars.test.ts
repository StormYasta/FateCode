import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { prisma } from '../src/plugins/prisma.js';
import { FastifyInstance } from 'fastify';

describe('Codewars Integration Routes (Phase 3)', () => {
  let app: FastifyInstance;
  let profToken: string;
  let studentToken: string;
  let importedChallengeId: string | undefined = undefined;

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
  });

  afterAll(async () => {
    if (importedChallengeId) {
      await (prisma as any).challenge.delete({ where: { id: importedChallengeId } }).catch(() => {});
    }
    await app.close();
  });

  it('STUDENT should be allowed to view challenge info from internal Codewars endpoint', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/codewars/challenges/52c31f8e6605bcc646000082',
      headers: { authorization: `Bearer ${studentToken}` },
    });

    // 200 or 502 (if no internet connection in offline environment)
    if (res.statusCode === 200) {
      const body = JSON.parse(res.body);
      expect(body.data.id).toBe('52c31f8e6605bcc646000082');
      expect(body.data.name).toBeDefined();
    } else {
      expect([200, 502]).toContain(res.statusCode);
    }
  });

  it('STUDENT should be forbidden (403) from importing a Codewars challenge', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/codewars/import',
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        externalId: '52c31f8e6605bcc646000082',
        initialCode: 'function test() {}',
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it('GET /api/codewars/users/:username should return public profile or handle offline gracefully', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/codewars/users/g964',
      headers: { authorization: `Bearer ${profToken}` },
    });

    expect([200, 502]).toContain(res.statusCode);
  });
});
