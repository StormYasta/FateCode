import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { Role } from '@fatecode/shared';

export interface UserPayload {
  id: string;
  email: string;
  role: Role;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserPayload;
    user: UserPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<UserPayload>();
    
    // Check if user still exists and is active
    const user = await (prisma as any).user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Usuário inválido ou inativo.' });
    }

    (request as any).user = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
    };
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Token de autenticação inválido ou expirado.' });
  }
}
