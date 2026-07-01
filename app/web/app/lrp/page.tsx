"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiDelete } from "@/lib/api";
import type { Lrp } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { dataHora } from "@/lib/format";

export default function LrpListaPage() {
  const [lrps, setLrps] = useState<Lrp[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    try {
      setCarregando(true);
      setLrps((await apiGet<{ lrps: Lrp[] }>("/lrp")).lrps);
    } catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
    finally { setCarregando(false); }
  }
  useEffect(() => { carregar(); }, []);

  async function excluir(l: Lrp) {
    if (!confirm(`Excluir a LRP "${l.nome}" (v${l.versao})?`)) return;
    await apiDelete(`/lrp/${l.id}`);
    carregar();
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        titulo="LRP — Levantamento de Regras e Processos"
        descricao="As LRPs são geradas a partir de uma simulação, trazendo só os módulos contratados."
      />
      {erro && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{erro}</div>}

      {carregando ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Carregando…</div>
      ) : lrps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma LRP ainda.</p>
          <p className="mt-2 text-sm text-gray-400">Abra uma simulação e use <span className="font-medium">“Gerar LRP”</span>.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Nome</th><th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-center">Versão</th><th className="px-4 py-3 text-center">Tópicos</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3">Atualizado</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {lrps.map((l) => (
                <tr key={l.id} className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3"><Link href={`/lrp/${l.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-aliare-600">{l.nome}</Link></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{l.cliente_nome ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">v{l.versao}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{l.qtd_topicos ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={"text-xs px-2 py-0.5 rounded " + (l.status === "finalizada" ? "bg-aliare-100 text-aliare-700 dark:bg-aliare-900/40 dark:text-aliare-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300")}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{dataHora(l.atualizado_em)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/lrp/${l.id}`} className="text-aliare-600 hover:text-aliare-700 font-medium mr-3">Abrir</Link>
                    <button onClick={() => excluir(l)} className="text-red-500 hover:text-red-600">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
