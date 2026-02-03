import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { AuthTokenPayload, AuthUser } from '../types/auth';
import { mapAuthUser } from '../modules/auth/auth.service';
import { ApiError } from '../utils/apiError';

async function resolveUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.');
  }
  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'Usuário bloqueado.');
  }
  return mapAuthUser(user);
}

function extractToken(header?: string) {
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      throw new ApiError(401, 'Autenticação necessária.');
    }
    const payload = jwt.verify(token, env.authSecret) as AuthTokenPayload;
    if (!payload?.sub) {
      throw new ApiError(401, 'Token inválido.');
    }
    req.user = await resolveUser(payload.sub);
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    console.error('Erro de autenticação', err);
    next(new ApiError(401, 'Não foi possível validar sua sessão.'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Autenticação necessária.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Permissão insuficiente.'));
    }
    next();
  };
}
