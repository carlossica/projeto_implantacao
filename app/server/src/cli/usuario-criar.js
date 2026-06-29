// Cria (ou atualiza) um usuário pela linha de comando.
// Uso:
//   npm run usuario:criar -- --nome "Admin" --email admin@aliare.com --senha segredo123 --papel admin

import { pool, closePool } from '../db/client.js';
import * as auth from '../services/auth.js';

function arg(nome, padrao = undefined) {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

async function main() {
  const nome = arg('nome', 'Administrador');
  const email = arg('email');
  const senha = arg('senha');
  const papel = arg('papel', 'admin');
  if (!email || !senha) {
    console.error('Uso: npm run usuario:criar -- --nome "Nome" --email x@y.com --senha ****** [--papel admin|editor|visualizador]');
    process.exitCode = 1;
    return;
  }
  // Já existe? Atualiza a senha/papel. Senão, cria.
  const { rows } = await pool.query('SELECT id FROM usuarios WHERE lower(email) = $1', [email.toLowerCase()]);
  if (rows[0]) {
    const u = await auth.atualizar(rows[0].id, { nome, senha, papel });
    console.log(`[usuario:criar] atualizado: ${u.email} (${u.papel})`);
  } else {
    const u = await auth.criar({ nome, email, senha, papel });
    console.log(`[usuario:criar] criado: ${u.email} (${u.papel})`);
  }
}

main()
  .catch((err) => { console.error('[usuario:criar] ERRO:', err.message); process.exitCode = 1; })
  .finally(() => closePool());
