import fastify, { FastifyInstance, FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { env } from './config/env.js';
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { facultyRoutes } from './routes/faculty.routes.js';
import { courseRoutes } from './routes/course.routes.js';
import { classRoutes } from './routes/class.routes.js';
import { classContentRoutes } from './routes/classContent.routes.js';
import { learningPathRoutes } from './routes/learningPath.routes.js';
import { moduleRoutes } from './routes/module.routes.js';
import { topicRoutes } from './routes/topic.routes.js';
import { challengeRoutes } from './routes/challenge.routes.js';
import { academicExerciseRoutes } from './routes/academicExercise.routes.js';
import { assignmentRoutes } from './routes/assignment.routes.js';
import { codewarsRoutes } from './routes/codewars.routes.js';
import { executionRoutes } from './routes/execution.routes.js';
import { gamificationRoutes } from './routes/gamification.routes.js';
import { communityRoutes } from './routes/community.routes.js';
import { integrityRoutes } from './routes/integrity.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { teacherAnalyticsRoutes } from './routes/teacherAnalytics.routes.js';

export async function buildServer(): Promise<FastifyInstance> {
  const app = fastify({
    logger: env.NODE_ENV === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    } : false,
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  if (env.NODE_ENV !== 'test') {
    await app.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });
  }

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  const uploadRoot = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
  const uploadFiles = path.join(uploadRoot, 'files');
  await mkdir(uploadFiles, { recursive: true });

  await app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024,
      files: 1,
      fields: 8,
    },
  });

  await app.register(fastifyStatic, {
    root: uploadFiles,
    prefix: '/uploads/',
    decorateReply: false,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'FateCode Academic & Gamified API',
        description: 'Plataforma acadêmica gamificada com módulos de programação e disciplinas.',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Local development server',
        },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: error.name || 'Application Error',
        message: error.message,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Ocorreu um erro interno no servidor.',
    });
  });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(facultyRoutes, { prefix: '/api/faculties' });
  await app.register(courseRoutes, { prefix: '/api/courses' });
  await app.register(classRoutes, { prefix: '/api/classes' });
  await app.register(classContentRoutes, { prefix: '/api/classes' });
  await app.register(learningPathRoutes, { prefix: '/api/learning-paths' });
  await app.register(moduleRoutes, { prefix: '/api/modules' });
  await app.register(topicRoutes, { prefix: '/api/topics' });
  await app.register(challengeRoutes, { prefix: '/api/challenges' });
  await app.register(academicExerciseRoutes, { prefix: '/api/academic-exercises' });
  await app.register(assignmentRoutes, { prefix: '/api/assignments' });
  await app.register(codewarsRoutes, { prefix: '/api/codewars' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(teacherAnalyticsRoutes, { prefix: '/api/teacher' });
  await app.register(executionRoutes, { prefix: '/api' });
  await app.register(gamificationRoutes, { prefix: '/api' });
  await app.register(communityRoutes, { prefix: '/api' });
  await app.register(integrityRoutes, { prefix: '/api' });

  return app;
}
