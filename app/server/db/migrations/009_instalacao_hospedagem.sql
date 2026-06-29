-- ===========================================================================
-- Instalação configurável + cadastro de hospedagem
-- ===========================================================================
-- Torna a fórmula de instalação 100% configurável:
--   Instalação = base (config) + horas_instalacao do ERP + (prod+homolog ? config) + hospedagem

-- Horas de instalação por ERP (substitui o "+5h se AGB" fixo). Editável no cadastro.
ALTER TABLE erps ADD COLUMN IF NOT EXISTS horas_instalacao NUMERIC(6,2) NOT NULL DEFAULT 0;

-- Cadastro de tipos de hospedagem (Cloud Aliare, On-premise...), cada um com horas.
CREATE TABLE IF NOT EXISTS tipos_hospedagem (
  id     SERIAL PRIMARY KEY,
  nome   TEXT NOT NULL UNIQUE,
  horas  NUMERIC(6,2) NOT NULL DEFAULT 0,
  ordem  INTEGER NOT NULL DEFAULT 0,
  ativo  BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO tipos_hospedagem (nome, horas, ordem) VALUES
  ('Cloud Aliare', 0, 0),
  ('On-premise', 0, 1)
ON CONFLICT (nome) DO NOTHING;

-- Vínculo da simulação com o tipo de hospedagem.
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS hospedagem_id INTEGER REFERENCES tipos_hospedagem (id);

-- Constantes de cálculo (key/value). Editáveis em Configurações Gerais.
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('instalacao_base_horas', '1', 'Horas base de instalação (sempre somadas).'),
  ('instalacao_prod_homolog_horas', '4', 'Horas extras de instalação quando há ambiente de produção + homologação.'),
  ('acrescimo_prod_homolog', '0.3', 'Acréscimo proporcional na implantação quando há prod+homologação (0.3 = +30%).')
ON CONFLICT (chave) DO NOTHING;
