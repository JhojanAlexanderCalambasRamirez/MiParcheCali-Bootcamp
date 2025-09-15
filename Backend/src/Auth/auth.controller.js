import jwt from 'jsonwebtoken';
import { pool } from '../shared/db.js';
import { config } from '../shared/config.js';
import { hashPassword, comparePassword } from '../shared/utils/password.js';

async function roleName(role_id) {
  const [r] = await pool.query('SELECT name FROM roles WHERE id=?', [role_id]);
  return r?.[0]?.name || null;
}

export async function register(req, res, next) {
  try {
    const { full_name, email, password, role_id } = req.body;
    if (!full_name || !email || !password || !role_id)
      return res.status(422).json({ error: 'full_name, email, password y role_id son obligatorios' });

    const [e] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (e.length) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = await hashPassword(password);
    const [ins] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role_id, is_active) VALUES (?,?,?,?,1)',
      [full_name, email, hash, role_id]
    );
    const id = ins.insertId;
    const role_name = await roleName(role_id);

    const token = jwt.sign({ id, email, full_name, role_id, role_name }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.status(201).json({ id, email, full_name, role_id, role_name, token });
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(422).json({ error: 'email y password son obligatorios' });

    const [r] = await pool.query('SELECT id,full_name,email,password_hash,role_id,is_active FROM users WHERE email=?', [email]);
    const u = r?.[0];
    if (!u || !u.is_active) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await comparePassword(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const role_name = await roleName(u.role_id);
    const token = jwt.sign({ id: u.id, email: u.email, full_name: u.full_name, role_id: u.role_id, role_name }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.json({ id: u.id, email: u.email, full_name: u.full_name, role_id: u.role_id, role_name, token });
  } catch (err) { next(err); }
}

export async function me(req, res) { res.json({ user: req.user }); }
