// Rotas de LRP. Escrita bloqueada pra visualizador (requireEscritor no index).
import { Router } from 'express';
import * as lrp from '../services/lrp.js';

export const lrpRouter = Router();

lrpRouter.get('/', async (req, res, next) => {
  try { res.json({ lrps: await lrp.listar() }); }
  catch (err) { next(err); }
});

lrpRouter.get('/:id', async (req, res, next) => {
  try { res.json({ lrp: await lrp.obter(Number(req.params.id)) }); }
  catch (err) { next(err); }
});

// Gera uma LRP a partir de uma simulação.
lrpRouter.post('/gerar', async (req, res, next) => {
  try {
    const simulacaoId = Number(req.body?.simulacao_id);
    if (!simulacaoId) return res.status(400).json({ error: 'simulacao_id obrigatório' });
    res.status(201).json({ lrp: await lrp.gerarDaSimulacao(simulacaoId, req.user?.id) });
  } catch (err) { next(err); }
});

lrpRouter.put('/:id', async (req, res, next) => {
  try { res.json({ lrp: await lrp.atualizar(Number(req.params.id), req.body ?? {}) }); }
  catch (err) { next(err); }
});

// Redefine a LRP para o estado inicial (regenera do template da simulação).
lrpRouter.post('/:id/redefinir', async (req, res, next) => {
  try { res.json({ lrp: await lrp.redefinir(Number(req.params.id)) }); }
  catch (err) { next(err); }
});

lrpRouter.put('/respostas/:respostaId', async (req, res, next) => {
  try { await lrp.salvarResposta(Number(req.params.respostaId), req.body?.resposta); res.json({ ok: true }); }
  catch (err) { next(err); }
});

lrpRouter.put('/itens/:itemId/aderencia', async (req, res, next) => {
  try { await lrp.salvarAderencia(Number(req.params.itemId), req.body ?? {}); res.json({ ok: true }); }
  catch (err) { next(err); }
});

lrpRouter.delete('/:id', async (req, res, next) => {
  try { await lrp.deletar(Number(req.params.id)); res.json({ ok: true }); }
  catch (err) { next(err); }
});
