import { pool } from '../../db.js';

export async function listMine(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT p.id, p.titulo, p.cover_image_url
       FROM favorites f
       JOIN patches p ON p.id=f.patch_id
       WHERE f.user_id=? AND p.deleted_at IS NULL AND p.is_published=1
       ORDER BY f.id DESC`, [userId]
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Error listando favoritos' });
  }
}

export async function add(req, res) {
  try {
    const userId = req.user.id;
    const { patch_id } = req.body;
    await pool.query('INSERT IGNORE INTO favorites (user_id, patch_id) VALUES (?,?)', [userId, patch_id]);
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Error agregando a favoritos' });
  }
}

export async function remove(req, res) {
  try {
    const userId = req.user.id;
    const patchId = Number(req.params.patch_id);
    await pool.query('DELETE FROM favorites WHERE user_id=? AND patch_id=?', [userId, patchId]);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Error removiendo favorito' });
  }
}
