import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { config } from '../shared/config.js';
import { dbPing } from '../shared/db.js';
import { errorHandler } from '../shared/middlewares/errorHandler.js';
import authRoutes from './auth.routes.js';

const app = express();
app.use(morgan('dev'));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', async (_req, res) => res.json({ ok: await dbPing(), service: 'auth' }));
app.use('/api/auth', authRoutes);
app.use(errorHandler);

app.listen(config.ports?.auth || 3001, () =>
  console.log(`Auth en http://localhost:${config.ports?.auth || 3001}/api/auth`)
);
