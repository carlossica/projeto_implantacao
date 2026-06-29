import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { pool } from './db/client.js';
import { authRouter } from './routes/auth.js';
import { catalogoRouter } from './routes/catalogo.js';
import { simulacoesRouter } from './routes/simulacoes.js';
import { clientesRouter } from './routes/clientes.js';
import { lrpRouter } from './routes/lrp.js';
import { usuariosRouter } from './routes/usuarios.js';
import { requireAuth, requireAdmin, requireEscritor } from './middleware/auth.js';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// /health e /auth ficam abertos; o resto exige login.
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'down', error: err.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/catalogo', requireAuth, requireEscritor, catalogoRouter);
app.use('/api/simulacoes', requireAuth, requireEscritor, simulacoesRouter);
app.use('/api/clientes', requireAuth, requireEscritor, clientesRouter);
app.use('/api/lrp', requireAuth, requireEscritor, lrpRouter);
app.use('/api/usuarios', requireAuth, requireAdmin, usuariosRouter);

// Error handler — mapeia erros de domínio pra status HTTP.
app.use((err, _req, res, _next) => {
  if (err?.name === 'ValidationError') return res.status(400).json({ error: err.message, detalhes: err.detalhes });
  if (err?.name === 'NotFoundError') return res.status(404).json({ error: err.message });
  if (err?.name === 'ConflictError') return res.status(409).json({ error: err.message });
  if (err?.name === 'AuthError') return res.status(err.status ?? 401).json({ error: err.message });
  console.error('[server] erro:', err);
  res.status(500).json({ error: err.message });
});

async function startup() {
  // Sanidade da conexão antes de subir.
  try {
    await pool.query('SELECT 1');
    console.log(`[server] DB ok: ${config.postgres.host}:${config.postgres.port}/${config.postgres.database}`);
  } catch (err) {
    console.error('[server] FALHA ao conectar no banco:', err.message);
    process.exit(1);
  }
  app.listen(config.port, () => {
    console.log(`[server] Simulador Clover ouvindo em http://localhost:${config.port}`);
  });
}

startup().catch((err) => {
  console.error('[server] falha no startup:', err);
  process.exit(1);
});
