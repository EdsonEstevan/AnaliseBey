import { Router } from 'express';
import { z } from 'zod';

import {
  getProfile,
  loginAsVisitor,
  loginWithPassword,
  registerWithAccessKey,
} from '../modules/auth/auth.service';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
});

const registerSchema = z.object({
  name: z.string().min(3),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  accessCode: z.string().min(6),
});

authRouter.post('/login', async (req, res) => {
  const credentials = loginSchema.parse(req.body);
  const result = await loginWithPassword(credentials.username, credentials.password);
  res.json(result);
});

authRouter.post('/register', async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const result = await registerWithAccessKey(payload);
  res.status(201).json(result);
});

authRouter.post('/visitor', async (_req, res) => {
  const result = await loginAsVisitor();
  res.json(result);
});

authRouter.get('/me', authenticate, async (req, res) => {
  const user = await getProfile(req.user!.id);
  res.json({ user });
});
