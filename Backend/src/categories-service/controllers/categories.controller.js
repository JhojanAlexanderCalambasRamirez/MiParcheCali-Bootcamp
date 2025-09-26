import { pool } from '../../db.js';

export async function list(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, nombre, slug FROM categories ORDER BY nombre ASC');
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Error listando categorías' });
  }
}

export async function create(req, res) {
  try {
    const { nombre, slug } = req.body;
    const [r] = await pool.query('INSERT INTO categories (nombre, slug) VALUES (?,?)', [nombre, slug]);
    return res.status(201).json({ id: r.insertId, nombre, slug });
  } catch {
    return res.status(500).json({ error: 'Error creando categoría' });
  }
}

export async function remove(req, res) {
  try {
    await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Error eliminando categoría' });
  }
}
