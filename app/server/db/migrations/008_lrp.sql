-- ===========================================================================
-- LRP — Levantamento de Regras e Processos
-- ===========================================================================
-- TEMPLATE (catálogo): tópicos por módulo + perguntas. Fonte pra gerar a LRP.
-- Tópicos "fundamentais" (modulo_id NULL ou ligados a Fundamentais) entram sempre.

CREATE TABLE IF NOT EXISTS lrp_topicos (
  id         SERIAL PRIMARY KEY,
  modulo_id  INTEGER REFERENCES modulos (id) ON DELETE CASCADE,
  chave      TEXT NOT NULL UNIQUE,
  titulo     TEXT NOT NULL,
  descricao  TEXT,
  ordem      INTEGER NOT NULL DEFAULT 0,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS lrp_perguntas (
  id          SERIAL PRIMARY KEY,
  topico_id   INTEGER NOT NULL REFERENCES lrp_topicos (id) ON DELETE CASCADE,
  texto       TEXT NOT NULL,
  orientacao  TEXT,
  -- 'texto' | 'sim_nao' | 'selecao'
  tipo_resposta TEXT NOT NULL DEFAULT 'texto',
  opcoes      TEXT[] NOT NULL DEFAULT '{}',
  ordem       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lrp_perguntas_topico ON lrp_perguntas (topico_id);

-- INSTÂNCIAS: uma LRP gerada (snapshot do template no momento da geração).
CREATE TABLE IF NOT EXISTS lrps (
  id            SERIAL PRIMARY KEY,
  simulacao_id  INTEGER REFERENCES simulacoes (id) ON DELETE SET NULL,
  cliente_id    INTEGER REFERENCES clientes (id) ON DELETE SET NULL,
  nome          TEXT NOT NULL,
  versao        INTEGER NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizada')),
  criado_por    INTEGER REFERENCES usuarios (id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens da LRP = tópicos snapshotados (1 por tópico gerado).
CREATE TABLE IF NOT EXISTS lrp_itens (
  id                    SERIAL PRIMARY KEY,
  lrp_id                INTEGER NOT NULL REFERENCES lrps (id) ON DELETE CASCADE,
  modulo_nome           TEXT,
  titulo                TEXT NOT NULL,
  descricao             TEXT,
  ordem                 INTEGER NOT NULL DEFAULT 0,
  -- veredito de aderência (clientes complexos): alimenta Adequações.
  aderencia             TEXT CHECK (aderencia IN ('aderente', 'parcial', 'nao_aderente')),
  pontos_nao_aderentes  TEXT
);

CREATE INDEX IF NOT EXISTS idx_lrp_itens_lrp ON lrp_itens (lrp_id);

-- Respostas = perguntas snapshotadas por item.
CREATE TABLE IF NOT EXISTS lrp_respostas (
  id            SERIAL PRIMARY KEY,
  lrp_item_id   INTEGER NOT NULL REFERENCES lrp_itens (id) ON DELETE CASCADE,
  pergunta      TEXT NOT NULL,
  orientacao    TEXT,
  tipo_resposta TEXT NOT NULL DEFAULT 'texto',
  opcoes        TEXT[] NOT NULL DEFAULT '{}',
  resposta      TEXT,
  ordem         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lrp_respostas_item ON lrp_respostas (lrp_item_id);
