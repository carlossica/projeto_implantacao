// Cadastro de clientes (básico).
import { pool } from '../db/client.js';
import { ValidationError, NotFoundError } from './erros.js';

const COLS = `id, nome, cnpj, contato, email, telefone, observacoes, ativo, criado_em, atualizado_em`;

export async function listar() {
  const { rows } = await pool.query(
    `SELECT ${COLS},
            (SELECT count(*) FROM simulacoes s WHERE s.cliente_id = c.id)::int AS qtd_simulacoes
       FROM clientes c ORDER BY ativo DESC, nome ASC`);
  return rows;
}

export async function obter(id) {
  const { rows } = await pool.query(`SELECT ${COLS} FROM clientes WHERE id = $1`, [id]);
  if (!rows[0]) throw new NotFoundError('cliente não encontrado');
  return rows[0];
}

export async function criar(campos) {
  const nome = String(campos.nome ?? '').trim();
  if (!nome) throw new ValidationError('nome obrigatório', ['informe o nome do cliente']);
  const { rows } = await pool.query(
    `INSERT INTO clientes (nome, cnpj, contato, email, telefone, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${COLS}`,
    [nome, campos.cnpj ?? null, campos.contato ?? null, campos.email ?? null, campos.telefone ?? null, campos.observacoes ?? null]);
  return rows[0];
}

export async function atualizar(id, campos) {
  const sets = [];
  const params = [];
  let i = 1;
  for (const c of ['nome', 'cnpj', 'contato', 'email', 'telefone', 'observacoes']) {
    if (campos[c] !== undefined) { sets.push(`${c} = $${i++}`); params.push(campos[c] ? String(campos[c]).trim() : null); }
  }
  if (campos.ativo !== undefined) { sets.push(`ativo = $${i++}`); params.push(Boolean(campos.ativo)); }
  sets.push('atualizado_em = now()');
  if (sets.length === 1) return obter(id);
  params.push(id);
  const { rows } = await pool.query(`UPDATE clientes SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${COLS}`, params);
  if (!rows[0]) throw new NotFoundError('cliente não encontrado');
  return rows[0];
}

export async function deletar(id) {
  await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
}
