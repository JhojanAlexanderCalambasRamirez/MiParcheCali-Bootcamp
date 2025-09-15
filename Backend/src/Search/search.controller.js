import { pool } from '../shared/db.js';

export async function searchPlans(req, res, next) {
  try {
    const { q = '', category, zone, page = 1, pageSize = 10 } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 50);
    const offset = (p - 1) * ps;

    const params = [];
    const where = [`p.status = 'published'`];

    if (q) {
      where.push(`(p.title LIKE ? OR p.description LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      where.push(`p.category_id = ?`);
      params.push(Number(category));
    }
    if (zone) {
      where.push(`p.zone LIKE ?`);
      params.push(`%${zone}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM plans p
       ${whereSql}`,
      params
    );
    const total = totalRows[0].total;

    const [items] = await pool.query(
      `SELECT p.id, p.title, p.description, p.zone, p.category_id, c.name as category_name, p.created_at
       FROM plans p
       JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, ps, offset]
    );

    res.json({ items, total, page: p, pageSize: ps });
  } catch (err) {
    next(err);
  }
}
