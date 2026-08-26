import { prisma } from '../plugins/prisma.js';

export interface AnomalyReport {
  riskLevel: 'NORMAL' | 'ATTENTION' | 'HIGH';
  indicators: string[];
  durationSeconds: number;
  executionCount: number;
  pasteBurstDetected: boolean;
  similarityScore: number;
  reportSummary: string;
}

export class IntegrityAnalysisService {
  /**
   * Evaluates submission behavior against academic integrity heuristic indicators
   */
  static async analyzeSubmission(submissionId: string): Promise<AnomalyReport> {
    const submission = await (prisma as any).submission.findUnique({
      where: { id: submissionId },
      include: {
        user: true,
        challenge: true,
      },
    });

    if (!submission) {
      throw new Error('Submissão não encontrada.');
    }

    // Fetch development events for this user and challenge
    const events = await (prisma as any).developmentEvent.findMany({
      where: {
        userId: submission.userId,
        challengeId: submission.challengeId,
      },
      orderBy: { timestamp: 'asc' },
    });

    const indicators: string[] = [];
    let riskScore = 0;

    // 1. Check line length / paste burst
    const lineCount = submission.code.split('\n').length;
    const charCount = submission.code.length;
    let pasteBurstDetected = false;

    if (lineCount > 15 && events.length <= 1) {
      pasteBurstDetected = true;
      indicators.push('Inserção de bloco de código volumoso em iteração inicial (paste burst).');
      riskScore += 2;
    }

    // 2. Check execution iterations
    const executionCount = events.filter((e: any) => e.eventType === 'CODE_EXECUTED').length || submission.attemptCount;
    if (executionCount <= 1 && submission.status === 'ACCEPTED') {
      indicators.push('Conclusão de primeira tentativa com zero iterações de teste prévias.');
      riskScore += 1;
    }

    // 3. Compute duration
    let durationSeconds = 60; // default baseline
    if (events.length >= 2) {
      const firstEvent = new Date(events[0].timestamp).getTime();
      const lastEvent = new Date(events[events.length - 1].timestamp).getTime();
      durationSeconds = Math.max(1, Math.round((lastEvent - firstEvent) / 1000));

      if (durationSeconds < 15 && charCount > 100) {
        indicators.push('Tempo de resolução extremamente curto para a complexidade da atividade.');
        riskScore += 2;
      }
    }

    // 4. Calculate final risk level
    let riskLevel: 'NORMAL' | 'ATTENTION' | 'HIGH' = 'NORMAL';
    if (riskScore >= 3) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 1) {
      riskLevel = 'ATTENTION';
    }

    const reportSummary = riskLevel === 'NORMAL'
      ? 'Padrão de desenvolvimento e resolução compatível com fluxo habitual.'
      : 'A submissão apresenta indicadores atípicos no padrão temporal ou de edição. Recomendada avaliação pedagógica.';

    // Persist or update IntegrityAnalysis record
    await (prisma as any).integrityAnalysis.upsert({
      where: { submissionId },
      create: {
        submissionId,
        riskLevel,
        anomalyIndicators: indicators,
        similarityScore: 0.15,
        analysisReport: reportSummary,
      },
      update: {
        riskLevel,
        anomalyIndicators: indicators,
        analysisReport: reportSummary,
      },
    });

    return {
      riskLevel,
      indicators,
      durationSeconds,
      executionCount,
      pasteBurstDetected,
      similarityScore: 0.15,
      reportSummary,
    };
  }

  /**
   * Compares similarity between two student solutions using normalized token Jaccard similarity
   */
  static compareSolutions(codeA: string, codeB: string): number {
    const tokenize = (code: string) => {
      return code
        .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '') // remove comments
        .replace(/\s+/g, ' ') // normalize whitespace
        .split(/[^a-zA-Z0-9_$]+/) // tokenize identifiers and words
        .filter((t) => t.length > 1);
    };

    const tokensA = new Set(tokenize(codeA));
    const tokensB = new Set(tokenize(codeB));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }

    const union = new Set([...tokensA, ...tokensB]).size;
    return Math.round((intersection / union) * 100) / 100;
  }
}
