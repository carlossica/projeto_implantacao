-- Cadastro básico de clientes (para vincular às simulações).
CREATE TABLE IF NOT EXISTS clientes (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  cnpj        TEXT,
  contato     TEXT,
  email       TEXT,
  telefone    TEXT,
  observacoes TEXT,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vínculo opcional da simulação com um cliente cadastrado.
ALTER TABLE simulacoes
  ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes (id);
