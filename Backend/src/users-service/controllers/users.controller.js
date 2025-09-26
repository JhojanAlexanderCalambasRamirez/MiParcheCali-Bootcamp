import { pool } from '../../db.js';

export async function me(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, is_active, created_at FROM users WHERE id=? AND deleted_at IS NULL',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    return res.json(rows[0]);
  } catch {
    return res.status(500).json({ error: 'Error consultando perfil' });
  }
}

export async function list(req, res) {
  try {
    const { page = 1, limit = 20, rol } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Math.min(100, Number(limit)));
    const off = (p - 1) * l;

    const args = [];
    let where = 'WHERE deleted_at IS NULL';
    if (rol) { where += ' AND rol = ?'; args.push(rol); }

    const [rows] = await pool.query(
      `SELECT id, nombre, email, rol, is_active, created_at
       FROM users ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...args, l, off]
    );
    return res.json({ page: p, limit: l, data: rows });
  } catch {
    return res.status(500).json({ error: 'Error listando usuarios' });
  }
}

export async function detail(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, is_active, created_at FROM users WHERE id=? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    return res.json(rows[0]);
  } catch {
    return res.status(500).json({ error: 'Error en detalle' });
  }
}

export async function softDelete(req, res) {
  try {
    await pool.query('UPDATE users SET deleted_at=NOW() WHERE id=? AND deleted_at IS NULL', [req.params.id]);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Error eliminando usuario' });
  }
}
