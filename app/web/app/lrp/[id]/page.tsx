"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPut, apiDelete } from "@/lib/api";
import type { Lrp } from "@/lib/types";

export default function LrpDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [lrp, setLrp] = useState<Lrp | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try { setLrp((await apiGet<{ lrp: Lrp }>(`/lrp/${id}`)).lrp); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }, [id]);
  useEffect(() => { carregar(); }, [carregar]);

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(null), 1500); }

  async function salvarResposta(respostaId: number, valor: string) {
    try { await apiPut(`/lrp/respostas/${respostaId}`, { resposta: valor }); flash("Salvo"); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  async function alternarStatus() {
    if (!lrp) return;
    const novo = lrp.status === "finalizada" ? "rascunho" : "finalizada";
    await apiPut(`/lrp/${id}`, { status: novo });
    carregar();
  }

  async function excluir() {
    if (!lrp) return;
    if (!confirm(`Excluir a LRP "${lrp.nome}" (v${lrp.versao})? Esta ação não pode ser desfeita.`)) return;
    try { await apiDelete(`/lrp/${id}`); router.push("/lrp"); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  if (erro) return <div className="text-sm text-red-600 dark:text-red-400">{erro}</div>;
  if (!lrp) return <div className="text-sm text-gray-500 dark:text-gray-400">Carregando…</div>;

  const inputCls = "w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-aliare-500";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 print:hidden">
        <div className="min-w-0">
          <Link href="/lrp" className="text-xs text-gray-400 hover:text-aliare-600">← Voltar</Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{lrp.nome} <span className="text-sm font-normal text-gray-400">v{lrp.versao}</span></h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lrp.cliente_nome ? `${lrp.cliente_nome} · ` : ""}{lrp.itens?.length ?? 0} tópicos
            {lrp.simulacao_id && <> · <Link href={`/simulacoes/${lrp.simulacao_id}`} className="text-aliare-600 hover:underline">ver simulação</Link></>}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {msg && <span className="text-xs text-aliare-600">{msg}</span>}
          <button onClick={() => window.print()} className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Imprimir / PDF</button>
          <button onClick={alternarStatus} className={"rounded-md px-3 py-1.5 text-sm font-medium text-white " + (lrp.status === "finalizada" ? "bg-amber-600 hover:bg-amber-700" : "bg-aliare-600 hover:bg-aliare-700")}>
            {lrp.status === "finalizada" ? "Reabrir" : "Finalizar"}
          </button>
          <button onClick={excluir} className="rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 text-sm font-medium">Excluir</button>
        </div>
      </div>

      <div className="space-y-6 print:hidden">
        {(lrp.itens ?? []).map((item, idx) => (
          <section key={item.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="mb-2 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{idx + 1}. {item.titulo}</h2>
              {item.modulo_nome && <span className="text-[11px] text-gray-400">{item.modulo_nome.replace("CRM - MM - ", "")}</span>}
            </div>
            {item.descricao && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{item.descricao}</p>}

            <div className="space-y-4">
              {item.respostas.map((r) => (
                <div key={r.id}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{r.pergunta}</label>
                  {r.orientacao && <p className="text-xs text-gray-400 mb-1">{r.orientacao}</p>}
                  {r.tipo_resposta === "sim_nao" ? (
                    <select defaultValue={r.resposta ?? ""} onChange={(e) => salvarResposta(r.id, e.target.value)} className={inputCls + " max-w-xs"}>
                      <option value="">—</option><option value="Sim">Sim</option><option value="Não">Não</option>
                    </select>
                  ) : (
                    <textarea defaultValue={r.resposta ?? ""} onBlur={(e) => { if (e.target.value !== (r.resposta ?? "")) salvarResposta(r.id, e.target.value); }} rows={2} className={inputCls} placeholder="Resposta do cliente…" />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Documento formatado (padrão Word) — só aparece na impressão/PDF. */}
      <LrpDocumento lrp={lrp} />
    </div>
  );
}

function dataCurta(iso?: string): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

// Monta o texto do tópico (bullet). Respostas curtas (Sim/Não) ganham a pergunta
// como contexto; respostas longas já são frases completas.
function textoBullet(pergunta: string, resposta: string): string {
  const r = resposta.trim();
  const curta = r.length <= 4;
  if (!curta) return r;
  const perguntaLimpa = pergunta.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  return `${perguntaLimpa} ${r}`;
}

function LrpDocumento({ lrp }: { lrp: Lrp }) {
  const titulo = lrp.cliente_nome || lrp.nome;
  const itens = lrp.itens ?? [];
  return (
    <div className="hidden print:block lrp-doc">
      {/* Capa */}
      <div className="lrp-cover">
        <div className="lrp-cover-kicker">LEVANTAMENTO DE REGRAS E PROCESSOS</div>
        <div className="lrp-cover-sub">PROJETO DE IMPLANTAÇÃO – CLOVER CRM</div>
        <h1 className="lrp-cover-title">{titulo}</h1>
        <div className="lrp-cover-versao">Versão {lrp.versao}.0</div>
      </div>

      <div className="lrp-running">Levantamento de Regras e Processos · Projeto de Implantação · Clover CRM</div>

      {/* Controle de versão */}
      <h2 className="lrp-h2">Controle de versão do documento</h2>
      <table className="lrp-table">
        <thead><tr><th>Data</th><th>Responsável</th><th>Descrição</th><th>Versão</th></tr></thead>
        <tbody>
          <tr>
            <td>{dataCurta(lrp.criado_em)}</td>
            <td>{lrp.criado_por_nome ?? "—"}</td>
            <td>Levantamento de regras e processos</td>
            <td>{lrp.versao}.0</td>
          </tr>
        </tbody>
      </table>

      <p className="lrp-intro">
        Este documento apresenta a definição das regras e dos processos que serão implementados
        no projeto de implantação do Clover CRM para {titulo}.
      </p>

      {/* Sumário */}
      <h2 className="lrp-h2">Sumário</h2>
      <ol className="lrp-sumario">
        {itens.map((it) => <li key={it.id}>{it.titulo}</li>)}
      </ol>

      {/* Seções */}
      {itens.map((item, idx) => {
        const respondidas = item.respostas.filter((r) => r.resposta && r.resposta.trim());
        return (
          <section key={item.id} className="lrp-secao">
            <h2 className="lrp-secao-titulo">{idx + 1}. {item.titulo.toUpperCase()}</h2>
            {item.descricao && <p className="lrp-secao-desc">{item.descricao}</p>}
            <ul className="lrp-bullets">
              {respondidas.map((r) => <li key={r.id}>{textoBullet(r.pergunta, r.resposta as string)}</li>)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
