import { redis } from '../plugins/redis.js';
import { prisma } from '../plugins/prisma.js';
import { CodewarsChallengeDTO, CodewarsUserDTO, ImportCodewarsChallengeInput } from '@fatecode/shared';

const CODEWARS_API_BASE = 'https://www.codewars.com/api/v1';
const CODEWARS_REQUEST_TIMEOUT_MS = 10000;

async function codewarsGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(CODEWARS_REQUEST_TIMEOUT_MS),
    headers: {
      'User-Agent': 'FateCode-Academic-Platform/1.0',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Codewars API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// Difficulty mapping from Codewars rank.id (negative numbers: -8 = 8 kyu, -1 = 1 kyu)
export function mapRankToDifficulty(rankId?: number): { difficulty: any; defaultXp: number } {
  switch (rankId) {
    case -8: return { difficulty: 'KYU_8', defaultXp: 50 };
    case -7: return { difficulty: 'KYU_7', defaultXp: 75 };
    case -6: return { difficulty: 'KYU_6', defaultXp: 100 };
    case -5: return { difficulty: 'KYU_5', defaultXp: 150 };
    case -4: return { difficulty: 'KYU_4', defaultXp: 250 };
    case -3: return { difficulty: 'KYU_3', defaultXp: 400 };
    case -2: return { difficulty: 'KYU_2', defaultXp: 600 };
    case -1: return { difficulty: 'KYU_1', defaultXp: 1000 };
    default: return { difficulty: 'KYU_8', defaultXp: 50 };
  }
}

export class CodewarsService {
  /**
   * Get challenge information from Codewars with Redis caching (24h TTL)
   */
  static async getChallenge(idOrSlug: string): Promise<CodewarsChallengeDTO> {
    const cacheKey = `codewars:challenge:${idOrSlug}`;

    // 1. Try Redis cache if available
    try {
      if (redis.status === 'ready') {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (err: any) {
      console.warn('Redis cache get failed:', err.message);
    }

    // 2. Fetch from public Codewars API
    const url = `${CODEWARS_API_BASE}/code-challenges/${encodeURIComponent(idOrSlug)}`;
    const data = await codewarsGet<CodewarsChallengeDTO>(url);

    // 3. Store in Redis cache (24 hours = 86400s)
    try {
      if (redis.status === 'ready') {
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400);
      }
    } catch (err: any) {
      console.warn('Redis cache set failed:', err.message);
    }

    return data;
  }

  /**
   * Get user public profile from Codewars with Redis caching (1h TTL)
   */
  static async getUser(username: string): Promise<CodewarsUserDTO> {
    const cacheKey = `codewars:user:${username.toLowerCase()}`;

    try {
      if (redis.status === 'ready') {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (err: any) {
      console.warn('Redis cache get user failed:', err.message);
    }

    const url = `${CODEWARS_API_BASE}/users/${encodeURIComponent(username)}`;
    const data = await codewarsGet<CodewarsUserDTO>(url);

    try {
      if (redis.status === 'ready') {
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
      }
    } catch (err: any) {
      console.warn('Redis cache set user failed:', err.message);
    }

    return data;
  }

  /**
   * Get completed challenges by a Codewars user
   */
  static async getUserCompletedChallenges(username: string, page = 0): Promise<any> {
    const url = `${CODEWARS_API_BASE}/users/${encodeURIComponent(username)}/code-challenges/completed?page=${page}`;
    return codewarsGet<any>(url);
  }

  /**
   * Import challenge from Codewars into FateCode internal challenge catalog
   */
  static async importChallenge(input: ImportCodewarsChallengeInput) {
    // 1. Fetch challenge info from Codewars
    const external = await this.getChallenge(input.externalId);

    // 2. Check if already imported
    const existing = await (prisma as any).challenge.findFirst({
      where: {
        OR: [
          { externalId: external.id },
          { slug: external.slug },
        ],
      },
    });

    if (existing) {
      throw new Error(`Este desafio já está cadastrado na plataforma (ID: ${existing.id}).`);
    }

    // 3. Map rank to difficulty & default XP
    const { difficulty, defaultXp } = mapRankToDifficulty(external.rank?.id);
    const xpReward = input.xpReward || defaultXp;

    // 4. Create internal Challenge with custom tests and pedagogical topic
    const createdChallenge = await (prisma as any).challenge.create({
      data: {
        title: input.customTitle || external.name,
        slug: external.slug,
        description: input.customDescription || external.description,
        difficulty,
        source: 'CODEWARS',
        externalId: external.id,
        language: input.language,
        initialCode: input.initialCode,
        testCode: input.testCode || '',
        publicTests: input.publicTests || [],
        hiddenTests: input.hiddenTests || [],
        tags: external.tags || [],
        xpReward,
        topicId: input.topicId || null,
      },
      include: {
        topic: true,
      },
    });

    return createdChallenge;
  }
}
