import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}. Veja .env.example.`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3010),
  postgres: {
    host: required('POSTGRES_HOST'),
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: required('POSTGRES_DB'),
    user: required('POSTGRES_USER'),
    password: required('POSTGRES_PASSWORD'),
  },
  // Secret pra assinar JWTs. Default só pra dev; EM PROD exige SESSION_SECRET forte.
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-change-in-prod',
  // Duração da sessão (cookie + JWT exp). Default 7 dias.
  sessionMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
};
