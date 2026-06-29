-- Matriz de ativação: para cada fluxo de integração, em quais MÓDULOS ele é
-- ativado (colunas SIM da matriz nas abas Aliare Integra). Guardamos os nomes
-- de módulo crus (da planilha); o motor normaliza e cruza com os módulos
-- contratados da simulação. Um fluxo só entra nas horas de integração quando
-- ao menos um módulo contratado o ativa.
ALTER TABLE fluxos_integracao
  ADD COLUMN IF NOT EXISTS modulos_ativa TEXT[] NOT NULL DEFAULT '{}';
