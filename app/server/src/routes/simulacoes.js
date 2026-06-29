// Rotas de simulações. Escrita bloqueada pra visualizador (requireEscritor no index).

import { Router } from 'express';
import * as simulacoes from '../services/simulacoes.js';

export const simulacoesRouter = Router();

simulacoesRouter.get('/', async (req, res, next) => {
  try { res.json({ simulacoes: await simulacoes.listar() }); }
  catch (err) { next(err); }
});

simulacoesRouter.get('/:id', async (req, res, next) => {
  try { res.json({ simulacao: await simulacoes.obter(Number(req.params.id)) }); }
  catch (err) { next(err); }
});

simulacoesRouter.post('/', async (req, res, next) => {
  try { res.status(201).json({ simulacao: await simulacoes.criar(req.body ?? {}, req.user?.id) }); }
  catch (err) { next(err); }
});

simulacoesRouter.put('/:id', async (req, res, next) => {
  try { res.json({ simulacao: await simulacoes.atualizar(Number(req.params.id), req.body ?? {}) }); }
  catch (err) { next(err); }
});

simulacoesRouter.put('/:id/modulos', async (req, res, next) => {
  try { res.json({ simulacao: await simulacoes.definirModulos(Number(req.params.id), req.body?.modulo_ids ?? []) }); }
  catch (err) { next(err); }
});

simulacoesRouter.put('/:id/funcionalidades/:funcId', async (req, res, next) => {
  try {
    res.json({
      simulacao: await simulacoes.marcarFuncionalidade(
        Number(req.params.id), Number(req.params.funcId), Boolean(req.body?.marcado)),
    });
  } catch (err) { next(err); }
});

simulacoesRouter.delete('/:id', async (req, res, next) => {
  try { await simulacoes.deletar(Number(req.params.id)); res.json({ ok: true }); }
  catch (err) { next(err); }
});
