import crypto from 'crypto';
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
      sql += ' AND MATCH(p.titulo, p.descripcion, p.zona, p.direccion) AGAINST (? IN NATURAL LANGUAGE MODE)';
      args.push(q);
    }

    sql += ' ORDER BY p.id DESC LIMIT 50';
    const [rows] = await pool.query(sql, args);
    return res.json(rows);
  } catch (e) {
    console.error('[patches.listPublic]', e);
    return res.status(500).json({ error: 'Error listando parches' });
  }
}
export async function detail(req, res) {
  try {
    const id = Number(req.params.id);

    const [[patch]] = await pool.query(
      `SELECT p.id, p.titulo, c.nombre AS categoria, p.descripcion, p.zona, p.telefono,
              p.direccion, p.link_red_social, p.cover_image_url, p.user_id, p.is_published, p.deleted_at
       FROM patches p
       JOIN categories c ON c.id=p.categoria_id
       WHERE p.id=?`, [id]
    );

    if (!patch || patch.deleted_at) return res.status(404).json({ error: 'No encontrado' });
    if (!patch.is_published) return res.status(403).json({ error: 'No publicado' });

    const [fotos] = await pool.query(
      'SELECT id, url, posicion FROM patch_photos WHERE patch_id=? ORDER BY posicion ASC', [id]
    );

    const fotosOut = fotos.map(ph => ({
      id: ph.id,
      posicion: ph.posicion,
      url: ph.url || `/patches/${id}/photos/${ph.id}`
    }));

    return res.json({
      id: patch.id,
      titulo: patch.titulo,
      categoria: patch.categoria,
      descripcion: patch.descripcion,
      zona: patch.zona,
      telefono: patch.telefono,
      direccion: patch.direccion,
      link_red_social: patch.link_red_social,
      cover_image_url: patch.cover_image_url, 
      user_id: patch.user_id,
      fotos: fotosOut
    });
  } catch (e) {
    console.error('[patches.detail]', e);
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
  } catch (e) {
    console.error('[patches.listMine]', e);
    return res.status(500).json({ error: 'Error listando mis parches' });
  }
}

export async function create(req, res) {
  try {
    const userId = req.user.id;
    const {
      titulo, categoria_id, descripcion, zona, telefono, direccion,
      link_red_social, cover_image_url, fotos = []
    } = req.body;

    const [r] = await pool.query(
      `INSERT INTO patches (user_id, titulo, categoria_id, descripcion, zona, telefono, direccion, link_red_social, cover_image_url)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [userId, titulo, categoria_id, descripcion, zona, telefono, direccion, link_red_social || null, cover_image_url || null]
    );

    const patchId = r.insertId;

    if (Array.isArray(fotos) && fotos.length) {
      const values = fotos.slice(0, 3).map((url, i) => [patchId, url, i + 1]);
      await pool.query('INSERT INTO patch_photos (patch_id, url, posicion) VALUES ?', [values]);
    }

    return res.status(201).json({ id: patchId });
  } catch (e) {
    console.error('[patches.create]', e);
    return res.status(500).json({ error: 'Error creando parche' });
  }
}

export async function update(req, res) {
  try {
    const id = Number(req.params.id);

    const [[owner]] = await pool.query(
      'SELECT user_id FROM patches WHERE id=? AND deleted_at IS NULL', [id]
    );
    if (!owner) return res.status(404).json({ error: 'No encontrado' });
    if (req.user.rol !== 'ADMIN' && owner.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Prohibido' });
    }

    const {
      titulo, categoria_id, descripcion, zona, telefono, direccion,
      link_red_social, cover_image_url, is_published
    } = req.body;

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
  } catch (e) {
    console.error('[patches.update]', e);
    return res.status(500).json({ error: 'Error actualizando parche' });
  }
}

export async function softDelete(req, res) {
  try {
    const id = Number(req.params.id);

    const [[owner]] = await pool.query(
      'SELECT user_id FROM patches WHERE id=? AND deleted_at IS NULL', [id]
    );
    if (!owner) return res.status(404).json({ error: 'No encontrado' });
    if (req.user.rol !== 'ADMIN' && owner.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Prohibido' });
    }

    await pool.query('UPDATE patches SET deleted_at=NOW() WHERE id=?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('[patches.softDelete]', e);
    return res.status(500).json({ error: 'Error eliminando parche' });
  }
}

export async function uploadPhotos(req, res) {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);

    const [[owner]] = await conn.query(
      'SELECT user_id, cover_image_url FROM patches WHERE id=? AND deleted_at IS NULL', [id]
    );
    if (!owner) { conn.release(); return res.status(404).json({ error: 'Parche no encontrado' }); }
    if (req.user.rol !== 'ADMIN' && owner.user_id !== req.user.id) {
      conn.release(); return res.status(403).json({ error: 'Prohibido' });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) { conn.release(); return res.status(400).json({ error: 'No se adjuntaron archivos (photos)' }); }

    await conn.beginTransaction();

    const [[pos]] = await conn.query(
      'SELECT COALESCE(MAX(posicion),0) AS nextPos FROM patch_photos WHERE patch_id=?', [id]
    );
    let next = Number(pos.nextPos) + 1;

    const inserted = [];
    for (const f of files) {
      const checksum = crypto.createHash('md5').update(f.buffer).digest('hex');
      const [r] = await conn.query(
        `INSERT INTO patch_photos (patch_id, url, posicion, mime_type, size_bytes, data, checksum_md5)
         VALUES (?, NULL, ?, ?, ?, ?, ?)`,
        [id, next++, f.mimetype, f.size, f.buffer, checksum]
      );
      inserted.push({ id: r.insertId, posicion: next - 1 });
    }

    if (!owner.cover_image_url && inserted.length) {
      const coverPath = `/patches/${id}/photos/${inserted[0].id}`;
      await conn.query('UPDATE patches SET cover_image_url=? WHERE id=?', [coverPath, id]);
    }

    await conn.commit();
    conn.release();

    const photos = inserted.map(p => ({ id: p.id, posicion: p.posicion, url: `/patches/${id}/photos/${p.id}` }));
    return res.status(201).json({ ok: true, photos });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    conn.release();
    console.error('[patches.uploadPhotos]', e);
    return res.status(500).json({ error: 'Error subiendo fotos' });
  }
}
export async function servePhoto(req, res) {
  try {
    const patchId = Number(req.params.id);
    const photoId = Number(req.params.photoId);

    const [[ph]] = await pool.query(
      `SELECT ph.id, ph.mime_type, ph.data, p.is_published, p.deleted_at
       FROM patch_photos ph
       JOIN patches p ON p.id = ph.patch_id
       WHERE ph.id=? AND ph.patch_id=?`,
      [photoId, patchId]
    );
    if (!ph || ph.deleted_at) return res.status(404).json({ error: 'No encontrado' });

    if (!ph.is_published) return res.status(403).json({ error: 'No publicado' });

    res.setHeader('Content-Type', ph.mime_type || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).end(ph.data); 
  } catch (e) {
    console.error('[patches.servePhoto]', e);
    return res.status(500).json({ error: 'Error sirviendo foto' });
  }
}

export async function deletePhoto(req, res) {
  const conn = await pool.getConnection();
  try {
    const patchId = Number(req.params.id);
    const photoId = Number(req.params.photoId);

    const [[owner]] = await conn.query(
      'SELECT user_id, cover_image_url FROM patches WHERE id=? AND deleted_at IS NULL', [patchId]
    );
    if (!owner) { conn.release(); return res.status(404).json({ error: 'Parche no encontrado' }); }
    if (req.user.rol !== 'ADMIN' && owner.user_id !== req.user.id) {
      conn.release(); return res.status(403).json({ error: 'Prohibido' });
    }

    const [[ph]] = await conn.query(
      'SELECT id FROM patch_photos WHERE id=? AND patch_id=?', [photoId, patchId]
    );
    if (!ph) { conn.release(); return res.status(404).json({ error: 'Foto no encontrada' }); }

    const wasCover = owner.cover_image_url && owner.cover_image_url.endsWith(`/patches/${patchId}/photos/${photoId}`);

    await conn.beginTransaction();
    await conn.query('DELETE FROM patch_photos WHERE id=?', [photoId]);
    if (wasCover) {
      await conn.query('UPDATE patches SET cover_image_url=NULL WHERE id=?', [patchId]);
    }
    await conn.commit();
    conn.release();

    return res.json({ ok: true, cleared_cover: wasCover });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    conn.release();
    console.error('[patches.deletePhoto]', e);
    return res.status(500).json({ error: 'Error eliminando foto' });
  }
}
