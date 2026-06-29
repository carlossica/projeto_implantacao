// Importa o catálogo (catalogo-seed.json, gerado por scripts/extrair_catalogo.py)
// para o Postgres. Por padrão SÓ importa se o catálogo estiver vazio; passe
// --reset pra limpar e reimportar (CUIDADO: apaga simulações existentes via cascade).
//
// Uso:
//   npm run catalogo:importar -- [--reset] [caminho-do-json]

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from '../db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const reset = args.includes('--reset');
const jsonArg = args.find((a) => !a.startsWith('--'));
const jsonPath = jsonArg
  ? path.resolve(process.cwd(), jsonArg)
  : path.resolve(__dirname, '../../scripts/catalogo-seed.json');

async function main() {
  const raw = await fs.readFile(jsonPath, 'utf-8');
  const seed = JSON.parse(raw);
  console.log(`[importar] lendo ${jsonPath}`);
  console.log(`[importar] seed: ${seed.modulos.length} módulos, ${seed.funcionalidades.length} funcionalidades, ` +
    `${seed.erps.length} ERPs, ${seed.metodos_integracao.length} métodos, ${seed.fluxos_integracao.length} fluxos`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: cnt } = await client.query('SELECT count(*)::int AS n FROM modulos');
    if (cnt[0].n > 0 && !reset) {
      console.log(`[importar] catálogo já tem ${cnt[0].n} módulo(s). Use --reset pra reimportar. Abortando.`);
      await client.query('ROLLBACK');
      return;
    }

    if (reset) {
      console.log('[importar] --reset: limpando catálogo (cascade)...');
      await client.query('TRUNCATE fluxos_integracao RESTART IDENTITY');
      await client.query('TRUNCATE funcionalidades, modulos RESTART IDENTITY CASCADE');
      await client.query('TRUNCATE erps, metodos_integracao RESTART IDENTITY CASCADE');
    }

    // Módulos -> mapa nome->id
    const modIdPorNome = new Map();
    for (const m of seed.modulos) {
      const { rows } = await client.query(
        `INSERT INTO modulos (nome, ordem) VALUES ($1, $2) RETURNING id`,
        [m.nome, m.ordem],
      );
      modIdPorNome.set(m.nome, rows[0].id);
    }

    // Funcionalidades
    let nFunc = 0;
    for (const f of seed.funcionalidades) {
      const modId = modIdPorNome.get(f.modulo);
      if (!modId) {
        console.warn(`[importar] funcionalidade sem módulo conhecido: ${f.modulo} / ${f.nome}`);
        continue;
      }
      await client.query(
        `INSERT INTO funcionalidades
           (modulo_id, funcionalidade_mae, nome, tipo, horas_minutos, pacote_padrao, ordem)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [modId, f.mae, f.nome, f.tipo, f.horas_minutos, f.pacote_padrao, f.ordem],
      );
      nFunc++;
    }

    // ERPs
    for (const e of seed.erps) {
      await client.query(`INSERT INTO erps (nome, ordem) VALUES ($1, $2)`, [e.nome, e.ordem]);
    }
    // Métodos de integração
    for (const m of seed.metodos_integracao) {
      await client.query(`INSERT INTO metodos_integracao (nome, ordem) VALUES ($1, $2)`, [m.nome, m.ordem]);
    }
    // Fluxos de integração (+ matriz de ativação por módulo)
    for (const x of seed.fluxos_integracao) {
      await client.query(
        `INSERT INTO fluxos_integracao
           (contexto, fluxo, tabela, tipo, min_config, min_teste_carga, min_apoio, min_validacao, modulos_ativa, ordem)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [x.contexto, x.fluxo, x.tabela, x.tipo, x.min_config, x.min_teste_carga, x.min_apoio, x.min_validacao, x.modulos_ativa ?? [], x.ordem],
      );
    }

    await client.query('COMMIT');
    console.log(`[importar] OK — ${seed.modulos.length} módulos, ${nFunc} funcionalidades, ` +
      `${seed.erps.length} ERPs, ${seed.metodos_integracao.length} métodos, ${seed.fluxos_integracao.length} fluxos.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error('[importar] ERRO:', err.message);
    process.exitCode = 1;
  })
  .finally(() => closePool());
