import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { config } from '../shared/config.js';
import { dbPing } from '../shared/db.js';
import { errorHandler } from '../shared/middlewares/errorHandler.js';
import plansRoutes from './plans.routes.js';

const app = express();
app.use(morgan('dev'));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', async (_req, res) => res.json({ ok: await dbPing(), service: 'plans' }));
app.use('/api/plans', plansRoutes);
app.use(errorHandler);

app.listen(config.ports?.plans || 3002, () =>
  console.log(`Plans en http://localhost:${config.ports?.plans || 3002}/api/plans`)
);
