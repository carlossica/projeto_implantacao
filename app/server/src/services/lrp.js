// LRP — geração a partir da simulação, preenchimento e versionamento.
import { pool } from '../db/client.js';
import { ValidationError, NotFoundError } from './erros.js';

export async function listar() {
  const { rows } = await pool.query(
    `SELECT l.id, l.nome, l.versao, l.status, l.simulacao_id, l.cliente_id,
            l.criado_em, l.atualizado_em,
            cl.nome AS cliente_nome, s.nome AS simulacao_nome, u.nome AS criado_por_nome,
            (SELECT count(*) FROM lrp_itens i WHERE i.lrp_id = l.id)::int AS qtd_topicos
       FROM lrps l
       LEFT JOIN clientes cl ON cl.id = l.cliente_id
       LEFT JOIN simulacoes s ON s.id = l.simulacao_id
       LEFT JOIN usuarios u ON u.id = l.criado_por
      ORDER BY l.atualizado_em DESC`);
  return rows;
}

// Gera uma LRP a partir de uma simulação: snapshot dos tópicos do template
// dos módulos contratados (+ tópicos fundamentais), com suas perguntas.
export async function gerarDaSimulacao(simulacaoId, usuarioId) {
  const { rows: simRows } = await pool.query(
    `SELECT s.id, s.nome, s.cliente_id FROM simulacoes s WHERE s.id = $1`, [simulacaoId]);
  const sim = simRows[0];
  if (!sim) throw new NotFoundError('simulação não encontrada');

  const { rows: mods } = await pool.query(
    `SELECT modulo_id FROM simulacao_modulos WHERE simulacao_id = $1 AND contratado`, [simulacaoId]);
  const moduloIds = mods.map((m) => m.modulo_id);
  if (moduloIds.length === 0) {
    throw new ValidationError('simulação sem módulos', ['contrate ao menos um módulo antes de gerar a LRP']);
  }

  // Próxima versão para a mesma simulação.
  const { rows: vRows } = await pool.query(
    `SELECT COALESCE(MAX(versao), 0) + 1 AS v FROM lrps WHERE simulacao_id = $1`, [simulacaoId]);
  const versao = vRows[0].v;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: lrpRows } = await client.query(
      `INSERT INTO lrps (simulacao_id, cliente_id, nome, versao, criado_por)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [simulacaoId, sim.cliente_id ?? null, sim.nome, versao, usuarioId ?? null]);
    const lrpId = lrpRows[0].id;
    await inserirItensDoTemplate(client, lrpId, moduloIds);
    await client.query('COMMIT');
    return obter(lrpId);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Insere os itens (tópicos snapshotados) e suas respostas a partir do template,
// para os módulos contratados (+ tópicos gerais de modulo_id NULL). Usado tanto
// na geração inicial quanto na redefinição. Assume estar dentro de transação.
async function inserirItensDoTemplate(client, lrpId, moduloIds) {
  const { rows: topicos } = await client.query(
    `SELECT t.id, t.titulo, t.descricao, t.ordem, m.nome AS modulo_nome
       FROM lrp_topicos t
       LEFT JOIN modulos m ON m.id = t.modulo_id
      WHERE t.ativo AND (t.modulo_id IS NULL OR t.modulo_id = ANY($1::int[]))
      ORDER BY t.ordem`,
    [moduloIds]);
  for (let i = 0; i < topicos.length; i++) {
    const t = topicos[i];
    const { rows: itemRows } = await client.query(
      `INSERT INTO lrp_itens (lrp_id, modulo_nome, titulo, descricao, ordem)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [lrpId, t.modulo_nome ?? null, t.titulo, t.descricao ?? null, i]);
    const itemId = itemRows[0].id;
    const { rows: perguntas } = await client.query(
      `SELECT texto, orientacao, tipo_resposta, opcoes, ordem FROM lrp_perguntas WHERE topico_id = $1 ORDER BY ordem`,
      [t.id]);
    for (const p of perguntas) {
      await client.query(
        `INSERT INTO lrp_respostas (lrp_item_id, pergunta, orientacao, tipo_resposta, opcoes, ordem)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [itemId, p.texto, p.orientacao ?? null, p.tipo_resposta, p.opcoes ?? [], p.ordem]);
    }
  }
}

// Redefine uma LRP: descarta itens/respostas/vereditos atuais e regenera a
// partir do template da simulação de origem, voltando ao estado inicial (rascunho).
export async function redefinir(id) {
  const { rows: lrpRows } = await pool.query('SELECT id, simulacao_id FROM lrps WHERE id = $1', [id]);
  const lrp = lrpRows[0];
  if (!lrp) throw new NotFoundError('LRP não encontrada');
  if (!lrp.simulacao_id) {
    throw new ValidationError('LRP sem simulação de origem', ['a simulação que originou esta LRP foi removida; não é possível redefinir']);
  }

  const { rows: mods } = await pool.query(
    `SELECT modulo_id FROM simulacao_modulos WHERE simulacao_id = $1 AND contratado`, [lrp.simulacao_id]);
  const moduloIds = mods.map((m) => m.modulo_id);
  if (moduloIds.length === 0) {
    throw new ValidationError('simulação sem módulos', ['a simulação de origem não tem módulos contratados']);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM lrp_itens WHERE lrp_id = $1', [id]); // cascata apaga respostas
    await inserirItensDoTemplate(client, id, moduloIds);
    await client.query(`UPDATE lrps SET status = 'rascunho', atualizado_em = now() WHERE id = $1`, [id]);
    await client.query('COMMIT');
    return obter(id);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function obter(id) {
  const { rows: lrpRows } = await pool.query(
    `SELECT l.*, cl.nome AS cliente_nome, s.nome AS simulacao_nome
       FROM lrps l
       LEFT JOIN clientes cl ON cl.id = l.cliente_id
       LEFT JOIN simulacoes s ON s.id = l.simulacao_id
      WHERE l.id = $1`, [id]);
  const lrp = lrpRows[0];
  if (!lrp) throw new NotFoundError('LRP não encontrada');

  const { rows: itens } = await pool.query(
    `SELECT id, modulo_nome, titulo, descricao, ordem, aderencia, pontos_nao_aderentes
       FROM lrp_itens WHERE lrp_id = $1 ORDER BY ordem`, [id]);
  const { rows: respostas } = await pool.query(
    `SELECT r.id, r.lrp_item_id, r.pergunta, r.orientacao, r.tipo_resposta, r.opcoes, r.resposta, r.ordem
       FROM lrp_respostas r
       JOIN lrp_itens i ON i.id = r.lrp_item_id
      WHERE i.lrp_id = $1 ORDER BY r.ordem`, [id]);
  const porItem = new Map(itens.map((it) => [it.id, { ...it, respostas: [] }]));
  for (const r of respostas) porItem.get(r.lrp_item_id)?.respostas.push(r);

  return { ...lrp, itens: [...porItem.values()] };
}

export async function salvarResposta(respostaId, texto) {
  await pool.query(
    `UPDATE lrp_respostas SET resposta = $1 WHERE id = $2`, [texto ?? null, respostaId]);
  await tocar(respostaId);
}

export async function salvarAderencia(itemId, { aderencia, pontos_nao_aderentes }) {
  const valid = ['aderente', 'parcial', 'nao_aderente', null];
  const a = aderencia ?? null;
  if (!valid.includes(a)) throw new ValidationError('aderência inválida');
  await pool.query(
    `UPDATE lrp_itens SET aderencia = $1, pontos_nao_aderentes = $2 WHERE id = $3`,
    [a, pontos_nao_aderentes ?? null, itemId]);
  const { rows } = await pool.query('SELECT lrp_id FROM lrp_itens WHERE id = $1', [itemId]);
  if (rows[0]) await pool.query('UPDATE lrps SET atualizado_em = now() WHERE id = $1', [rows[0].lrp_id]);
}

async function tocar(respostaId) {
  await pool.query(
    `UPDATE lrps SET atualizado_em = now()
      WHERE id = (SELECT i.lrp_id FROM lrp_respostas r JOIN lrp_itens i ON i.id = r.lrp_item_id WHERE r.id = $1)`,
    [respostaId]);
}

export async function atualizar(id, campos) {
  const sets = [];
  const params = [];
  let i = 1;
  if (campos.nome !== undefined) { sets.push(`nome = $${i++}`); params.push(String(campos.nome).trim()); }
  if (campos.status !== undefined) { sets.push(`status = $${i++}`); params.push(String(campos.status)); }
  sets.push('atualizado_em = now()');
  if (sets.length === 1) return obter(id);
  params.push(id);
  await pool.query(`UPDATE lrps SET ${sets.join(', ')} WHERE id = $${i}`, params);
  return obter(id);
}

export async function deletar(id) {
  await pool.query('DELETE FROM lrps WHERE id = $1', [id]);
}
