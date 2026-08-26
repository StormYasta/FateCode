import { prisma } from '../plugins/prisma.js';
import { CodewarsService, mapRankToDifficulty } from './codewars.service.js';

type FateLanguage = 'JAVASCRIPT' | 'TYPESCRIPT' | 'PYTHON' | 'JAVA' | 'C' | 'CPP';

const LANGUAGE_MAP: Record<FateLanguage, string> = {
  JAVASCRIPT: 'javascript',
  TYPESCRIPT: 'typescript',
  PYTHON: 'python',
  JAVA: 'java',
  C: 'c',
  CPP: 'cpp',
};

const starterCode: Record<FateLanguage, string> = {
  JAVASCRIPT: 'function solution(...args) {\n  // TODO: adapte a assinatura e implemente a solução.\n}\n',
  TYPESCRIPT: 'function solution(...args: unknown[]) {\n  // TODO: adapte a assinatura e implemente a solução.\n}\n',
  PYTHON: 'def solution(*args):\n    # TODO: adapte a assinatura e implemente a solução.\n    pass\n',
  JAVA: 'class Solution {\n    // TODO: adapte a assinatura e implemente a solução.\n}\n',
  C: '/* TODO: adapte a assinatura e implemente a solução. */\n',
  CPP: '// TODO: adapte a assinatura e implemente a solução.\n',
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CodewarsBulkService {
  static async importCompletedAsDrafts(username: string, limit: number, language: FateLanguage) {
    const completed = await CodewarsService.getUserCompletedChallenges(username, 0);
    const candidates = (completed?.data || []).slice(0, Math.max(1, Math.min(limit, 100)));

    const summary = {
      requested: candidates.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      items: [] as Array<{ slug: string; status: 'IMPORTED' | 'SKIPPED' | 'FAILED'; message?: string }>,
    };

    for (let index = 0; index < candidates.length; index++) {
      const item = candidates[index];
      try {
        const external = await CodewarsService.getChallenge(item.id || item.slug);
        const existing = await (prisma as any).challenge.findFirst({
          where: {
            OR: [
              { externalId: external.id },
              { slug: external.slug },
            ],
          },
        });

        if (existing) {
          summary.skipped++;
          summary.items.push({ slug: external.slug, status: 'SKIPPED', message: 'Já cadastrado.' });
          continue;
        }

        const requestedCodewarsLanguage = LANGUAGE_MAP[language];
        const externalLanguages: string[] = external.languages || [];
        const languageAvailable = externalLanguages.includes(requestedCodewarsLanguage);
        const { difficulty, defaultXp } = mapRankToDifficulty(external.rank?.id);

        await (prisma as any).challenge.create({
          data: {
            title: external.name,
            slug: external.slug,
            description: external.description,
            difficulty,
            source: 'CODEWARS',
            externalId: external.id,
            language,
            initialCode: starterCode[language],
            testCode: '',
            publicTests: [],
            hiddenTests: [],
            tags: [
              ...(external.tags || []),
              'codewars-import',
              'codewars-draft',
              ...(languageAvailable ? [] : ['language-needs-review']),
            ],
            xpReward: defaultXp,
            isDaily: false,
            topicId: null,
          },
        });

        summary.imported++;
        summary.items.push({
          slug: external.slug,
          status: 'IMPORTED',
          message: languageAvailable ? 'Importado como rascunho.' : 'Importado; linguagem precisa de revisão.',
        });
      } catch (error: any) {
        summary.failed++;
        summary.items.push({
          slug: item.slug || item.id || `item-${index + 1}`,
          status: 'FAILED',
          message: error.message,
        });
      }

      // Keep the public API load conservative and reduce the chance of HTTP 429.
      if ((index + 1) % 5 === 0) await sleep(300);
    }

    return summary;
  }
}
