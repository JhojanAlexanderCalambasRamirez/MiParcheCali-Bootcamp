import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from '../../src/config.js';
import usersRoutes from './routes/users.routes.js';

const app = express();
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/users', usersRoutes);

app.listen(config.ports.users, () => {
  console.log(`[users-service] puerto ${config.ports.users}`);
});
