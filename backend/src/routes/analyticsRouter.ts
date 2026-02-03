import { Router } from 'express';
import { z } from 'zod';

import { getPartsAnalytics } from '../modules/analytics/partsAnalytics.service';
import { authenticate } from '../middleware/auth';

export const analyticsRouter = Router();

const partsAnalyticsQuerySchema = z.object({
  minBattles: z.coerce.number().int().min(1).max(1000).default(1),
  mode: z.enum(['all', 'likely']).optional().default('all'),
});

analyticsRouter.use(authenticate);

analyticsRouter.get('/parts', async (req, res) => {
  const query = partsAnalyticsQuerySchema.parse(req.query);
  const normalizedMinBattles = query.mode === 'likely' ? Math.max(10, query.minBattles) : query.minBattles;
  const payload = await getPartsAnalytics(req.user!.id, {
    minBattles: normalizedMinBattles,
    mode: query.mode,
  });
  res.json(payload);
});
