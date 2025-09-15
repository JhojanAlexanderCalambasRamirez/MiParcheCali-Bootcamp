import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { config } from '../shared/config.js';
import { dbPing } from '../shared/db.js';
import { errorHandler } from '../shared/middlewares/errorHandler.js';
import favoritesRoutes from './favorites.routes.js';

const app = express();
app.use(morgan('dev'));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', async (_req, res) => res.json({ ok: await dbPing(), service: 'favorites' }));
app.use('/api/favorites', favoritesRoutes);
app.use(errorHandler);

app.listen(config.ports?.fav || 3004, () =>
  console.log(`Favorites en http://localhost:${config.ports?.fav || 3004}/api/favorites`)
);
