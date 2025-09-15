import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10
});

export async function dbPing() {
  const [r] = await pool.query('SELECT 1 AS ok');
  return r?.[0]?.ok === 1;
}
