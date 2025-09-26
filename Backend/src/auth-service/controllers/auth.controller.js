import bcrypt from 'bcrypt';
import { pool } from '../../db.js';
import { signJwt } from '../../_shared/jwt.js';

const ROL_ADMIN = 'ADMIN';
const ROL_BUSCADOR = 'USUARIO_BUSCADOR';
const ROL_EMPRESA  = 'USUARIO_EMPRESA';

export async function register(req, res) {
  try {
    const { nombre, email, password, rol } = req.body;
    if (![ROL_BUSCADOR, ROL_EMPRESA].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido para registro público' });
    }
    const [exists] = await pool.query('SELECT id FROM users WHERE email=? AND deleted_at IS NULL', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      'INSERT INTO users (nombre, email, password_hash, rol) VALUES (?,?,?,?)',
      [nombre, email, hash, rol]
    );

    const user = { id: r.insertId, nombre, email, rol };
    const token = signJwt({ id: user.id, email: user.email, rol: user.rol });
    return res.status(201).json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error registrando usuario' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id, nombre, email, password_hash, rol FROM users WHERE email=? AND deleted_at IS NULL',
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol };
    const token = signJwt({ id: user.id, email: user.email, rol: user.rol });
    return res.json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error en login' });
  }
}

export async function registerAdmin(req, res) {
  try {
    const { nombre, email, password } = req.body;

    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS n FROM users WHERE rol='ADMIN' AND deleted_at IS NULL"
    );
    if (countRows[0].n > 0) {
      return res.status(409).json({ error: 'Ya existe un ADMIN' });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      "INSERT INTO users (nombre, email, password_hash, rol) VALUES (?,?,?,'ADMIN')",
      [nombre, email, hash]
    );

    const user = { id: r.insertId, nombre, email, rol: ROL_ADMIN };
    const token = signJwt({ id: user.id, email: user.email, rol: user.rol });
    return res.status(201).json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error creando ADMIN' });
  }
}
