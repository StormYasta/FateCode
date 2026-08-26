import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { z } from 'zod';

type MetricSubmission = {
  id: string;
  userId: string;
  challengeId: string;
  assignmentId: string | null;
  status: string;
  passedTests: number;
  totalTests: number;
  submittedAt: Date;
};

type DevEvent = {
  userId: string;
  challengeId: string;
  eventType: string;
  timestamp: Date;
};

const pct = (value: number, total: number) => total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
const avg = (values: number[]) => values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(value * 10) / 10;
};

function scoreOf(sub: MetricSubmission) {
  if (sub.totalTests <= 0) return sub.status === 'ACCEPTED' ? 100 : 0;
  return Math.round((sub.passedTests / sub.totalTests) * 1000) / 10;
}

function solveMinutes(submission: MetricSubmission, events: DevEvent[]) {
  const end = new Date(submission.submittedAt).getTime();
  const eligible = events
    .filter((event) => {
      const at = new Date(event.timestamp).getTime();
      return at <= end && at >= end - 4 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (!eligible.length) return null;

  const sessionStarts = eligible.filter((event) => event.eventType === 'SESSION_STARTED');
  const startEvent = sessionStarts.length ? sessionStarts[sessionStarts.length - 1] : eligible[0];
  const start = new Date(startEvent.timestamp).getTime();
  const minutes = Math.max(0.1, (end - start) / 60000);
  return Math.round(minutes * 10) / 10;
}

export async function teacherAnalyticsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/analytics',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const user = (request as any).user;
      const parsed = z.object({
        days: z.coerce.number().int().min(7).max(365).default(30),
      }).safeParse(request.query);

      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const days = parsed.data.days;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const now = new Date();

      const classWhere = user.role === 'ADMIN'
        ? {}
        : {
            members: {
              some: {
                userId: user.id,
                role: { in: ['PROFESSOR', 'ASSISTANT'] },
              },
            },
          };

      const classes = await (prisma as any).class.findMany({
        where: classWhere,
        include: {
          course: { select: { name: true, code: true } },
          members: {
            where: { role: 'STUDENT' },
            select: { userId: true },
          },
          assignments: {
            where: {
              startDate: { lte: now },
              OR: [
                { dueDate: null },
                { dueDate: { gte: since } },
                { startDate: { gte: since } },
              ],
            },
            include: {
              challenge: {
                select: {
                  id: true,
                  title: true,
                  difficulty: true,
                  tags: true,
                },
              },
            },
            orderBy: { startDate: 'asc' },
          },
        },
        orderBy: [{ year: 'desc' }, { semester: 'asc' }, { name: 'asc' }],
      });

      const assignmentIds = classes.flatMap((c: any) => c.assignments.map((a: any) => a.id));
      const studentIds = [...new Set(classes.flatMap((c: any) => c.members.map((m: any) => m.userId)))] as string[];
      const challengeIds = [...new Set(classes.flatMap((c: any) => c.assignments.map((a: any) => a.challengeId)))] as string[];

      const submissions: MetricSubmission[] = assignmentIds.length
        ? await (prisma as any).submission.findMany({
            where: {
              assignmentId: { in: assignmentIds },
              submittedAt: { gte: since },
            },
            select: {
              id: true,
              userId: true,
              challengeId: true,
              assignmentId: true,
              status: true,
              passedTests: true,
              totalTests: true,
              submittedAt: true,
            },
            orderBy: { submittedAt: 'asc' },
          })
        : [];

      const events: DevEvent[] = studentIds.length && challengeIds.length
        ? await (prisma as any).developmentEvent.findMany({
            where: {
              userId: { in: studentIds },
              challengeId: { in: challengeIds },
              timestamp: { gte: new Date(since.getTime() - 4 * 60 * 60 * 1000) },
            },
            select: { userId: true, challengeId: true, eventType: true, timestamp: true },
            orderBy: { timestamp: 'asc' },
          })
        : [];

      const eventsByUserChallenge = new Map<string, DevEvent[]>();
      for (const event of events) {
        const key = `${event.userId}:${event.challengeId}`;
        const bucket = eventsByUserChallenge.get(key) || [];
        bucket.push(event);
        eventsByUserChallenge.set(key, bucket);
      }

      const tagAccumulator = new Map<string, { scores: number[]; attempts: number[]; completions: number; samples: number; classes: Set<string> }>();
      const difficultyAccumulator = new Map<string, { scores: number[]; attempts: number[]; completions: number; samples: number }>();
      const focusAreas: any[] = [];
      const classComparison: any[] = [];
      const allScores: number[] = [];
      const allAttempts: number[] = [];
      const allSolveTimes: number[] = [];
      let totalCompletedPairs = 0;
      let totalRequiredPairs = 0;
      let totalActiveStudents = 0;
      let totalStudents = 0;

      for (const cls of classes) {
        const requiredAssignments = cls.assignments.filter((a: any) => !a.isOptional);
        const classStudentIds = cls.members.map((m: any) => m.userId);
        const classAssignmentIds = new Set(cls.assignments.map((a: any) => a.id));
        const classSubmissions = submissions.filter((s) => s.assignmentId && classAssignmentIds.has(s.assignmentId));
        const activeStudents = new Set(classSubmissions.map((s) => s.userId));
        const scores: number[] = [];
        const attempts: number[] = [];
        const solveTimes: number[] = [];
        let completedPairs = 0;
        const pairCount = classStudentIds.length * requiredAssignments.length;

        for (const assignment of cls.assignments) {
          const assignmentSubs = classSubmissions.filter((s) => s.assignmentId === assignment.id);
          const perStudent = new Map<string, MetricSubmission[]>();
          for (const sub of assignmentSubs) {
            const list = perStudent.get(sub.userId) || [];
            list.push(sub);
            perStudent.set(sub.userId, list);
          }

          const assignmentScores: number[] = [];
          const assignmentAttempts: number[] = [];
          let assignmentCompleted = 0;

          for (const studentId of classStudentIds) {
            const studentSubs = perStudent.get(studentId) || [];
            if (!studentSubs.length) continue;
            const latest = studentSubs[studentSubs.length - 1];
            const score = scoreOf(latest);
            scores.push(score);
            assignmentScores.push(score);
            attempts.push(studentSubs.length);
            assignmentAttempts.push(studentSubs.length);

            const accepted = studentSubs.find((s) => s.status === 'ACCEPTED');
            if (accepted) {
              assignmentCompleted++;
              if (!assignment.isOptional) completedPairs++;
              const eventBucket = eventsByUserChallenge.get(`${accepted.userId}:${accepted.challengeId}`) || [];
              const minutes = solveMinutes(accepted, eventBucket);
              if (minutes !== null) solveTimes.push(minutes);
            }
          }

          const assignmentCompletionRate = pct(assignmentCompleted, classStudentIds.length);
          const assignmentAverage = avg(assignmentScores);
          const assignmentAttemptAvg = avg(assignmentAttempts);

          if (!assignment.isOptional && (assignmentCompletionRate < 65 || (assignmentScores.length && assignmentAverage < 65))) {
            focusAreas.push({
              kind: 'ASSIGNMENT',
              label: assignment.title,
              classId: cls.id,
              className: cls.name,
              detail: assignmentCompletionRate < 65
                ? `Somente ${assignmentCompletionRate}% da turma concluiu esta atividade no período.`
                : `A média de desempenho nesta atividade está em ${assignmentAverage}%.`,
              averageScore: assignmentAverage,
              completionRate: assignmentCompletionRate,
              averageAttempts: assignmentAttemptAvg,
              severity: assignmentCompletionRate < 45 || assignmentAverage < 50 ? 'HIGH' : 'MEDIUM',
            });
          }

          const difficulty = assignment.challenge?.difficulty || 'KYU_8';
          const diffBucket = difficultyAccumulator.get(difficulty) || { scores: [], attempts: [], completions: 0, samples: 0 };
          diffBucket.scores.push(...assignmentScores);
          diffBucket.attempts.push(...assignmentAttempts);
          diffBucket.completions += assignmentCompleted;
          diffBucket.samples += classStudentIds.length;
          difficultyAccumulator.set(difficulty, diffBucket);

          for (const tag of assignment.challenge?.tags || []) {
            const tagBucket = tagAccumulator.get(tag) || { scores: [], attempts: [], completions: 0, samples: 0, classes: new Set<string>() };
            tagBucket.scores.push(...assignmentScores);
            tagBucket.attempts.push(...assignmentAttempts);
            tagBucket.completions += assignmentCompleted;
            tagBucket.samples += classStudentIds.length;
            tagBucket.classes.add(cls.name);
            tagAccumulator.set(tag, tagBucket);
          }
        }

        const completionRate = pct(completedPairs, pairCount);
        const classMetric = {
          classId: cls.id,
          name: cls.name,
          code: cls.code,
          course: cls.course?.name || '',
          students: classStudentIds.length,
          activeStudents: activeStudents.size,
          activeStudentRate: pct(activeStudents.size, classStudentIds.length),
          assignments: cls.assignments.length,
          requiredAssignments: requiredAssignments.length,
          submissions: classSubmissions.length,
          completionRate,
          averageScore: avg(scores),
          averageAttempts: avg(attempts),
          averageSolveMinutes: avg(solveTimes),
          medianSolveMinutes: median(solveTimes),
        };

        classComparison.push(classMetric);
        allScores.push(...scores);
        allAttempts.push(...attempts);
        allSolveTimes.push(...solveTimes);
        totalCompletedPairs += completedPairs;
        totalRequiredPairs += pairCount;
        totalActiveStudents += activeStudents.size;
        totalStudents += classStudentIds.length;
      }

      const tagBreakdown = [...tagAccumulator.entries()]
        .map(([tag, bucket]) => ({
          tag,
          averageScore: avg(bucket.scores),
          completionRate: pct(bucket.completions, bucket.samples),
          averageAttempts: avg(bucket.attempts),
          samples: bucket.samples,
          classes: [...bucket.classes],
        }))
        .sort((a, b) => a.averageScore - b.averageScore);

      for (const tag of tagBreakdown.filter((t) => t.samples >= 2 && (t.averageScore < 70 || t.completionRate < 70)).slice(0, 5)) {
        focusAreas.push({
          kind: 'TAG',
          label: tag.tag,
          className: tag.classes.join(', '),
          detail: `Conteúdo com média ${tag.averageScore}% e conclusão ${tag.completionRate}%. Considere retomar conceitos e exemplos guiados.`,
          averageScore: tag.averageScore,
          completionRate: tag.completionRate,
          averageAttempts: tag.averageAttempts,
          severity: tag.averageScore < 50 || tag.completionRate < 50 ? 'HIGH' : 'MEDIUM',
        });
      }

      const difficultyBreakdown = [...difficultyAccumulator.entries()]
        .map(([difficulty, bucket]) => ({
          difficulty,
          averageScore: avg(bucket.scores),
          completionRate: pct(bucket.completions, bucket.samples),
          averageAttempts: avg(bucket.attempts),
          samples: bucket.samples,
        }))
        .sort((a, b) => Number(b.difficulty.replace('KYU_', '')) - Number(a.difficulty.replace('KYU_', '')));

      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const weeklyActivity = Array.from({ length: Math.min(8, Math.max(1, Math.ceil(days / 7))) }, (_, index) => {
        const bucketEnd = new Date(now.getTime() - (Math.min(8, Math.ceil(days / 7)) - 1 - index) * weekMs);
        const bucketStart = new Date(bucketEnd.getTime() - weekMs);
        const bucketSubs = submissions.filter((s) => {
          const at = new Date(s.submittedAt).getTime();
          return at >= bucketStart.getTime() && at < bucketEnd.getTime();
        });
        return {
          label: bucketStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          submissions: bucketSubs.length,
          accepted: bucketSubs.filter((s) => s.status === 'ACCEPTED').length,
        };
      });

      focusAreas.sort((a, b) => {
        const severity = { HIGH: 2, MEDIUM: 1 } as Record<string, number>;
        return (severity[b.severity] || 0) - (severity[a.severity] || 0) || (a.averageScore || 100) - (b.averageScore || 100);
      });

      return reply.send({
        data: {
          periodDays: days,
          generatedAt: now,
          overview: {
            classes: classes.length,
            students: totalStudents,
            activeStudentRate: pct(totalActiveStudents, totalStudents),
            assignments: classes.reduce((sum: number, cls: any) => sum + cls.assignments.length, 0),
            submissions: submissions.length,
            completionRate: pct(totalCompletedPairs, totalRequiredPairs),
            averageScore: avg(allScores),
            averageAttempts: avg(allAttempts),
            averageSolveMinutes: avg(allSolveTimes),
            medianSolveMinutes: median(allSolveTimes),
          },
          classComparison,
          tagBreakdown: tagBreakdown.slice(0, 12),
          difficultyBreakdown,
          weeklyActivity,
          focusAreas: focusAreas.slice(0, 8),
          methodology: {
            score: 'Percentual de testes aprovados na submissão mais recente de cada aluno por atividade.',
            completion: 'Percentual de atividades obrigatórias com ao menos uma submissão aceita no período.',
            solveTime: 'Tempo aproximado entre o início da sessão (ou primeiro evento disponível) e a submissão aceita, limitado à janela de 4 horas.',
          },
        },
      });
    }
  );
}
