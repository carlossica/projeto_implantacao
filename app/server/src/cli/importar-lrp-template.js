// Importa o template de LRP (lrp-template.json) — tópicos por módulo + perguntas.
// Idempotente: faz upsert por `chave` do tópico e recria as perguntas do tópico.
// Uso: npm run lrp:importar-template

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from '../db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.resolve(__dirname, '../../scripts/lrp-template.json');

async function main() {
  const seed = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
  const { rows: mods } = await pool.query('SELECT id, nome FROM modulos');
  const modIdPorNome = new Map(mods.map((m) => [m.nome, m.id]));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let nT = 0, nP = 0;
    for (let i = 0; i < seed.topicos.length; i++) {
      const t = seed.topicos[i];
      const modId = t.modulo ? modIdPorNome.get(t.modulo) ?? null : null;
      const up = await client.query(
        `INSERT INTO lrp_topicos (modulo_id, chave, titulo, descricao, ordem)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (chave) DO UPDATE SET modulo_id = $1, titulo = $3, descricao = $4, ordem = $5
         RETURNING id`,
        [modId, t.chave, t.titulo, t.descricao ?? null, i],
      );
      const topicoId = up.rows[0].id;
      nT++;
      // Recria as perguntas do tópico.
      await client.query('DELETE FROM lrp_perguntas WHERE topico_id = $1', [topicoId]);
      const perguntas = t.perguntas ?? [];
      for (let j = 0; j < perguntas.length; j++) {
        const p = perguntas[j];
        await client.query(
          `INSERT INTO lrp_perguntas (topico_id, texto, orientacao, tipo_resposta, opcoes, ordem)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [topicoId, p.texto, p.orientacao ?? null, p.tipo_resposta ?? 'texto', p.opcoes ?? [], j],
        );
        nP++;
      }
    }
    await client.query('COMMIT');
    console.log(`[lrp:template] OK — ${nT} tópicos, ${nP} perguntas.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => { console.error('[lrp:template] ERRO:', err.message); process.exitCode = 1; })
  .finally(() => closePool());
