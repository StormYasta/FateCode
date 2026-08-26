import { prisma } from '../plugins/prisma.js';

export class GamificationService {
  /**
   * Check and unlock achievements for user
   */
  static async checkAndUnlockAchievements(userId: string) {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      include: {
        streak: true,
        submissions: {
          where: { status: 'ACCEPTED' },
          include: { challenge: true },
        },
        achievements: true,
      },
    });

    if (!user) return;

    const unlockedAchievementIds = new Set(user.achievements.map((a: any) => a.achievementId));
    const allAchievements = await (prisma as any).achievement.findMany();

    for (const ach of allAchievements) {
      if (unlockedAchievementIds.has(ach.id)) continue;

      let shouldUnlock = false;

      switch (ach.code) {
        case 'FIRST_CHALLENGE':
          if (user.submissions.length >= 1) shouldUnlock = true;
          break;
        case 'STREAK_7':
          if ((user.streak?.currentStreak || 0) >= 7) shouldUnlock = true;
          break;
        case 'ALGORITHMIST':
          const algoCount = user.submissions.filter((s: any) => s.challenge?.tags?.includes('algorithms')).length;
          if (algoCount >= 20 || user.submissions.length >= 20) shouldUnlock = true;
          break;
        case 'NIGHTMARE_1KYU':
          const has1Kyu = user.submissions.some((s: any) => s.challenge?.difficulty === 'KYU_1');
          if (has1Kyu) shouldUnlock = true;
          break;
        case 'TOP_3_SEASON':
          // Can be granted during season closing
          break;
      }

      if (shouldUnlock) {
        await (prisma as any).userAchievement.create({
          data: {
            userId,
            achievementId: ach.id,
          },
        });

        // Grant XP for achievement
        await (prisma as any).xPTransaction.create({
          data: {
            userId,
            amount: ach.xpReward,
            reason: `Conquista desbloqueada: ${ach.title}`,
            referenceId: ach.id,
          },
        });

        await (prisma as any).profile.update({
          where: { userId },
          data: {
            totalXP: {
              increment: ach.xpReward,
            },
          },
        });
      }
    }
  }

  /**
   * Fetch 3-Level Rankings (Faculty, Course, Class)
   */
  static async getRankings(params: {
    level: 'FACULTY' | 'COURSE' | 'CLASS';
    targetId?: string;
    period?: 'ALL_TIME' | 'SEASON' | 'MONTHLY';
  }) {
    const { level, targetId } = params;

    let userFilter: any = {
      isActive: true,
      role: 'STUDENT',
    };

    if (level === 'CLASS' && targetId) {
      userFilter.classMemberships = {
        some: { classId: targetId },
      };
    } else if (level === 'COURSE' && targetId) {
      userFilter.classMemberships = {
        some: {
          class: { courseId: targetId },
        },
      };
    }

    const students = await (prisma as any).user.findMany({
      where: userFilter,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        profile: {
          select: {
            totalXP: true,
            githubUsername: true,
          },
        },
        streak: {
          select: {
            currentStreak: true,
            maxStreak: true,
          },
        },
        classMemberships: {
          select: {
            class: {
              select: {
                id: true,
                name: true,
                code: true,
                course: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        profile: {
          totalXP: 'desc',
        },
      },
      take: 100,
    });

    return students.map((s: any, idx: number) => ({
      position: idx + 1,
      id: s.id,
      name: s.name,
      email: s.email,
      totalXP: s.profile?.totalXP || 0,
      currentStreak: s.streak?.currentStreak || 0,
      maxStreak: s.streak?.maxStreak || 0,
      classes: s.classMemberships.map((m: any) => m.class),
    }));
  }
}
