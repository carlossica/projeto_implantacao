// POST /api/auth/login        — { email, senha } -> seta cookie httpOnly
// POST /api/auth/logout       — limpa cookie
// GET  /api/auth/me           — usuário corrente
// POST /api/auth/trocar-senha — { senha_atual, senha_nova }

import { Router } from 'express';
import * as auth from '../services/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';

export const authRouter = Router();

function setarCookieSessao(res, token) {
  res.cookie(auth.COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: config.sessionMaxAgeMs,
  });
}

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body ?? {};
    const u = await auth.autenticar(email, senha);
    const token = auth.emitirToken(u);
    setarCookieSessao(res, token);
    res.json({ usuario: u });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie(auth.COOKIE, { path: '/' });
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ usuario: req.user });
});

authRouter.post('/trocar-senha', requireAuth, async (req, res, next) => {
  try {
    const { senha_atual, senha_nova } = req.body ?? {};
    const u = await auth.trocarSenha(req.user.id, senha_atual, senha_nova);
    const token = auth.emitirToken(u);
    setarCookieSessao(res, token);
    res.json({ usuario: u });
  } catch (err) {
    next(err);
  }
});
