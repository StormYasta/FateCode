import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { prisma } from '../src/plugins/prisma.js';
import { FastifyInstance } from 'fastify';

describe('Code Execution and Submission Routes (Phase 4)', () => {
  let app: FastifyInstance;
  let studentToken: string;
  let testUserId: string;
  let challengeId: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    // Login student
    const studentRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'joao.silva@fatecode.edu.br', password: 'Student@123456' },
    });
    const data = JSON.parse(studentRes.body);
    studentToken = data.tokens?.accessToken;
    testUserId = data.user?.id;

    // Get Two Sum challenge
    const challengeRes = await app.inject({
      method: 'GET',
      url: '/api/challenges/two-sum',
      headers: { authorization: `Bearer ${studentToken}` },
    });
    challengeId = JSON.parse(challengeRes.body).data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/challenges/:id/execute should successfully run correct code against public tests', async () => {
    const validSolution = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (map.has(complement)) {
            return [map.get(complement), i];
          }
          map.set(nums[i], i);
        }
        return [];
      }
    `;

    const res = await app.inject({
      method: 'POST',
      url: `/api/challenges/${challengeId}/execute`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        code: validSolution,
        language: 'JAVASCRIPT',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.success).toBe(true);
    expect(body.data.status).toBe('ACCEPTED');
    expect(body.data.passedTests).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/challenges/:id/execute should report failed tests on incorrect code', async () => {
    const wrongSolution = `
      function twoSum(nums, target) {
        return [0, 0]; // wrong
      }
    `;

    const res = await app.inject({
      method: 'POST',
      url: `/api/challenges/${challengeId}/execute`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        code: wrongSolution,
        language: 'JAVASCRIPT',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.success).toBe(false);
    expect(body.data.status).toBe('REJECTED');
  });

  it('POST /api/challenges/:id/submit should submit solution, evaluate hidden tests and grant XP', async () => {
    const validSolution = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (map.has(complement)) {
            return [map.get(complement), i];
          }
          map.set(nums[i], i);
        }
        return [];
      }
    `;

    const res = await app.inject({
      method: 'POST',
      url: `/api/challenges/${challengeId}/submit`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        code: validSolution,
        language: 'JAVASCRIPT',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.status).toBe('ACCEPTED');
    expect(body.submissionId).toBeDefined();
    expect(body.passedTests).toBe(body.totalTests);
  });
});
