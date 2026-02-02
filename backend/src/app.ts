import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './utils/errorHandler';
import { arenasRouter } from './routes/arenasRouter';
import { partsRouter } from './routes/partsRouter';
import { combosRouter } from './routes/combosRouter';
import { battlesRouter } from './routes/battlesRouter';
import { syncRouter } from './routes/syncRouter';
import { providersRouter } from './routes/providersRouter';
import { backupRouter } from './routes/backupRouter';
import { uploadsRouter } from './routes/uploadsRouter';
import { decksRouter } from './routes/decksRouter';
import { bladersRouter } from './routes/bladersRouter';
import { uploadsDir } from './utils/storage';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: '*',
  }),
);
app.use(express.json());
app.use(morgan(env.port === 4000 ? 'dev' : 'combined'));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/parts', partsRouter);
app.use('/api/arenas', arenasRouter);
app.use('/api/combos', combosRouter);
app.use('/api/battles', battlesRouter);
app.use('/api/decks', decksRouter);
app.use('/api/bladers', bladersRouter);
app.use('/api/sync', syncRouter);
app.use('/api/providers', providersRouter);
app.use('/api/backup', backupRouter);
app.use('/api/uploads', uploadsRouter);

app.use(errorHandler);

export { app };
