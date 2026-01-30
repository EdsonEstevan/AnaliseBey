import { Router } from 'express';

import { partsProvider } from '../providers/partsProvider';
import { createPart } from '../modules/parts/parts.service';

export const providersRouter = Router();

providersRouter.get('/parts/source', (_req, res) => {
  res.json({
    provider: partsProvider.name,
    configured: partsProvider.isConfigured(),
  });
});

providersRouter.post('/parts/import', async (_req, res) => {
  if (!partsProvider.isConfigured()) {
    return res.status(202).json({
      message: 'Nenhuma fonte externa configurada. Configure EXTERNAL_PARTS_PROVIDER para ativar.',
      imported: 0,
    });
  }

  const parts = await partsProvider.fetchParts();
  for (const payload of parts) {
    await createPart(payload);
  }
  res.json({ imported: parts.length });
});
