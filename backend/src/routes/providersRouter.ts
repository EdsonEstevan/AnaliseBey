import { Router } from 'express';

import { partsProvider } from '../providers/partsProvider';
import { createPart } from '../modules/parts/parts.service';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../utils/apiError';

export const providersRouter = Router();

providersRouter.use(authenticate);

providersRouter.get('/parts/source', (_req, res) => {
  res.json({
    provider: partsProvider.name,
    configured: partsProvider.isConfigured(),
  });
});

providersRouter.post('/parts/import', async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    throw new ApiError(403, 'Apenas administradores podem importar catálogos externos.');
  }
  if (!partsProvider.isConfigured()) {
    return res.status(202).json({
      message: 'Nenhuma fonte externa configurada. Configure EXTERNAL_PARTS_PROVIDER para ativar.',
      imported: 0,
    });
  }

  const parts = await partsProvider.fetchParts();
  for (const payload of parts) {
    await createPart(req.user!.id, payload);
  }
  res.json({ imported: parts.length });
});
