import { pool } from '../shared/db.js';

function isOwnerOrAdmin(req, planOwnerId) {
  return req.user.role_name === 'admin' || req.user.id === planOwnerId;
}

// Crea plan (rol: plan o admin)
export async function createPlan(req, res, next) {
  try {
    const { title, description, category_id, zone, contact_url, contact_phone, photos = [] } = req.body;

    if (!title || !description || !category_id) {
      return res.status(422).json({ error: 'title, description y category_id son obligatorios' });
    }

    const userId = req.user.id; // dueño del plan
    const [result] = await pool.query(
      `INSERT INTO plans (user_id, category_id, title, description, zone, contact_url, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [userId, category_id, title, description, zone || null, contact_url || null, contact_phone || null]
    );

    const planId = result.insertId;

    // Fotos opcionales (urls)
    if (Array.isArray(photos) && photos.length > 0) {
      const values = photos.map(u => [planId, u, null, null, 0]);
      await pool.query(
        `INSERT INTO plan_photos (plan_id, url, mime_type, size_bytes, is_cover) VALUES ?`,
        [values]
      );
    }

    const [created] = await pool.query(`SELECT * FROM plans WHERE id = ?`, [planId]);
    res.status(201).json(created[0]);
  } catch (err) {
    next(err);
  }
}

// Lista planes publicados (o todos si admin)
export async function listPlans(req, res, next) {
  try {
    const isAdmin = req.user?.role_name === 'admin';
    const where = isAdmin ? '1=1' : `status='published'`;
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM plans p
       JOIN categories c ON c.id = p.category_id
       WHERE ${where}
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getPlan(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, u.full_name as owner_name
       FROM plans p
       JOIN categories c ON c.id = p.category_id
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });

    const [photos] = await pool.query(`SELECT id,url,is_cover FROM plan_photos WHERE plan_id = ?`, [id]);
    const plan = rows[0];
    plan.photos = photos;
    res.json(plan);
  } catch (err) {
    next(err);
  }
}

export async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, category_id, zone, contact_url, contact_phone, status } = req.body;

    const [rows] = await pool.query(`SELECT user_id FROM plans WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });
    const ownerId = rows[0].user_id;

    if (!isOwnerOrAdmin(req, ownerId)) return res.status(403).json({ error: 'Prohibido' });

    await pool.query(
      `UPDATE plans SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         category_id = COALESCE(?, category_id),
         zone = COALESCE(?, zone),
         contact_url = COALESCE(?, contact_url),
         contact_phone = COALESCE(?, contact_phone),
         status = COALESCE(?, status),
         updated_at = NOW()
       WHERE id = ?`,
      [title, description, category_id, zone, contact_url, contact_phone, status, id]
    );

    const [out] = await pool.query(`SELECT * FROM plans WHERE id = ?`, [id]);
    res.json(out[0]);
  } catch (err) {
    next(err);
  }
}

export async function deletePlan(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT user_id FROM plans WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });

    const ownerId = rows[0].user_id;
    if (!isOwnerOrAdmin(req, ownerId)) return res.status(403).json({ error: 'Prohibido' });

    await pool.query(`DELETE FROM plans WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
