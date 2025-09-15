import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { config } from '../shared/config.js';
import { dbPing } from '../shared/db.js';
import { errorHandler } from '../shared/middlewares/errorHandler.js';
import searchRoutes from './search.routes.js';

const app = express();
app.use(morgan('dev'));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', async (_req, res) => res.json({ ok: await dbPing(), service: 'search' }));
app.use('/api/search', searchRoutes);
app.use(errorHandler);

app.listen(config.ports?.search || 3003, () =>
  console.log(`Search en http://localhost:${config.ports?.search || 3003}/api/search`)
);
