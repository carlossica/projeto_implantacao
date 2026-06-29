# Simulador Clover — Documentação do Projeto

Registro completo do que foi discutido e construído: do entendimento da planilha e
dos áudios até a aplicação web final, com as regras de cálculo, decisões e o módulo de LRP.

---

## 1. Objetivo

Construir uma **aplicação web** que substitui a planilha **"Simulador Clover MÁQUINAS - Por
funcionalidade"** — usada para **estimar as horas** de projetos de implantação do **Clover CRM**.
O resultado (total de horas por etapa) alimenta o setor comercial para montar a proposta.

A tecnologia e o layout espelham o projeto irmão **`test-runner`** (monorepo Next.js + Express + Postgres).

---

## 2. Fontes de conhecimento (áudios e documentos)

Material em `../Evidencias/` (transcrições `.transcricao.txt` geradas com faster-whisper).

| Fonte | O que trouxe |
|---|---|
| WhatsApp + AUDIO1 | Lógica geral: marcar módulos/funcionalidades → somar horas → quebra por etapa |
| Audio1 | Evolução do simulador: de "só módulos" para "funcionalidades detalhadas"; cada funcionalidade tem horas quebradas por **etapa de projeto** (via %); integração tem abas próprias (Solution vs ERP terceiro) porque **as horas divergem** |
| Audio2 | Os **parâmetros da aba Resumo** precisam estar no app (ERP próprio vs terceiro muda horas de integração) |
| Audio3 | Fluxo pós-simulador: arquiteto salva no SharePoint → comercial gera proposta (R$/hora) → consultor usa o simulador pra montar o **LRP** |
| Audio4 | Estrutura do LRP: questionário por módulo, correlacionado com o simulador; visão de virar **agente**; gerar documento versionado |
| Audio5 | **Feedback direto sobre o app** (punch-list): tipo editável, criar módulos/funcionalidades, editar/criar fluxos de integração, cadastro de cliente, botão Salvar |

### Documentos LRP
- **Template oficial** (`[TEMPLATE] Levantamento de Regras e Processos … V.10.docx`): questionário **por módulo**.
- **MACPONTA** (LRP preenchido) e **4 documentos da Comigo** (Detalhamento de Escopo / Análise de
  Aderência — Fase I + Força de Vendas Agro/Insumos/Lojas). Segundo o usuário, **todos são a mesma
  ideia (LRP)**, só muda a nomenclatura. Os docs da Comigo (clientes complexos) incluem a **análise
  de aderência**: pontos "não aderentes" viram **Adequações** (dev sob medida).

**Cadeia do processo:**
```
Cliente → Simulação (escopo em horas) → LRP (regras e processos) → Proposta comercial
                                          ↳ Adequações (pontos não aderentes)
```

---

## 3. As regras da planilha (auditoria completa)

### 3.1 Parâmetros (aba Resumo)
- Nº de usuários licenciados
- Fator de gestão de projeto (0,08)
- ERP do cliente
- Método de integração do Aliare Integra
- Será usado ambiente de produção + homologação? (SIM/NÃO)
- O projeto será na Cloud Aliare? (**informativo na planilha — não usado em cálculo**)
- Fases de implantação
- Coeficiente de complexidade (multi-empresa) — **removido por decisão do usuário**

### 3.2 Composição do total (SERVIÇOS)
```
Total = Gestão + Instalação + Implantação + Integração + Adequações
```

**Instalação** (configurável no app):
```
base (1h) + horas do ERP + (4h se Prod+Homolog) + horas da hospedagem
```
> Na planilha era `1h + (5h se ERP "ALIARE - AGB") + (4h se Prod+Homolog)`. AGB/SIMER foram
> removidos; o "+5h do AGB" virou um campo **"horas de instalação por ERP"** configurável.

**Implantação** — cada módulo reparte as **horas marcadas (G)** em etapas (% por módulo):
| Etapa | Origem (Funcionalidades) | +30% Prod+Homolog? |
|---|---|---|
| LRP | col M | não |
| Validação de dados | col L | **sim** |
| Parametrização | col N | **sim** |
| Treinamento (Adm/Config/Simulação) | col O | não |
| Validação de ambiente | col P | não |
| Go-Live | col Q **× nº de turmas operacionais** | não |
| Acomp. Go-Live | `8h × fases × etapas de go-live` (fixo) | não |
| Pós-Produção | `12h` (fixo) | não |

> Validado contra a planilha: Fundamentais (33h) + Força de Vendas (45h) → 78h de etapas + 8 + 12 = **98h**.

**Integração Técnica** — Σ horas dos **fluxos de integração** cuja **matriz de ativação por módulo**
(SIM/NÃO nas abas Aliare Integra) intersecta os módulos contratados. Contexto: ERP **Aliare Solution**
→ aba Solution; qualquer outro → ERP Terceiro. Método "Sem integração" → zera.

**Gestão de Projeto:**
```
fator (0,08) × (Implantação + Integração + Adequações)   ← SEM a Instalação
```

**Adequações** — entrada manual (vem dos pontos "não aderentes" do LRP).

### 3.3 Formato dos Treinamentos
Seção com inputs próprios (≠ nº de usuários licenciados):
- Formato (Presencial/Remoto) do treino Adm e do Operacional/Go-Live
- Nº de administradores, operacionais (vendedores), gestores
- Tamanho da turma operacional e da turma gestor
- Etapas de Go-Live por fase

```
Qtd Turmas Operacionais = ⌈nº operacionais ÷ tam. turma operac.⌉ × etapas de Go-Live
```
**O Go-Live multiplica por essa quantidade de turmas.** (Ex.: 50 operacionais, turma 25 → 2 turmas → Go-Live dobra.)

### 3.4 Prod + Homologação
Quando SIM: +4h na instalação **e** +30% (configurável) **somente** em Validação de dados,
Parametrização e Validação de ambiente (as etapas refeitas em homologação). Na planilha as horas
ainda se dividem em 70% Produção + 30% Homologação para o cronograma.

---

## 4. Arquitetura da aplicação

Monorepo npm workspaces em `app/`:

```
app/
├── server/                 API Express (ESM) + PostgreSQL
│   ├── db/migrations/      schema SQL idempotente (001..010)
│   ├── scripts/            extratores Python (xlsx→json) + seeds (catálogo, etapas, LRP)
│   └── src/
│       ├── routes/         auth, catalogo, simulacoes, clientes, lrp, usuarios
│       ├── services/       auth, catalogo, simulacoes, calculo (motor), clientes, lrp
│       └── cli/            importar-catalogo, importar-etapas, importar-lrp-template, usuario-criar
└── web/                    Next.js 16 + React 19 + Tailwind v4 + TypeScript
    ├── app/                login, /(simulações), simulacoes/[id], clientes, catalogo,
    │                       integracao, lrp, configuracoes, como-funciona, usuarios
    ├── components/         app-shell, sidebar, topbar, auth/theme-provider
    └── lib/                api, types, menus, format
```

**Stack:** Node + Express + `pg` + JWT/bcrypt (backend); Next 16 (App Router) + Tailwind v4 (frontend).
**Banco:** PostgreSQL (`SimuladorCloverHoras`). Migrations idempotentes (sem tabela de controle).

### Telas
- **Simulações** — lista, nova, editor (parâmetros + treinamentos + módulos/funcionalidades + resultado por etapa ao vivo)
- **Clientes** — cadastro básico, vinculável à simulação
- **Catálogo** (admin) — CRUD de módulos/funcionalidades (tipo, horas, pacote padrão) e fluxos de integração (com matriz)
- **Configurações Gerais** (admin) — constantes do cálculo, horas por ERP, tipos de hospedagem
- **LRP** — gerado da simulação (só módulos contratados), preenchimento por tópico, **PDF no padrão Word**
- **Como funciona** — documentação visual das regras
- **Usuários** (admin)

---

## 5. Motor de cálculo (`server/src/services/calculo.js`)

Modelo validado contra a planilha. Resumo:
```
Implantação = Σ (por módulo) G × [ LRP% + Treino% + GoLive%×turmas
                                   + (ValDados% + Param% + ValAmb%) × (1 + 30% se Prod+Homolog) ]
              + Acomp.GoLive(8×fases×etapas) + PósProdução(12h)
Instalação  = base + ERP + (4h Prod+Homolog) + hospedagem
Integração  = Σ fluxos ativados pela matriz dos módulos contratados
Gestão      = fator × (Implantação + Integração + Adequações)
Total       = Gestão + Instalação + Implantação + Integração + Adequações
```
Percentuais por módulo em `modulos.pct_*` (importados de `scripts/etapas-seed.json`).

---

## 6. Módulo de LRP

- **Template** de tópicos por módulo + perguntas (`scripts/lrp-template.json`).
- **Geração** a partir de uma simulação → traz só os tópicos dos **módulos contratados**
  (snapshot versionável). Ex.: simulação MacPonta → 12 tópicos.
- **Preenchimento** por tópico (perguntas/respostas), com **finalizar** e **Imprimir/PDF**.
- **PDF formatado no padrão do Word**: capa, controle de versão, sumário e seções numeradas em
  CAIXA ALTA com conteúdo em tópicos.
- Existe um **exemplo pronto** ("MacPonta — Exemplo preenchido"), populado via
  `scripts/seed-lrp-macponta.js` com dados reais do documento da MacPonta.

---

## 7. Decisões tomadas

| Decisão | Detalhe |
|---|---|
| Infra | Paridade total com test-runner (Postgres + login) |
| Coeficiente de complexidade | **Removido** do cálculo e da UI |
| Cloud Aliare | Virou **cadastro "Tipo de hospedagem"** (Cloud/On-premise…) com horas configuráveis |
| Instalação | **100% configurável** (base, horas por ERP, prod+homolog, hospedagem em Configurações Gerais) |
| AGB / SIMER | **Removidos**; contexto de integração = só Aliare Solution → Solution |
| "Integração antiga" | Não existe (opção legada/quebrada na planilha) |
| Fator de volume (carga inicial) | **Não** implementado (decisão do usuário) |
| LRP — aderência na tela | **Removida** da tela de preenchimento (mantida no banco) |
| Comigo (4 docs) | Tratados como LRP (mesma ideia da MacPonta) |

---

## 8. Como rodar

```bash
cd app
npm install

node server/src/db/ensure-db.js          # cria o banco se faltar
npm run db:migrate-all                    # aplica migrations
# importa catálogo (precisa do .xlsx + python/openpyxl):
python server/scripts/extrair_catalogo.py "<xlsx>" server/scripts/catalogo-seed.json
npm run catalogo:importar -- --reset
npm run etapas:importar                   # percentuais de etapa por módulo
npm run lrp:importar-template             # tópicos/perguntas do LRP
npm run usuario:criar -- --nome "Admin" --email admin@aliare.com --senha admin123 --papel admin

npm run dev:server                        # API  http://localhost:3010
npm run dev:web                           # Web  http://localhost:3000
```

`.env` (gitignored) guarda a conexão do Postgres e o `SESSION_SECRET`.

---

## 9. Pendências / pontos a evoluir

- **Registro de Visita** e **Potencial & Metas**: a planilha calcula algumas etapas sobre
  `(G − validação)`; no app usamos `%` sobre `G` direto (aproximação documentada em `etapas-seed.json`).
- Split visível **70% Produção / 30% Homologação** por etapa (hoje aplicamos o +30% no agregado).
- Exportar o LRP em **.docx** (hoje é PDF via navegador).
- Importar a **matriz de ativação por funcionalidade** para fidelidade total da integração.
- Evolução do LRP para **agente/IA** e geração de arquivo para parametrização do Clover (wizards/API).
