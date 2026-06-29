-- Usuários da aplicação (autenticação por login + JWT).
CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL PRIMARY KEY,
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  senha_hash      TEXT NOT NULL,
  -- 'admin'       => gerencia catálogo, usuários e tudo mais
  -- 'editor'      => cria/edita simulações
  -- 'visualizador'=> só leitura
  papel           TEXT NOT NULL DEFAULT 'editor'
                    CHECK (papel IN ('admin', 'editor', 'visualizador')),
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  -- força troca de senha no primeiro login (senha provisória gerada por admin).
  senha_provisoria BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (lower(email));
