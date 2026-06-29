// Leitura e manutenção do catálogo: módulos, funcionalidades, ERPs, métodos de
// integração e fluxos. Fonte de verdade da estimativa (importado do .xlsx).

import { pool } from '../db/client.js';
import { ValidationError, NotFoundError, ConflictError } from './erros.js';

// ---------------------------------------------------------------- Módulos ----
export async function listarModulos() {
  const { rows } = await pool.query(
    `SELECT m.id, m.nome, m.ordem, m.ativo,
            count(f.id) FILTER (WHERE f.ativo)::int AS qtd_funcionalidades,
            count(f.id) FILTER (WHERE f.ativo AND f.pacote_padrao)::int AS qtd_padrao
       FROM modulos m
       LEFT JOIN funcionalidades f ON f.modulo_id = m.id
      GROUP BY m.id
      ORDER BY m.ordem, m.nome`,
  );
  return rows;
}

// Módulos com suas funcionalidades aninhadas (pro formulário de simulação e admin).
export async function modulosComFuncionalidades({ somenteAtivos = true } = {}) {
  const cond = somenteAtivos ? 'WHERE f.ativo' : '';
  const { rows } = await pool.query(
    `SELECT f.id, f.modulo_id, f.funcionalidade_mae, f.nome, f.tipo,
            f.horas_minutos, f.pacote_padrao, f.ordem
       FROM funcionalidades f
       ${cond}
      ORDER BY f.modulo_id, f.ordem`,
  );
  const modulos = await listarModulos();
  const porModulo = new Map(modulos.map((m) => [m.id, { ...m, funcionalidades: [] }]));
  for (const f of rows) {
    porModulo.get(f.modulo_id)?.funcionalidades.push(f);
  }
  return [...porModulo.values()];
}

// --------------------------------------------------------------- Módulos ----
export async function criarModulo({ nome, ordem }) {
  const n = String(nome ?? '').trim();
  if (!n) throw new ValidationError('nome obrigatório', ['informe o nome do módulo']);
  // ordem: se não vier, joga pro fim.
  const ord = Number.isFinite(Number(ordem))
    ? Number(ordem)
    : (await pool.query('SELECT COALESCE(MAX(ordem), -1) + 1 AS n FROM modulos')).rows[0].n;
  try {
    const { rows } = await pool.query(
      `INSERT INTO modulos (nome, ordem) VALUES ($1, $2) RETURNING id, nome, ordem, ativo`,
      [n, ord],
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw new ConflictError('já existe um módulo com esse nome');
    throw err;
  }
}

export async function atualizarModulo(id, campos) {
  const sets = [];
  const params = [];
  let i = 1;
  if (campos.nome !== undefined) { sets.push(`nome = $${i++}`); params.push(String(campos.nome).trim()); }
  if (campos.ordem !== undefined) { sets.push(`ordem = $${i++}`); params.push(Number(campos.ordem) || 0); }
  if (campos.ativo !== undefined) { sets.push(`ativo = $${i++}`); params.push(Boolean(campos.ativo)); }
  if (sets.length === 0) throw new ValidationError('nada para atualizar');
  params.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE modulos SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, nome, ordem, ativo`, params);
    if (!rows[0]) throw new NotFoundError('módulo não encontrado');
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw new ConflictError('já existe um módulo com esse nome');
    throw err;
  }
}

export async function deletarModulo(id) {
  await pool.query('DELETE FROM modulos WHERE id = $1', [id]);
}

// ------------------------------------------------------- Funcionalidades ----
export async function criarFuncionalidade({ modulo_id, nome, funcionalidade_mae, tipo, horas_minutos, pacote_padrao }) {
  if (!modulo_id) throw new ValidationError('módulo obrigatório', ['informe o módulo']);
  const n = String(nome ?? '').trim();
  if (!n) throw new ValidationError('nome obrigatório', ['informe o nome da funcionalidade']);
  const ord = (await pool.query(
    'SELECT COALESCE(MAX(ordem), 0) + 1 AS n FROM funcionalidades WHERE modulo_id = $1', [modulo_id])).rows[0].n;
  const { rows } = await pool.query(
    `INSERT INTO funcionalidades (modulo_id, funcionalidade_mae, nome, tipo, horas_minutos, pacote_padrao, ordem)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, modulo_id, funcionalidade_mae, nome, tipo, horas_minutos, pacote_padrao, ordem, ativo`,
    [modulo_id, funcionalidade_mae ? String(funcionalidade_mae).trim() : null, n, tipo ?? null,
     Math.max(0, Math.round(Number(horas_minutos) || 0)), Boolean(pacote_padrao), ord],
  );
  return rows[0];
}

export async function deletarFuncionalidade(id) {
  await pool.query('DELETE FROM funcionalidades WHERE id = $1', [id]);
}

export async function atualizarFuncionalidade(id, campos) {
  const sets = [];
  const params = [];
  let i = 1;
  if (campos.nome !== undefined) { sets.push(`nome = $${i++}`); params.push(String(campos.nome).trim()); }
  if (campos.funcionalidade_mae !== undefined) { sets.push(`funcionalidade_mae = $${i++}`); params.push(campos.funcionalidade_mae ? String(campos.funcionalidade_mae).trim() : null); }
  if (campos.tipo !== undefined) { sets.push(`tipo = $${i++}`); params.push(campos.tipo); }
  if (campos.horas_minutos !== undefined) {
    const m = Number(campos.horas_minutos);
    if (!Number.isFinite(m) || m < 0) throw new ValidationError('horas inválidas', ['horas_minutos deve ser >= 0']);
    sets.push(`horas_minutos = $${i++}`); params.push(Math.round(m));
  }
  if (campos.pacote_padrao !== undefined) { sets.push(`pacote_padrao = $${i++}`); params.push(Boolean(campos.pacote_padrao)); }
  if (campos.ativo !== undefined) { sets.push(`ativo = $${i++}`); params.push(Boolean(campos.ativo)); }
  if (sets.length === 0) throw new ValidationError('nada para atualizar');
  params.push(id);
  const { rows } = await pool.query(
    `UPDATE funcionalidades SET ${sets.join(', ')} WHERE id = $${i}
     RETURNING id, modulo_id, funcionalidade_mae, nome, tipo, horas_minutos, pacote_padrao, ordem, ativo`,
    params,
  );
  if (!rows[0]) throw new NotFoundError('funcionalidade não encontrada');
  return rows[0];
}

// ------------------------------------------------------------------ Lookups --
export async function listarErps() {
  const { rows } = await pool.query(
    `SELECT id, nome, ordem, horas_instalacao FROM erps WHERE ativo ORDER BY ordem, nome`);
  return rows;
}

export async function atualizarErp(id, campos) {
  const sets = [];
  const params = [];
  let i = 1;
  if (campos.nome !== undefined) { sets.push(`nome = $${i++}`); params.push(String(campos.nome).trim()); }
  if (campos.horas_instalacao !== undefined) {
    const hr = Number(campos.horas_instalacao);
    if (!Number.isFinite(hr) || hr < 0) throw new ValidationError('horas inválidas', ['horas_instalacao deve ser >= 0']);
    sets.push(`horas_instalacao = $${i++}`); params.push(hr);
  }
  if (campos.ativo !== undefined) { sets.push(`ativo = $${i++}`); params.push(Boolean(campos.ativo)); }
  if (sets.length === 0) throw new ValidationError('nada para atualizar');
  params.push(id);
  const { rows } = await pool.query(
    `UPDATE erps SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, nome, ordem, horas_instalacao, ativo`, params);
  if (!rows[0]) throw new NotFoundError('ERP não encontrado');
  return rows[0];
}

export async function listarMetodosIntegracao() {
  const { rows } = await pool.query(`SELECT id, nome, ordem FROM metodos_integracao WHERE ativo ORDER BY ordem, nome`);
  return rows;
}

// ------------------------------------------------------ Tipos de hospedagem --
export async function listarTiposHospedagem() {
  const { rows } = await pool.query(
    `SELECT id, nome, horas, ordem, ativo FROM tipos_hospedagem ORDER BY ordem, nome`);
  return rows;
}

export async function criarHospedagem({ nome, horas }) {
  const n = String(nome ?? '').trim();
  if (!n) throw new ValidationError('nome obrigatório', ['informe o nome da hospedagem']);
  const ord = (await pool.query('SELECT COALESCE(MAX(ordem), -1) + 1 AS n FROM tipos_hospedagem')).rows[0].n;
  try {
    const { rows } = await pool.query(
      `INSERT INTO tipos_hospedagem (nome, horas, ordem) VALUES ($1, $2, $3) RETURNING id, nome, horas, ordem, ativo`,
      [n, Math.max(0, Number(horas) || 0), ord]);
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw new ConflictError('já existe uma hospedagem com esse nome');
    throw err;
  }
}

export async function atualizarHospedagem(id, campos) {
  const sets = [];
  const params = [];
  let i = 1;
  if (campos.nome !== undefined) { sets.push(`nome = $${i++}`); params.push(String(campos.nome).trim()); }
  if (campos.horas !== undefined) { sets.push(`horas = $${i++}`); params.push(Math.max(0, Number(campos.horas) || 0)); }
  if (campos.ativo !== undefined) { sets.push(`ativo = $${i++}`); params.push(Boolean(campos.ativo)); }
  if (sets.length === 0) throw new ValidationError('nada para atualizar');
  params.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE tipos_hospedagem SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, nome, horas, ordem, ativo`, params);
    if (!rows[0]) throw new NotFoundError('hospedagem não encontrada');
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw new ConflictError('já existe uma hospedagem com esse nome');
    throw err;
  }
}

export async function deletarHospedagem(id) {
  await pool.query('DELETE FROM tipos_hospedagem WHERE id = $1', [id]);
}

export async function listarFluxosIntegracao(contexto = null) {
  const { rows } = await pool.query(
    `SELECT id, contexto, fluxo, tabela, tipo, min_config, min_teste_carga, min_apoio, min_validacao, modulos_ativa, ordem
       FROM fluxos_integracao
      WHERE ativo AND ($1::text IS NULL OR contexto = $1)
      ORDER BY contexto, ordem`,
    [contexto],
  );
  return rows;
}

const FLUXO_COLS = `id, contexto, fluxo, tabela, tipo, min_config, min_teste_carga, min_apoio, min_validacao, modulos_ativa, ordem, ativo`;
const CONTEXTOS_FLUXO = ['solution', 'erp_terceiro'];

export async function criarFluxo(campos) {
  const contexto = String(campos.contexto ?? '').trim();
  if (!CONTEXTOS_FLUXO.includes(contexto)) {
    throw new ValidationError('contexto inválido', [`contexto deve ser: ${CONTEXTOS_FLUXO.join(', ')}`]);
  }
  const ord = (await pool.query(
    'SELECT COALESCE(MAX(ordem), 0) + 1 AS n FROM fluxos_integracao WHERE contexto = $1', [contexto])).rows[0].n;
  const m = (v) => Math.max(0, Math.round(Number(v) || 0));
  const { rows } = await pool.query(
    `INSERT INTO fluxos_integracao
       (contexto, fluxo, tabela, tipo, min_config, min_teste_carga, min_apoio, min_validacao, modulos_ativa, ordem)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${FLUXO_COLS}`,
    [contexto, campos.fluxo ?? null, campos.tabela ?? null, campos.tipo ?? null,
     m(campos.min_config), m(campos.min_teste_carga), m(campos.min_apoio), m(campos.min_validacao),
     Array.isArray(campos.modulos_ativa) ? campos.modulos_ativa : [], ord],
  );
  return rows[0];
}

export async function atualizarFluxo(id, campos) {
  const sets = [];
  const params = [];
  let i = 1;
  const txt = ['fluxo', 'tabela', 'tipo'];
  for (const c of txt) {
    if (campos[c] !== undefined) { sets.push(`${c} = $${i++}`); params.push(campos[c] ? String(campos[c]).trim() : null); }
  }
  const nums = ['min_config', 'min_teste_carga', 'min_apoio', 'min_validacao'];
  for (const c of nums) {
    if (campos[c] !== undefined) { sets.push(`${c} = $${i++}`); params.push(Math.max(0, Math.round(Number(campos[c]) || 0))); }
  }
  if (campos.modulos_ativa !== undefined) {
    sets.push(`modulos_ativa = $${i++}`); params.push(Array.isArray(campos.modulos_ativa) ? campos.modulos_ativa : []);
  }
  if (campos.ativo !== undefined) { sets.push(`ativo = $${i++}`); params.push(Boolean(campos.ativo)); }
  if (sets.length === 0) throw new ValidationError('nada para atualizar');
  params.push(id);
  const { rows } = await pool.query(
    `UPDATE fluxos_integracao SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${FLUXO_COLS}`, params);
  if (!rows[0]) throw new NotFoundError('fluxo não encontrado');
  return rows[0];
}

export async function deletarFluxo(id) {
  await pool.query('DELETE FROM fluxos_integracao WHERE id = $1', [id]);
}

// Configurações (constantes globais do cálculo).
export async function obterConfiguracoes() {
  const { rows } = await pool.query(`SELECT chave, valor, descricao FROM configuracoes ORDER BY chave`);
  return rows;
}

export async function obterConfig(chave, padrao = null) {
  const { rows } = await pool.query(`SELECT valor FROM configuracoes WHERE chave = $1`, [chave]);
  return rows[0]?.valor ?? padrao;
}
