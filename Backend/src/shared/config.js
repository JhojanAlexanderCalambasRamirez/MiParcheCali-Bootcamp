import 'dotenv/config';
export const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'parchecali'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev',
    expiresIn: process.env.JWT_EXPIRES || '2h'
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  ports: {
    auth: Number(process.env.AUTH_PORT || 3001),
    plans: Number(process.env.PLANS_PORT || 3002),
    search: Number(process.env.SEARCH_PORT || 3003),
    fav: Number(process.env.FAV_PORT || 3004)
  }
};

