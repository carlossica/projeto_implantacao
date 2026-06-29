// Rotas do catálogo: módulos+funcionalidades, ERPs, métodos, fluxos, configs.
// Leitura: qualquer logado. Escrita (CRUD de catálogo/fluxos/config): admin.

import { Router } from 'express';
import * as catalogo from '../services/catalogo.js';
import { requireAdmin } from '../middleware/auth.js';
import { pool } from '../db/client.js';

export const catalogoRouter = Router();

// ----------------------------------------------------------------- Leitura --
catalogoRouter.get('/modulos', async (req, res, next) => {
  try { res.json({ modulos: await catalogo.modulosComFuncionalidades() }); }
  catch (err) { next(err); }
});

catalogoRouter.get('/erps', async (req, res, next) => {
  try { res.json({ erps: await catalogo.listarErps() }); }
  catch (err) { next(err); }
});

catalogoRouter.get('/metodos-integracao', async (req, res, next) => {
  try { res.json({ metodos: await catalogo.listarMetodosIntegracao() }); }
  catch (err) { next(err); }
});

catalogoRouter.get('/hospedagem', async (req, res, next) => {
  try { res.json({ hospedagem: await catalogo.listarTiposHospedagem() }); }
  catch (err) { next(err); }
});

catalogoRouter.get('/fluxos-integracao', async (req, res, next) => {
  try { res.json({ fluxos: await catalogo.listarFluxosIntegracao(req.query.contexto ?? null) }); }
  catch (err) { next(err); }
});

catalogoRouter.get('/configuracoes', async (req, res, next) => {
  try { res.json({ configuracoes: await catalogo.obterConfiguracoes() }); }
  catch (err) { next(err); }
});

// ------------------------------------------------------ Módulos (admin) -----
catalogoRouter.post('/modulos', requireAdmin, async (req, res, next) => {
  try { res.status(201).json({ modulo: await catalogo.criarModulo(req.body ?? {}) }); }
  catch (err) { next(err); }
});

catalogoRouter.put('/modulos/:id', requireAdmin, async (req, res, next) => {
  try { res.json({ modulo: await catalogo.atualizarModulo(Number(req.params.id), req.body ?? {}) }); }
  catch (err) { next(err); }
});

catalogoRouter.delete('/modulos/:id', requireAdmin, async (req, res, next) => {
  try { await catalogo.deletarModulo(Number(req.params.id)); res.json({ ok: true }); }
  catch (err) { next(err); }
});

// ------------------------------------------------ Funcionalidades (admin) ---
catalogoRouter.post('/funcionalidades', requireAdmin, async (req, res, next) => {
  try { res.status(201).json({ funcionalidade: await catalogo.criarFuncionalidade(req.body ?? {}) }); }
  catch (err) { next(err); }
});

catalogoRouter.put('/funcionalidades/:id', requireAdmin, async (req, res, next) => {
  try { res.json({ funcionalidade: await catalogo.atualizarFuncionalidade(Number(req.params.id), req.body ?? {}) }); }
  catch (err) { next(err); }
});

catalogoRouter.delete('/funcionalidades/:id', requireAdmin, async (req, res, next) => {
  try { await catalogo.deletarFuncionalidade(Number(req.params.id)); res.json({ ok: true }); }
  catch (err) { next(err); }
});

// ------------------------------------------ Fluxos de integração (admin) ----
catalogoRouter.post('/fluxos-integracao', requireAdmin, async (req, res, next) => {
  try { res.status(201).json({ fluxo: await catalogo.criarFluxo(req.body ?? {}) }); }
  catch (err) { next(err); }
});

catalogoRouter.put('/fluxos-integracao/:id', requireAdmin, async (req, res, next) => {
  try { res.json({ fluxo: await catalogo.atualizarFluxo(Number(req.params.id), req.body ?? {}) }); }
  catch (err) { next(err); }
});

catalogoRouter.delete('/fluxos-integracao/:id', requireAdmin, async (req, res, next) => {
  try { await catalogo.deletarFluxo(Number(req.params.id)); res.json({ ok: true }); }
  catch (err) { next(err); }
});

// ------------------------------------------------------- ERPs (admin) -------
catalogoRouter.put('/erps/:id', requireAdmin, async (req, res, next) => {
  try { res.json({ erp: await catalogo.atualizarErp(Number(req.params.id), req.body ?? {}) }); }
  catch (err) { next(err); }
});

// ------------------------------------------ Tipos de hospedagem (admin) -----
catalogoRouter.post('/hospedagem', requireAdmin, async (req, res, next) => {
  try { res.status(201).json({ hospedagem: await catalogo.criarHospedagem(req.body ?? {}) }); }
  catch (err) { next(err); }
});

catalogoRouter.put('/hospedagem/:id', requireAdmin, async (req, res, next) => {
  try { res.json({ hospedagem: await catalogo.atualizarHospedagem(Number(req.params.id), req.body ?? {}) }); }
  catch (err) { next(err); }
});

catalogoRouter.delete('/hospedagem/:id', requireAdmin, async (req, res, next) => {
  try { await catalogo.deletarHospedagem(Number(req.params.id)); res.json({ ok: true }); }
  catch (err) { next(err); }
});

// ------------------------------------------------- Configurações (admin) ----
catalogoRouter.put('/configuracoes/:chave', requireAdmin, async (req, res, next) => {
  try {
    const valor = String(req.body?.valor ?? '');
    await pool.query(
      `INSERT INTO configuracoes (chave, valor) VALUES ($1,$2)
       ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = now()`,
      [req.params.chave, valor]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});
