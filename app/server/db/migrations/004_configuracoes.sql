-- Constantes globais do cálculo (key/value). Editáveis por admin. Seed com os
-- valores atuais da planilha; ON CONFLICT DO NOTHING pra não sobrescrever ajustes.
CREATE TABLE IF NOT EXISTS configuracoes (
  chave         TEXT PRIMARY KEY,
  valor         TEXT NOT NULL,
  descricao     TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('fator_gestao_projeto', '0.08', 'Fator aplicado sobre o total pra horas de Gestão de Projeto.'),
  ('treinamento_max_por_turma', '24', 'Nº máximo de usuários por turma de treinamento.'),
  ('treinamento_consultores_acima', '2', 'Nº de consultores quando 25+ usuários por turma.'),
  ('treinamento_consultores_padrao', '1', 'Nº de consultores até o limite de usuários por turma.')
ON CONFLICT (chave) DO NOTHING;
