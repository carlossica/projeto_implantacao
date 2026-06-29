# Simulador Clover — Estimativa de Horas

Aplicação web que substitui a planilha **"Simulador Clover MÁQUINAS - Por funcionalidade"**.
Calcula a estimativa de horas para projetos de implantação do Clover CRM a partir de
parâmetros gerais + módulos/funcionalidades contratados, com quebra por etapa.

Tecnologia espelhada do projeto `test-runner`:
- **server** — Node (ESM) + Express + PostgreSQL (`pg`) + JWT/bcrypt. Migrations SQL idempotentes.
- **web** — Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4.

## Estrutura

```
app/
├── server/            API Express
│   ├── db/migrations/ schema SQL (001..005)
│   ├── scripts/       extrair_catalogo.py (xlsx→json) + catalogo-seed.json
│   └── src/
│       ├── routes/    auth, catalogo, simulacoes, usuarios
│       ├── services/  auth, catalogo, simulacoes, calculo (motor)
│       └── cli/        importar-catalogo, usuario-criar
└── web/               Front Next.js
    ├── app/           login, /(lista), simulacoes/nova, simulacoes/[id], catalogo, integracao, usuarios
    ├── components/    app-shell, sidebar, topbar, auth/theme-provider
    └── lib/           api, types, menus, format
```

## Setup (primeira vez)

```bash
cd "app"
npm install

# 1. cria o banco (se não existir) — usa as credenciais do .env
npm run --workspace server db -- # ou: node server/src/db/ensure-db.js
node server/src/db/ensure-db.js

# 2. aplica as migrations
npm run db:migrate-all

# 3. extrai o catálogo do .xlsx e importa pro banco
python server/scripts/extrair_catalogo.py "../Simulador Clover MÁQUINAS - Por funcionalidade - v11052026.1 (1).xlsx" server/scripts/catalogo-seed.json
npm run catalogo:importar -- --reset

# 4. importa o template de LRP (tópicos por módulo + perguntas)
npm run lrp:importar-template

# 5. cria um usuário admin
npm run usuario:criar -- --nome "Administrador" --email admin@aliare.com --senha admin123 --papel admin
```

## Funcionalidades

- **Simulações** — parâmetros gerais + seleção de módulos/funcionalidades (pacote padrão
  pré-marcado), cálculo ao vivo por etapa, vínculo a um cliente, edição de parâmetros com Salvar.
- **Clientes** — cadastro básico para vincular às simulações.
- **Catálogo** (admin) — CRUD de módulos e funcionalidades (tipo, horas, pacote padrão) e de
  fluxos de integração (com a matriz de ativação por módulo).
- **LRP** — Levantamento de Regras e Processos gerado a partir de uma simulação (só os módulos
  contratados), com perguntas por tópico, respostas, **veredito de aderência** e pontos não
  aderentes (Adequações). Versionado e imprimível (PDF via navegador).

## Rodar (desenvolvimento)

Em dois terminais:

```bash
npm run dev:server   # API em http://localhost:3010
npm run dev:web      # Front em http://localhost:3000
```

Acesse http://localhost:3000 e faça login.

## Configuração

`.env` (gitignored) na raiz de `app/`:

```
POSTGRES_HOST=...
POSTGRES_PORT=...
POSTGRES_DB=SimuladorCloverHoras
POSTGRES_USER=...
POSTGRES_PASSWORD=...
PORT=3010
SESSION_SECRET=<troque em produção>
```

## Motor de cálculo (premissas a validar)

Ver cabeçalho de `server/src/services/calculo.js`. Resumo:
- **Implantação** = Σ horas das funcionalidades marcadas (× coeficiente de complexidade).
- **Instalação** = 1h base + (ERP AGB ? +5h) + (prod+homolog ? +4h).
- **Integração** = Σ horas dos fluxos do contexto (solution/erp_terceiro) cuja **matriz
  de ativação** (SIM/NÃO por módulo, importada das abas Aliare Integra) intersecta os
  módulos contratados. Escala conforme o escopo.
- **Gestão** = fator_gestao (0.08) × (instalação + implantação + integração + adequações).
- **Total** = soma das etapas.

> ⚠️ Os números devem ser conferidos contra a planilha original com o time de produto
> antes de uso comercial. Em especial a alocação de horas por etapa e o cálculo de integração.
