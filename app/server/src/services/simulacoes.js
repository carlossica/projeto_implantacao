// Simulações: CRUD + seleção de módulos/funcionalidades + cálculo.

import { pool } from '../db/client.js';
import { ValidationError, NotFoundError } from './erros.js';
import { calcular } from './calculo.js';
import { listarFluxosIntegracao } from './catalogo.js';

const COLS = `
  s.id, s.nome, s.cliente_id, s.num_usuarios, s.erp_id, s.metodo_integracao_id,
  s.ambiente_prod_homolog, s.cloud_aliare, s.hospedagem_id, s.fases,
  s.fator_gestao, s.status, s.criado_por, s.criado_em, s.atualizado_em,
  s.num_administradores, s.num_operacionais, s.num_gestores,
  s.tam_turma_operacional, s.tam_turma_gestor, s.etapas_golive,
  s.formato_treino_adm, s.formato_treino_oper
`;

export async function listar() {
  const { rows } = await pool.query(
    `SELECT ${COLS}, e.nome AS erp_nome, u.nome AS criado_por_nome, cl.nome AS cliente_nome,
            (SELECT count(*) FROM simulacao_modulos sm WHERE sm.simulacao_id = s.id AND sm.contratado)::int AS qtd_modulos
       FROM simulacoes s
       LEFT JOIN erps e ON e.id = s.erp_id
       LEFT JOIN usuarios u ON u.id = s.criado_por
       LEFT JOIN clientes cl ON cl.id = s.cliente_id
      ORDER BY s.atualizado_em DESC`,
  );
  return rows;
}

async function obterCabecalho(id) {
  const { rows } = await pool.query(
    `SELECT ${COLS}, e.nome AS erp_nome, e.horas_instalacao AS erp_horas_instalacao,
            mi.nome AS metodo_nome, cl.nome AS cliente_nome,
            th.nome AS hospedagem_nome, th.horas AS hospedagem_horas
       FROM simulacoes s
       LEFT JOIN erps e ON e.id = s.erp_id
       LEFT JOIN metodos_integracao mi ON mi.id = s.metodo_integracao_id
       LEFT JOIN clientes cl ON cl.id = s.cliente_id
       LEFT JOIN tipos_hospedagem th ON th.id = s.hospedagem_id
      WHERE s.id = $1`,
    [id],
  );
  if (!rows[0]) throw new NotFoundError('simulação não encontrada');
  return rows[0];
}

export async function criar(campos, usuarioId) {
  const nome = String(campos.nome ?? '').trim();
  if (!nome) throw new ValidationError('nome obrigatório', ['informe o nome do cliente/projeto']);
  const numUsuarios = Number(campos.num_usuarios ?? 0) || 0;
  // Operacionais default = nº de usuários (o consultor refina depois).
  const numOperac = campos.num_operacionais != null ? Number(campos.num_operacionais) || 0 : numUsuarios;
  const { rows } = await pool.query(
    `INSERT INTO simulacoes
       (nome, cliente_id, num_usuarios, erp_id, metodo_integracao_id, ambiente_prod_homolog,
        hospedagem_id, fases, fator_gestao,
        num_administradores, num_operacionais, num_gestores,
        tam_turma_operacional, tam_turma_gestor, etapas_golive,
        formato_treino_adm, formato_treino_oper, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING id`,
    [
      nome,
      campos.cliente_id ?? null,
      numUsuarios,
      campos.erp_id ?? null,
      campos.metodo_integracao_id ?? null,
      Boolean(campos.ambiente_prod_homolog),
      campos.hospedagem_id ?? null,
      Number(campos.fases ?? 1) || 1,
      Number(campos.fator_gestao ?? 0.08),
      Number(campos.num_administradores ?? 1) || 0,
      numOperac,
      Number(campos.num_gestores ?? 1) || 0,
      Number(campos.tam_turma_operacional ?? 25) || 25,
      Number(campos.tam_turma_gestor ?? 10) || 10,
      Number(campos.etapas_golive ?? 1) || 1,
      campos.formato_treino_adm ?? 'Presencial',
      campos.formato_treino_oper ?? 'Presencial',
      usuarioId ?? null,
    ],
  );
  const id = rows[0].id;
  // Módulos iniciais (opcional). Cada módulo contratado semeia o pacote padrão.
  if (Array.isArray(campos.modulo_ids) && campos.modulo_ids.length) {
    await definirModulos(id, campos.modulo_ids);
  }
  return obter(id);
}

export async function atualizar(id, campos) {
  await obterCabecalho(id); // 404 se não existe
  const map = {
    nome: (v) => String(v).trim(),
    cliente_id: (v) => (v === '' || v == null ? null : Number(v)),
    num_usuarios: (v) => Number(v) || 0,
    erp_id: (v) => v ?? null,
    metodo_integracao_id: (v) => v ?? null,
    ambiente_prod_homolog: (v) => Boolean(v),
    hospedagem_id: (v) => (v === '' || v == null ? null : Number(v)),
    fases: (v) => Number(v) || 1,
    fator_gestao: (v) => Number(v),
    num_administradores: (v) => Number(v) || 0,
    num_operacionais: (v) => Number(v) || 0,
    num_gestores: (v) => Number(v) || 0,
    tam_turma_operacional: (v) => Number(v) || 25,
    tam_turma_gestor: (v) => Number(v) || 10,
    etapas_golive: (v) => Number(v) || 1,
    formato_treino_adm: (v) => String(v),
    formato_treino_oper: (v) => String(v),
    status: (v) => String(v),
  };
  const sets = [];
  const params = [];
  let i = 1;
  for (const [k, fn] of Object.entries(map)) {
    if (campos[k] !== undefined) { sets.push(`${k} = $${i++}`); params.push(fn(campos[k])); }
  }
  sets.push(`atualizado_em = now()`);
  if (sets.length === 1) return obter(id);
  params.push(id);
  await pool.query(`UPDATE simulacoes SET ${sets.join(', ')} WHERE id = $${i}`, params);
  return obter(id);
}

// Substitui o conjunto de módulos contratados. Ao contratar um módulo, semeia
// suas funcionalidades de pacote padrão (marcadas). Ao descontratar, remove as
// marcações daquele módulo.
export async function definirModulos(id, moduloIds) {
  const ids = [...new Set((moduloIds ?? []).map(Number).filter(Number.isInteger))];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: atuais } = await client.query(
      `SELECT modulo_id FROM simulacao_modulos WHERE simulacao_id = $1 AND contratado`, [id]);
    const setAtual = new Set(atuais.map((r) => r.modulo_id));
    const setNovo = new Set(ids);

    const adicionados = ids.filter((m) => !setAtual.has(m));
    const removidos = [...setAtual].filter((m) => !setNovo.has(m));

    // Zera e regrava o conjunto de módulos contratados.
    await client.query(`DELETE FROM simulacao_modulos WHERE simulacao_id = $1`, [id]);
    for (const m of ids) {
      await client.query(
        `INSERT INTO simulacao_modulos (simulacao_id, modulo_id, contratado) VALUES ($1,$2,TRUE)`,
        [id, m]);
    }
    // Semeia pacote padrão dos módulos recém-adicionados.
    for (const m of adicionados) {
      await client.query(
        `INSERT INTO simulacao_funcionalidades (simulacao_id, funcionalidade_id, marcado)
         SELECT $1, f.id, TRUE FROM funcionalidades f
          WHERE f.modulo_id = $2 AND f.ativo AND f.pacote_padrao
         ON CONFLICT (simulacao_id, funcionalidade_id) DO NOTHING`,
        [id, m]);
    }
    // Remove marcações de módulos descontratados.
    for (const m of removidos) {
      await client.query(
        `DELETE FROM simulacao_funcionalidades sf
          USING funcionalidades f
          WHERE sf.funcionalidade_id = f.id AND sf.simulacao_id = $1 AND f.modulo_id = $2`,
        [id, m]);
    }
    await client.query(`UPDATE simulacoes SET atualizado_em = now() WHERE id = $1`, [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  return obter(id);
}

// Marca/desmarca uma funcionalidade individual.
export async function marcarFuncionalidade(id, funcionalidadeId, marcado) {
  if (marcado) {
    await pool.query(
      `INSERT INTO simulacao_funcionalidades (simulacao_id, funcionalidade_id, marcado)
       VALUES ($1,$2,TRUE)
       ON CONFLICT (simulacao_id, funcionalidade_id) DO UPDATE SET marcado = TRUE`,
      [id, funcionalidadeId]);
  } else {
    await pool.query(
      `DELETE FROM simulacao_funcionalidades WHERE simulacao_id = $1 AND funcionalidade_id = $2`,
      [id, funcionalidadeId]);
  }
  await pool.query(`UPDATE simulacoes SET atualizado_em = now() WHERE id = $1`, [id]);
  return obter(id);
}

// Monta a simulação completa: cabeçalho + módulos contratados + funcionalidades marcadas + resultado.
export async function obter(id) {
  const cab = await obterCabecalho(id);
  const { rows: mods } = await pool.query(
    `SELECT m.id, m.nome, m.pct_lrp, m.pct_validacao_dados, m.pct_parametrizacao,
            m.pct_treinamento, m.pct_validacao_ambiente, m.pct_golive
       FROM simulacao_modulos sm
       JOIN modulos m ON m.id = sm.modulo_id
      WHERE sm.simulacao_id = $1 AND sm.contratado
      ORDER BY m.ordem`,
    [id]);
  const { rows: funcs } = await pool.query(
    `SELECT f.id, f.modulo_id, f.nome, f.horas_minutos
       FROM simulacao_funcionalidades sf
       JOIN funcionalidades f ON f.id = sf.funcionalidade_id
      WHERE sf.simulacao_id = $1 AND sf.marcado`,
    [id]);

  const resultado = await calcularResultado(cab, mods, funcs);
  return {
    ...cab,
    modulos_contratados: mods.map((m) => m.id),
    funcionalidades_marcadas: funcs.map((f) => f.id),
    resultado,
  };
}

async function calcularResultado(cab, mods, funcs) {
  // Contexto de integração: 'solution' só para ERP "Aliare Solution"; qualquer
  // outro ERP usa 'erp_terceiro'.
  const ehSolution = String(cab.erp_nome ?? '').toUpperCase().includes('SOLUTION');
  const contexto = ehSolution ? 'solution' : 'erp_terceiro';
  const fluxos = await listarFluxosIntegracao(contexto);

  const { rows: cfgRows } = await pool.query(`SELECT chave, valor FROM configuracoes`);
  const config = Object.fromEntries(cfgRows.map((r) => [r.chave, Number(r.valor) || r.valor]));

  return calcular({
    simulacao: cab,
    modulos: mods,
    funcionalidades: funcs,
    fluxosIntegracao: fluxos,
    config,
  });
}

export async function deletar(id) {
  await pool.query('DELETE FROM simulacoes WHERE id = $1', [id]);
}
