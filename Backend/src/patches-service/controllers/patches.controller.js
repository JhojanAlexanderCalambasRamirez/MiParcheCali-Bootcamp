import { pool } from '../../db.js';

export async function listPublic(req, res) {
  try {
    const { q, categoria_id } = req.query;
    const args = [];
    let where = 'p.deleted_at IS NULL AND p.is_published=1';

    if (categoria_id) { where += ' AND p.categoria_id=?'; args.push(Number(categoria_id)); }
    let sql =
      `SELECT p.id, p.titulo, p.cover_image_url, c.nombre as categoria
       FROM patches p
       JOIN categories c ON c.id=p.categoria_id
       WHERE ${where}`;

    if (q && q.trim().length > 0) {
      // Intento FULLTEXT, si falla lo puedes cambiar por LIKE
      sql += ' AND MATCH(p.titulo, p.descripcion, p.zona, p.direccion) AGAINST (? IN NATURAL LANGUAGE MODE)';
      args.push(q);
    }

    sql += ' ORDER BY p.id DESC LIMIT 50';
    const [rows] = await pool.query(sql, args);
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Error listando parches' });
  }
}

export async function detail(req, res) {
  try {
    const id = Number(req.params.id);
    const [[patch]] = await pool.query(
      `SELECT p.id, p.titulo, c.nombre AS categoria, p.descripcion, p.zona, p.telefono,
              p.direccion, p.link_red_social, p.cover_image_url, p.user_id
       FROM patches p
       JOIN categories c ON c.id=p.categoria_id
       WHERE p.id=? AND p.deleted_at IS NULL AND p.is_published=1`, [id]
    );
    if (!patch) return res.status(404).json({ error: 'No encontrado' });

    const [fotos] = await pool.query(
      'SELECT id, url, posicion FROM patch_photos WHERE patch_id=? ORDER BY posicion ASC', [id]
    );
    return res.json({ ...patch, fotos });
  } catch {
    return res.status(500).json({ error: 'Error en detalle' });
  }
}

export async function listMine(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT id, titulo, is_published, created_at FROM patches
       WHERE user_id=? AND deleted_at IS NULL ORDER BY id DESC`, [userId]
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Error listando mis parches' });
  }
}

export async function create(req, res) {
  try {
    const userId = req.user.id;
    const { titulo, categoria_id, descripcion, zona, telefono, direccion, link_red_social, cover_image_url, fotos=[] } = req.body;

    const [r] = await pool.query(
      `INSERT INTO patches (user_id, titulo, categoria_id, descripcion, zona, telefono, direccion, link_red_social, cover_image_url)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [userId, titulo, categoria_id, descripcion, zona, telefono, direccion, link_red_social || null, cover_image_url || null]
    );

    const patchId = r.insertId;

    if (Array.isArray(fotos) && fotos.length) {
      const values = fotos.slice(0, 3).map((url, i) => [patchId, url, i+1]);
      await pool.query('INSERT INTO patch_photos (patch_id, url, posicion) VALUES ?', [values]);
    }

    return res.status(201).json({ id: patchId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error creando parche' });
  }
}

export async function update(req, res) {
  try {
    const id = Number(req.params.id);
    // Permitir que Admin o dueño edite; validación de dueño:
    const [[owner]] = await pool.query('SELECT user_id FROM patches WHERE id=? AND deleted_at IS NULL', [id]);
    if (!owner) return res.status(404).json({ error: 'No encontrado' });
    if (req.user.rol !== 'ADMIN' && owner.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Prohibido' });
    }

    const { titulo, categoria_id, descripcion, zona, telefono, direccion, link_red_social, cover_image_url, is_published } = req.body;
    await pool.query(
      `UPDATE patches SET
        titulo=COALESCE(?, titulo),
        categoria_id=COALESCE(?, categoria_id),
        descripcion=COALESCE(?, descripcion),
        zona=COALESCE(?, zona),
        telefono=COALESCE(?, telefono),
        direccion=COALESCE(?, direccion),
        link_red_social=COALESCE(?, link_red_social),
        cover_image_url=COALESCE(?, cover_image_url),
        is_published=COALESCE(?, is_published)
       WHERE id=?`,
      [titulo, categoria_id, descripcion, zona, telefono, direccion, link_red_social, cover_image_url, is_published, id]
    );
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Error actualizando parche' });
  }
}

export async function softDelete(req, res) {
  try {
    const id = Number(req.params.id);
    const [[owner]] = await pool.query('SELECT user_id FROM patches WHERE id=? AND deleted_at IS NULL', [id]);
    if (!owner) return res.status(404).json({ error: 'No encontrado' });
    if (req.user.rol !== 'ADMIN' && owner.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Prohibido' });
    }

    await pool.query('UPDATE patches SET deleted_at=NOW() WHERE id=?', [id]);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Error eliminando parche' });
  }
}
