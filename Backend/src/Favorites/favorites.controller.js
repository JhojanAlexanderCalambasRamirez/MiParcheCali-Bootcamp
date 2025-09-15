import { pool } from '../shared/db.js';

export async function addFavorite(req, res, next) {
  try {
    const userId = req.user.id;
    const { planId } = req.params;
    await pool.query(
      `INSERT IGNORE INTO favorites (user_id, plan_id) VALUES (?, ?)`,
      [userId, Number(planId)]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function removeFavorite(req, res, next) {
  try {
    const userId = req.user.id;
    const { planId } = req.params;
    await pool.query(`DELETE FROM favorites WHERE user_id = ? AND plan_id = ?`, [userId, Number(planId)]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function listFavorites(req, res, next) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.zone, c.name as category_name
       FROM favorites f
       JOIN plans p ON p.id = f.plan_id
       JOIN categories c ON c.id = p.category_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
