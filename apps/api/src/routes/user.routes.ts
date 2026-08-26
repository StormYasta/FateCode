import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { updateProfileSchema, Role } from '@fatecode/shared';
import { z } from 'zod';

export async function userRoutes(fastify: FastifyInstance) {
  // List Users (Admin and Professor only)
  fastify.get(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const querySchema = z.object({
        role: z.enum(['ADMIN', 'PROFESSOR', 'STUDENT']).optional(),
        search: z.string().optional(),
        classId: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      });

      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const { role, search, classId, page, limit } = parsed.data;
      const skip = (page - 1) * limit;

      const where: any = { isActive: true };
      if (role) where.role = role as Role;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (classId) {
        where.classMemberships = {
          some: { classId },
        };
      }

      const [users, total] = await Promise.all([
        (prisma as any).user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
            bio: true,
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
            createdAt: true,
          },
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        (prisma as any).user.count({ where }),
      ]);

      return reply.send({
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  );

  // Update own profile
  fastify.put(
    '/profile',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userReq = (request as any).user;
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const { name, bio, avatarUrl } = parsed.data;

      const updatedUser = await (prisma as any).user.update({
        where: { id: userReq.id },
        data: {
          ...(name && { name }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          bio: true,
          updatedAt: true,
        },
      });

      return reply.send({
        message: 'Perfil atualizado com sucesso.',
        user: updatedUser,
      });
    }
  );

  // Get User by ID (Public Profile)
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await (prisma as any).user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        profile: {
          select: {
            totalXP: true,
            githubUsername: true,
            codewarsUsername: true,
            preferredLanguage: true,
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
            role: true,
            class: {
              select: {
                id: true,
                name: true,
                code: true,
                semester: true,
                year: true,
                course: {
                  select: {
                    name: true,
                    code: true,
                    faculty: {
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
        },
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Not Found', message: 'Usuário não encontrado.' });
    }

    return reply.send({ user });
  });

  // Change User Role (Admin only)
  fastify.patch(
    '/:id/role',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const roleSchema = z.object({
        role: z.enum(['ADMIN', 'PROFESSOR', 'STUDENT']),
      });

      const parsed = roleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).user.update({
        where: { id },
        data: { role: parsed.data.role as Role },
        select: { id: true, name: true, email: true, role: true },
      });

      return reply.send({
        message: 'Papel do usuário atualizado com sucesso.',
        user: updated,
      });
    }
  );
}
