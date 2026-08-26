import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { registerSchema, loginSchema, Role } from '@fatecode/shared';

export async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post('/register', async (request, reply) => {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.errors,
      });
    }

    const { name, email, password, role } = parseResult.data;

    // Check if user already exists
    const existing = await (prisma as any).user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Este e-mail já está cadastrado na plataforma.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await (prisma as any).user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: (role as Role) || 'STUDENT',
        profile: {
          create: {
            totalXP: 0,
          },
        },
        streak: {
          create: {
            currentStreak: 0,
            maxStreak: 0,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const accessToken = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    return reply.status(201).send({
      message: 'Usuário registrado com sucesso.',
      user,
      tokens: {
        accessToken,
      },
    });
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.errors,
      });
    }

    const { email, password } = parseResult.data;

    const user = await (prisma as any).user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        streak: true,
      },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'E-mail ou senha incorretos.',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'E-mail ou senha incorretos.',
      });
    }

    const accessToken = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      profile: user.profile,
      streak: user.streak,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return reply.send({
      message: 'Login realizado com sucesso.',
      user: userResponse,
      tokens: {
        accessToken,
      },
    });
  });

  // Get Current Authenticated User (Me)
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userReq = (request as any).user;
    const user = await (prisma as any).user.findUnique({
      where: { id: userReq.id },
      include: {
        profile: true,
        streak: true,
        classMemberships: {
          include: {
            class: {
              include: {
                course: {
                  include: {
                    faculty: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Not Found', message: 'Usuário não encontrado.' });
    }

    const { passwordHash: _, ...safeUser } = user;
    return reply.send({ user: safeUser });
  });
}
