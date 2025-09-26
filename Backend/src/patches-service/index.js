import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from '../../src/config.js';
import routes from './routes/patches.routes.js';

const app = express();
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/', routes);

app.listen(config.ports.patches, () => {
  console.log(`[patches-service] puerto ${config.ports.patches}`);
});
