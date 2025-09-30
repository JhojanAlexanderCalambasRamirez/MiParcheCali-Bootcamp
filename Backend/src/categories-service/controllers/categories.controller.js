import { pool } from '../../db.js';
function toSlug(str = '') {
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')            
    .replace(/[\u0300-\u036f]/g, '')  
    .replace(/[^a-z0-9\s-]/g, '')   
    .replace(/\s+/g, '-')            
    .replace(/-+/g, '-');            
}

/** GET /categories (pública) */
export async function list(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, slug FROM categories ORDER BY nombre ASC'
    );
    return res.json(rows);
  } catch (e) {
    console.error('[categories.list] Error =>', e);
    return res.status(500).json({ error: 'Error listando categorías' });
  }
}

/** GET /categories/:id (pública) */
export async function detail(req, res) {
  try {
    const id = Number(req.params.id);
    const [[row]] = await pool.query(
      'SELECT id, nombre, slug FROM categories WHERE id=?',
      [id]
    );
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(row);
  } catch (e) {
    console.error('[categories.detail] Error =>', e);
    return res.status(500).json({ error: 'Error en detalle de categoría' });
  }
}

/** POST /categories (ADMIN) - Body: { nombre, slug? } */
export async function create(req, res) {
  try {
    const nombre = String(req.body?.nombre || '').trim();
    let slug = req.body?.slug !== undefined ? String(req.body.slug).trim() : '';

    if (!nombre) {
      return res.status(400).json({ error: 'Campo "nombre" es obligatorio' });
    }
    if (!slug) slug = toSlug(nombre);

    // Validar duplicados
    const [dups] = await pool.query(
      'SELECT id FROM categories WHERE nombre=? OR slug=?',
      [nombre, slug]
    );
    if (dups.length) {
      return res.status(409).json({ error: 'Nombre o slug ya existen' });
    }

    const [r] = await pool.query(
      'INSERT INTO categories (nombre, slug) VALUES (?, ?)',
      [nombre, slug]
    );
    return res.status(201).json({ id: r.insertId, nombre, slug });
  } catch (e) {
    console.error('[categories.create] Error =>', e);
    if (e?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Nombre o slug ya existen' });
    }
    return res.status(500).json({ error: 'Error creando categoría' });
  }
}

/** POST /categories/bulk (ADMIN) - Body: { items: [{ nombre, slug? }, ...] } */
export async function bulkCreate(req, res) {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({ error: 'Body inválido: se espera "items" como array no vacío' });
    }

    const results = [];
    for (const it of items) {
      const nombre = String(it?.nombre || '').trim();
      let slug = it?.slug !== undefined ? String(it.slug).trim() : '';

      if (!nombre) {
        results.push({ ok: false, error: 'nombre vacío' });
        continue;
      }
      if (!slug) slug = toSlug(nombre);

      try {
        const [dups] = await pool.query(
          'SELECT id FROM categories WHERE nombre=? OR slug=?',
          [nombre, slug]
        );
        if (dups.length) {
          results.push({ ok: false, error: 'duplicado', nombre, slug });
          continue;
        }
        const [r] = await pool.query(
          'INSERT INTO categories (nombre, slug) VALUES (?, ?)',
          [nombre, slug]
        );
        results.push({ ok: true, id: r.insertId, nombre, slug });
      } catch (e) {
        if (e?.code === 'ER_DUP_ENTRY') {
          results.push({ ok: false, error: 'duplicado', nombre, slug });
        } else {
          results.push({ ok: false, error: 'interno', nombre, slug });
        }
      }
    }

    // 207 Multi-Status para reportar resultado por ítem
    return res.status(207).json({ results });
  } catch (e) {
    console.error('[categories.bulkCreate] Error =>', e);
    return res.status(500).json({ error: 'Error en creación masiva' });
  }
}

/** PATCH /categories/:id (ADMIN) - Body: { nombre?, slug? } */
export async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const hasNombre = Object.prototype.hasOwnProperty.call(req.body, 'nombre');
    const hasSlug   = Object.prototype.hasOwnProperty.call(req.body, 'slug');

    if (!hasNombre && !hasSlug) {
      return res.status(400).json({ error: 'Debes enviar al menos "nombre" o "slug"' });
    }

    const nombre = hasNombre ? String(req.body.nombre || '').trim() : null;
    let slug = hasSlug ? String(req.body.slug || '').trim() : null;

    if (hasNombre && !nombre) {
      return res.status(400).json({ error: 'Si envías "nombre", no puede ser vacío' });
    }
    if (hasNombre && !hasSlug) {
      // Si cambias "nombre" y no envías "slug", lo generamos desde el nuevo nombre
      slug = toSlug(nombre);
    }

    // Validar existencia
    const [[row]] = await pool.query('SELECT id FROM categories WHERE id=?', [id]);
    if (!row) return res.status(404).json({ error: 'No encontrado' });

    // Duplicados en otras filas
    if ((hasNombre && nombre) || (hasSlug && slug)) {
      const args = [id];
      const parts = [];
      if (hasNombre && nombre) { parts.push('nombre=?'); args.push(nombre); }
      if (hasSlug && slug)     { parts.push('slug=?');   args.push(slug); }

      const [dups] = await pool.query(
        `SELECT id FROM categories WHERE id<>? AND (${parts.join(' OR ')})`,
        args
      );
      if (dups.length) {
        return res.status(409).json({ error: 'Nombre o slug ya están usados por otra categoría' });
      }
    }

    await pool.query(
      `UPDATE categories
       SET nombre=COALESCE(?, nombre),
           slug=COALESCE(?, slug)
       WHERE id=?`,
      [nombre, slug, id]
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error('[categories.update] Error =>', e);
    if (e?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Nombre o slug ya existen' });
    }
    return res.status(500).json({ error: 'Error actualizando categoría' });
  }
}

/**
 * DELETE /categories/:id (ADMIN)
 * Comportamiento:
 *  - Si hay parches asociados y NO se envía reassign_to -> 409
 *  - Si se envía reassign_to={idDestino}, re-asigna esos parches y elimina.
 */
export async function remove(req, res) {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    const reassignTo = req.query?.reassign_to ? Number(req.query.reassign_to) : null;

    // 1) Validar existencia de la categoría a eliminar
    const [[cat]] = await conn.query('SELECT id FROM categories WHERE id=?', [id]);
    if (!cat) { conn.release(); return res.status(404).json({ error: 'No encontrado' }); }

    // 2) Contar parches asociados
    const [[cnt]] = await conn.query(
      'SELECT COUNT(*) AS n FROM patches WHERE categoria_id=? AND deleted_at IS NULL',
      [id]
    );

    if (cnt.n > 0 && !reassignTo) {
      conn.release();
      return res.status(409).json({
        error: 'No se puede eliminar: hay parches asociados',
        parches_asociados: cnt.n,
        sugerencia: 'Proporciona ?reassign_to={idCategoriaDestino} para reasignar y eliminar'
      });
    }

    await conn.beginTransaction();

    // 3) Reasignar si corresponde
    if (cnt.n > 0 && reassignTo) {
      if (reassignTo === id) {
        throw new Error('reassign_to no puede ser igual a la categoría a eliminar');
      }
      const [[dest]] = await conn.query('SELECT id FROM categories WHERE id=?', [reassignTo]);
      if (!dest) throw new Error('Categoría destino (reassign_to) no existe');

      await conn.query(
        'UPDATE patches SET categoria_id=? WHERE categoria_id=? AND deleted_at IS NULL',
        [reassignTo, id]
      );
    }

    // 4) Eliminar categoría
    await conn.query('DELETE FROM categories WHERE id=?', [id]);

    await conn.commit();
    conn.release();
    return res.json({ ok: true, reassigned: Boolean(reassignTo), moved: cnt.n });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    conn.release();
    console.error('[categories.remove] Error =>', e);
    return res.status(500).json({ error: 'Error eliminando categoría', detalle: e?.message });
  }
}
