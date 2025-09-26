import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from '../../src/config.js';
import categoriesRoutes from './routes/categories.routes.js';

const app = express();
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/categories', categoriesRoutes);

app.listen(config.ports.categories, () => {
  console.log(`[categories-service] puerto ${config.ports.categories}`);
});
