export function roleGuard(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    const ok = roles.length === 0 || roles.includes(req.user.role_name);
    if (!ok) return res.status(403).json({ error: 'Prohibido' });
    next();
  };
}
