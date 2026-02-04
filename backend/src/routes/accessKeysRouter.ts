import { Router } from 'express';
import { z } from 'zod';

import {
  AccessKeyScope,
  createAccessKeys,
  listAccessKeys,
  revokeAccessKey,
} from '../modules/accessKeys/accessKeys.service';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../utils/apiError';
import { hasWorkspaceScope } from '../utils/permissions';

export const accessKeysRouter = Router();

accessKeysRouter.use(authenticate);

accessKeysRouter.get('/', async (req, res) => {
  const schema = z.object({ scope: z.enum(['owned', 'all']).optional() });
  const { scope } = schema.parse(req.query);
  const effectiveScope: AccessKeyScope = scope === 'all' ? 'all' : 'owned';
    if (effectiveScope === 'all' && !hasWorkspaceScope(req.user!, 'ACCESS_KEYS_MANAGE')) {
      throw new ApiError(403, 'Permissão insuficiente para listar todos os convites.');
  }
  const keys = await listAccessKeys(req.user!, effectiveScope);
  res.json({ keys });
});

accessKeysRouter.post('/', async (req, res) => {
  const schema = z.object({
    quantity: z.number().int().min(1).max(20).default(3),
    maxUses: z.number().int().min(1).max(10).default(1),
  });
  const payload = schema.parse(req.body ?? {});
  const keys = await createAccessKeys(req.user!, payload.quantity, payload.maxUses);
  res.status(201).json({ keys });
});

accessKeysRouter.post('/:id/revoke', async (req, res) => {
  const key = await revokeAccessKey(req.user!, req.params.id);
  res.json(key);
});
