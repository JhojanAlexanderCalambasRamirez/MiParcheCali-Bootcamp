import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authGuard(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const bearer = h.startsWith('Bearer ') ? h.slice(7) : null;
    const alt = req.headers['x-access-token'];
    const token = bearer || alt || (h && !h.includes(' ') ? h : null);
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    req.user = jwt.verify(token, config.jwt.secret);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
