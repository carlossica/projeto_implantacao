// Middlewares de autenticação. Lê o cookie httpOnly `sess`, valida o JWT,
// hidrata req.user. 401 se ausente/inválido.

import { verificarToken, obter, COOKIE } from '../services/auth.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Não autenticado' });
    const payload = verificarToken(token);
    if (!payload) return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    // Re-valida no banco — usuário desativado perde acesso na hora.
    const usuario = await obter(payload.id);
    if (!usuario || !usuario.ativo) return res.status(401).json({ error: 'Usuário inativo' });
    req.user = usuario;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  if (req.user.papel !== 'admin') return res.status(403).json({ error: 'Acesso restrito a administradores' });
  next();
}

// Bloqueia mutações (POST/PUT/PATCH/DELETE) pra visualizador. GET passa livre.
export function requireEscritor(req, res, next) {
  const ESCRITA = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  if (!ESCRITA.has(req.method)) return next();
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  if (req.user.papel === 'admin' || req.user.papel === 'editor') return next();
  return res.status(403).json({
    error: 'Visualizadores não podem criar ou editar. Peça acesso de Editor a um admin.',
    code: 'APENAS_LEITURA',
  });
}
