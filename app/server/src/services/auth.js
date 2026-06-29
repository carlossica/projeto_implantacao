// Autenticação + usuários. Modelo enxuto: email (login) + senha_hash (bcrypt) +
// papel (admin/editor/visualizador) + ativo + senha_provisoria.
// Sessão = JWT em cookie httpOnly; sem session store.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/client.js';
import { config } from '../config.js';
import { AuthError, ValidationError } from './erros.js';

const BCRYPT_ROUNDS = 12;
const COOKIE_NAME = 'sess';
export const COOKIE = COOKIE_NAME;
export const PAPEIS_VALIDOS = ['visualizador', 'editor', 'admin'];

const COLUNAS = `id, nome, email, papel, ativo, senha_provisoria, criado_em, atualizado_em`;

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function linha(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    papel: row.papel,
    ativo: row.ativo,
    senha_provisoria: row.senha_provisoria,
    admin: row.papel === 'admin',
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  };
}

function validarEmail(input) {
  const e = String(input ?? '').trim().toLowerCase();
  if (!REGEX_EMAIL.test(e)) throw new ValidationError('email inválido', ['informe um e-mail válido']);
  return e;
}

function validarSenha(senha) {
  const s = String(senha ?? '');
  if (s.length < 6) throw new ValidationError('senha inválida', ['mínimo de 6 caracteres']);
  return s;
}

function validarPapel(input) {
  const p = String(input ?? '').trim().toLowerCase();
  if (!PAPEIS_VALIDOS.includes(p)) {
    throw new ValidationError('papel inválido', [`papel deve ser um de: ${PAPEIS_VALIDOS.join(', ')}`]);
  }
  return p;
}

export async function listar() {
  const { rows } = await pool.query(
    `SELECT ${COLUNAS} FROM usuarios
      ORDER BY ativo DESC,
               CASE papel WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END,
               nome ASC`,
  );
  return rows.map(linha);
}

export async function obter(id) {
  const { rows } = await pool.query(`SELECT ${COLUNAS} FROM usuarios WHERE id = $1`, [id]);
  return linha(rows[0]);
}

export async function criar({ nome, email, senha, papel = 'editor', senha_provisoria = false }) {
  const e = validarEmail(email);
  const s = validarSenha(senha);
  const p = validarPapel(papel);
  const nomeT = String(nome ?? '').trim();
  if (!nomeT) throw new ValidationError('nome obrigatório', ['informe o nome']);
  const hash = await bcrypt.hash(s, BCRYPT_ROUNDS);
  try {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, papel, senha_provisoria)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUNAS}`,
      [nomeT, e, hash, p, Boolean(senha_provisoria)],
    );
    return linha(rows[0]);
  } catch (err) {
    if (err.code === '23505') throw new ValidationError('cadastro inválido', ['já existe um usuário com esse e-mail']);
    throw err;
  }
}

export async function atualizar(id, campos) {
  const sets = [];
  const params = [];
  let i = 1;
  if (campos.nome !== undefined) { sets.push(`nome = $${i++}`); params.push(String(campos.nome).trim()); }
  if (campos.email !== undefined) { sets.push(`email = $${i++}`); params.push(validarEmail(campos.email)); }
  if (campos.papel !== undefined) { sets.push(`papel = $${i++}`); params.push(validarPapel(campos.papel)); }
  if (campos.ativo !== undefined) { sets.push(`ativo = $${i++}`); params.push(Boolean(campos.ativo)); }
  if (campos.senha !== undefined) {
    const hash = await bcrypt.hash(validarSenha(campos.senha), BCRYPT_ROUNDS);
    sets.push(`senha_hash = $${i++}`); params.push(hash);
    sets.push(`senha_provisoria = TRUE`);
  }
  sets.push(`atualizado_em = now()`);
  if (sets.length === 1) return obter(id);
  params.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${COLUNAS}`,
      params,
    );
    return linha(rows[0]);
  } catch (err) {
    if (err.code === '23505') throw new ValidationError('cadastro inválido', ['já existe um usuário com esse e-mail']);
    throw err;
  }
}

export async function deletar(id) {
  await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
}

export async function autenticar(email, senha) {
  const MSG = 'E-mail ou senha inválidos';
  const e = String(email ?? '').trim().toLowerCase();
  const { rows } = await pool.query(`SELECT ${COLUNAS}, senha_hash FROM usuarios WHERE lower(email) = $1`, [e]);
  const row = rows[0];
  if (!row) { console.warn(`[auth] login negado: "${e}" não existe`); throw new AuthError(MSG); }
  const ok = await bcrypt.compare(String(senha ?? ''), row.senha_hash);
  if (!ok) { console.warn(`[auth] login negado: senha errada pra "${e}"`); throw new AuthError(MSG); }
  if (!row.ativo) { console.warn(`[auth] login negado: "${e}" inativo`); throw new AuthError(MSG); }
  return linha(row);
}

export async function trocarSenha(id, senhaAtual, senhaNova) {
  const { rows } = await pool.query(`SELECT id, senha_hash FROM usuarios WHERE id = $1 AND ativo = TRUE`, [id]);
  const row = rows[0];
  if (!row) throw new AuthError('Usuário não encontrado', 404);
  const ok = await bcrypt.compare(String(senhaAtual ?? ''), row.senha_hash);
  if (!ok) throw new AuthError('Senha atual incorreta', 400);
  const s = validarSenha(senhaNova);
  const hash = await bcrypt.hash(s, BCRYPT_ROUNDS);
  const { rows: r2 } = await pool.query(
    `UPDATE usuarios SET senha_hash = $1, senha_provisoria = FALSE, atualizado_em = now()
      WHERE id = $2 RETURNING ${COLUNAS}`,
    [hash, id],
  );
  return linha(r2[0]);
}

export function emitirToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, papel: usuario.papel },
    config.sessionSecret,
    { expiresIn: Math.floor(config.sessionMaxAgeMs / 1000) },
  );
}

export function verificarToken(token) {
  try { return jwt.verify(token, config.sessionSecret); } catch { return null; }
}
