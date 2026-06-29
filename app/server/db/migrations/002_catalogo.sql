-- ===========================================================================
-- CATÁLOGO (fonte de verdade da estimativa; importado do .xlsx e editável)
-- ===========================================================================

-- Módulos do Clover (ex.: "CRM - MM - Funcionalidades Fundamentais").
CREATE TABLE IF NOT EXISTS modulos (
  id        SERIAL PRIMARY KEY,
  nome      TEXT NOT NULL UNIQUE,
  ordem     INTEGER NOT NULL DEFAULT 0,
  ativo     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Funcionalidades (linhas "filhas") agrupadas por módulo. Cada marcação numa
-- simulação soma `horas_minutos` ao total. `funcionalidade_mae` é o agrupador
-- intermediário (ex.: "Cadastros Fundamentais"). Horas guardadas em MINUTOS
-- (inteiro) — o .xlsx usa tempo Excel (01:00:00 = 60 min); evita float.
CREATE TABLE IF NOT EXISTS funcionalidades (
  id                 SERIAL PRIMARY KEY,
  modulo_id          INTEGER NOT NULL REFERENCES modulos (id) ON DELETE CASCADE,
  funcionalidade_mae TEXT,
  nome               TEXT NOT NULL,
  -- Obrigatório | Opcional | "Opcional, pode ser necessário" | etc. (texto livre,
  -- como na planilha — não engessamos num enum).
  tipo               TEXT,
  horas_minutos      INTEGER NOT NULL DEFAULT 0,
  -- pertence ao "pacote padrão" do módulo (pré-marcada ao criar simulação).
  pacote_padrao      BOOLEAN NOT NULL DEFAULT FALSE,
  ordem              INTEGER NOT NULL DEFAULT 0,
  ativo              BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_funcionalidades_modulo ON funcionalidades (modulo_id);

-- ERPs de terceiro selecionáveis na simulação (aba "Valor" da planilha).
CREATE TABLE IF NOT EXISTS erps (
  id        SERIAL PRIMARY KEY,
  nome      TEXT NOT NULL UNIQUE,
  ordem     INTEGER NOT NULL DEFAULT 0,
  ativo     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Métodos de integração do Aliare Integra (API padrão / customizada / sem integração).
CREATE TABLE IF NOT EXISTS metodos_integracao (
  id        SERIAL PRIMARY KEY,
  nome      TEXT NOT NULL UNIQUE,
  ordem     INTEGER NOT NULL DEFAULT 0,
  ativo     BOOLEAN NOT NULL DEFAULT TRUE
);
