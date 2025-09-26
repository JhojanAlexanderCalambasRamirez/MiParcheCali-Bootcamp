import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from '../../src/config.js';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRoutes);

app.listen(config.ports.auth, () => {
  console.log(`[auth-service] escuchando en puerto ${config.ports.auth}`);
});
