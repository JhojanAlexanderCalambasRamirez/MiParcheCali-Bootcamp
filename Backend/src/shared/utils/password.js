import bcrypt from 'bcryptjs';
export async function hashPassword(p) { const s = await bcrypt.genSalt(10); return bcrypt.hash(p, s); }
export async function comparePassword(p, h) { return bcrypt.compare(p, h); }
