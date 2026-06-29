// Rotas de usuários (admin). CRUD simples.

import { Router } from 'express';
import * as auth from '../services/auth.js';

export const usuariosRouter = Router();

usuariosRouter.get('/', async (req, res, next) => {
  try { res.json({ usuarios: await auth.listar() }); }
  catch (err) { next(err); }
});

usuariosRouter.post('/', async (req, res, next) => {
  try { res.status(201).json({ usuario: await auth.criar(req.body ?? {}) }); }
  catch (err) { next(err); }
});

usuariosRouter.put('/:id', async (req, res, next) => {
  try { res.json({ usuario: await auth.atualizar(Number(req.params.id), req.body ?? {}) }); }
  catch (err) { next(err); }
});

usuariosRouter.delete('/:id', async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Você não pode excluir o próprio usuário' });
    }
    await auth.deletar(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) { next(err); }
});
