import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from '../../src/config.js';
import routes from './routes/favorites.routes.js';

const app = express();
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/favorites', routes);

app.listen(config.ports.favorites, () => {
  console.log(`[favorites-service] puerto ${config.ports.favorites}`);
});
