// Rotas de clientes. Escrita bloqueada pra visualizador (requireEscritor no index).
import { Router } from 'express';
import * as clientes from '../services/clientes.js';

export const clientesRouter = Router();

clientesRouter.get('/', async (req, res, next) => {
  try { res.json({ clientes: await clientes.listar() }); }
  catch (err) { next(err); }
});

clientesRouter.post('/', async (req, res, next) => {
  try { res.status(201).json({ cliente: await clientes.criar(req.body ?? {}) }); }
  catch (err) { next(err); }
});

clientesRouter.put('/:id', async (req, res, next) => {
  try { res.json({ cliente: await clientes.atualizar(Number(req.params.id), req.body ?? {}) }); }
  catch (err) { next(err); }
});

clientesRouter.delete('/:id', async (req, res, next) => {
  try { await clientes.deletar(Number(req.params.id)); res.json({ ok: true }); }
  catch (err) { next(err); }
});
