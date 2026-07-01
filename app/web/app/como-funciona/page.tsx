"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Configuracao, Erp, TipoHospedagem } from "@/lib/types";
import { PageHeader } from "@/components/page-header";

export default function ComoFuncionaPage() {
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [erps, setErps] = useState<Erp[]>([]);
  const [hosp, setHosp] = useState<TipoHospedagem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [c, e, h] = await Promise.all([
          apiGet<{ configuracoes: Configuracao[] }>("/catalogo/configuracoes"),
          apiGet<{ erps: Erp[] }>("/catalogo/erps"),
          apiGet<{ hospedagem: TipoHospedagem[] }>("/catalogo/hospedagem"),
        ]);
        setCfg(Object.fromEntries(c.configuracoes.map((x) => [x.chave, x.valor])));
        setErps(e.erps);
        setHosp(h.hospedagem);
      } catch { /* silencioso */ }
    })();
  }, []);

  const v = (k: string, d = "—") => cfg[k] ?? d;
  const pct = (k: string) => { const n = Number(cfg[k]); return Number.isFinite(n) ? `${Math.round(n * 100)}%` : "—"; };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader
        titulo="Orientações de uso"
        descricao="Documentação visual das regras do simulador — a mesma lógica da planilha, agora configurável."
      />

      {/* ===== Fluxo geral ===== */}
      <Secao titulo="1. O fluxo do processo" cor="aliare">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <Fluxo titulo="Cliente" sub="dores e desejos" />
          <Seta />
          <Fluxo titulo="Simulação" sub="módulos + funcionalidades = escopo em horas" destaque />
          <Seta />
          <Fluxo titulo="LRP" sub="regras e processos por módulo" />
          <Seta />
          <Fluxo titulo="Proposta" sub="horas × valor/hora (comercial)" />
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          A <b>Simulação</b> define o que foi vendido. A partir dela nasce a <b>LRP</b> (só com os módulos contratados).
          O total de horas vai para o comercial montar a proposta.
        </p>
      </Secao>

      {/* ===== Composição do total ===== */}
      <Secao titulo="2. Como o total de horas é composto" cor="azul">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card titulo="🛠️ Implantação (por etapas)" cor="border-l-aliare-500">
            <p>As horas marcadas de cada módulo são repartidas em <b>etapas</b> (% por módulo):</p>
            <ul className="mt-1 list-disc pl-5 text-xs">
              <li>LRP · Validação de dados · Parametrização · Treinamento · Validação de ambiente · Go-Live</li>
              <li><b>Go-Live × nº de turmas operacionais</b> (escala com as turmas)</li>
              <li>+ Acomp. Go-Live = 8h × fases × etapas · + Pós-Produção = 12h (fixos)</li>
              <li>Prod+Homolog soma +{pct("acrescimo_prod_homolog")} em Validação de dados, Parametrização e Validação de ambiente.</li>
            </ul>
          </Card>
          <Card titulo="📦 Instalação" cor="border-l-blue-500">
            <p>Totalmente configurável, somando 4 parcelas:</p>
            <Formula>
              base ({v("instalacao_base_horas")}h) + ERP (horas do ERP) + Prod+Homolog ({v("instalacao_prod_homolog_horas")}h) + Hospedagem
            </Formula>
          </Card>
          <Card titulo="🔌 Integração Técnica" cor="border-l-purple-500">
            <p>Soma dos <b>fluxos de integração</b> ativados pelos módulos contratados (matriz SIM/NÃO).</p>
            <ul className="mt-1 list-disc pl-5 text-xs">
              <li>ERP <b>Aliare Solution</b> → fluxos da aba Solution; <b>outros ERPs</b> → ERP Terceiro.</li>
              <li>Método <b>“Sem integração”</b> → zera as horas de integração.</li>
            </ul>
          </Card>
          <Card titulo="📋 Gestão de Projeto" cor="border-l-amber-500">
            <p>Percentual sobre a Implantação, Integração e Adequações (sem a Instalação).</p>
            <Formula>fator ({pct("fator_gestao_projeto")}) × (Implantação + Integração + Adequações)</Formula>
          </Card>
          <Card titulo="🧩 Adequações" cor="border-l-rose-500">
            <p>Desenvolvimentos sob medida (pontos “não aderentes” identificados na LRP). Entrada manual.</p>
          </Card>
          <Card titulo="🎓 Treinamento e Turmas" cor="border-l-teal-500">
            <p>O nº de operacionais e o tamanho da turma definem quantas <b>turmas</b>, e isso multiplica o Go-Live.</p>
            <Formula>turmas operac. = ⌈operacionais ÷ tam. turma⌉ × etapas de Go-Live</Formula>
          </Card>
        </div>
        <div className="mt-4 rounded-lg bg-aliare-50 dark:bg-aliare-900/20 border border-aliare-200 dark:border-aliare-800 px-4 py-3 text-sm text-aliare-800 dark:text-aliare-200">
          <b>Total estimado</b> = Gestão + Instalação + Implantação + Integração + Adequações
        </div>
      </Secao>

      {/* ===== Parâmetros ===== */}
      <Secao titulo="3. O que cada parâmetro faz" cor="roxo">
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr><th className="px-4 py-2">Parâmetro</th><th className="px-4 py-2">Efeito no cálculo</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                ["Nº de usuários licenciados", "Define turmas e consultores de treinamento."],
                ["ERP do cliente", "Decide o conjunto de fluxos de integração (Solution × ERP Terceiro) e soma as horas de instalação do ERP."],
                ["Método de integração", "“Sem integração” zera a integração; demais usam os fluxos."],
                ["Prod + Homologação", `+${v("instalacao_prod_homolog_horas")}h na instalação e +${pct("acrescimo_prod_homolog")} em Validação de dados, Parametrização e Validação de ambiente.`],
                ["Tipo de hospedagem", "Soma as horas configuradas do tipo (Cloud, On-premise…) na instalação."],
                ["Formato dos Treinamentos", "Nº de operacionais/gestores e tamanho das turmas → quantidade de turmas, que multiplica o Go-Live."],
                ["Fases de implantação", "Multiplica o Acompanhamento de Go-Live (8h × fases × etapas)."],
                ["Fator de gestão de projeto", "Percentual da Gestão sobre Implantação + Integração + Adequações (sem a Instalação)."],
              ].map(([p, e]) => (
                <tr key={p} className="bg-white dark:bg-gray-950">
                  <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200 align-top">{p}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{e}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      {/* ===== Valores atuais ===== */}
      <Secao titulo="4. Valores configurados hoje" cor="azul">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Horas de instalação por ERP</div>
            <ul className="text-sm space-y-1">
              {erps.map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span className="text-gray-600 dark:text-gray-300 truncate">{e.nome}</span>
                  <span className="text-gray-500 shrink-0">{Number(e.horas_instalacao ?? 0)}h</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Tipos de hospedagem</div>
            <ul className="text-sm space-y-1">
              {hosp.map((h) => (
                <li key={h.id} className="flex justify-between gap-2">
                  <span className="text-gray-600 dark:text-gray-300 truncate">{h.nome}</span>
                  <span className="text-gray-500 shrink-0">{Number(h.horas)}h</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">Edite estes valores em <Link href="/configuracoes" className="text-aliare-600 hover:underline">Configurações Gerais</Link>.</p>
      </Secao>

      {/* ===== Conceitos ===== */}
      <Secao titulo="5. Conceitos-chave" cor="aliare">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Conceito titulo="Pacote padrão">
            Cada módulo tem funcionalidades marcadas como padrão (geralmente as obrigatórias). Ao contratar o módulo, elas já entram marcadas — o consultor só ajusta o adicional.
          </Conceito>
          <Conceito titulo="Matriz de integração">
            Cada fluxo de integração tem um SIM/NÃO por módulo. O fluxo só soma horas quando ao menos um módulo contratado o ativa — por isso a integração escala com o escopo.
          </Conceito>
          <Conceito titulo="LRP → Adequações">
            A LRP levanta as regras por módulo. Pontos que o Clover não atende viram “Adequações” (desenvolvimento sob medida), que entram como horas extras.
          </Conceito>
        </div>
      </Secao>

      <div className="mt-8 text-center">
        <Link href="/simulacoes/nova" className="inline-flex rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium px-6 py-2.5">
          Criar uma simulação →
        </Link>
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; cor?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{titulo}</h2>
      {children}
    </section>
  );
}

function Fluxo({ titulo, sub, destaque }: { titulo: string; sub: string; destaque?: boolean }) {
  return (
    <div className={"flex-1 rounded-xl border p-4 text-center " + (destaque ? "border-aliare-400 bg-aliare-50 dark:bg-aliare-900/30" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900")}>
      <div className={"font-semibold " + (destaque ? "text-aliare-700 dark:text-aliare-300" : "text-gray-900 dark:text-gray-100")}>{titulo}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</div>
    </div>
  );
}

function Seta() {
  return <div className="flex items-center justify-center text-gray-300 dark:text-gray-600 text-xl rotate-90 sm:rotate-0">→</div>;
}

function Card({ titulo, cor, children }: { titulo: string; cor: string; children: React.ReactNode }) {
  return (
    <div className={"rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 " + cor + " bg-white dark:bg-gray-900 p-4"}>
      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{titulo}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">{children}</div>
    </div>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 rounded-md bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-mono text-gray-700 dark:text-gray-200">{children}</div>;
}

function Conceito({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="font-semibold text-aliare-700 dark:text-aliare-300 mb-1">{titulo}</div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{children}</p>
    </div>
  );
}
