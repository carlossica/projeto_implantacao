"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiDelete } from "@/lib/api";
import type { Simulacao } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { horas, dataHora } from "@/lib/format";

export default function ListaSimulacoes() {
  const [simulacoes, setSimulacoes] = useState<Simulacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    try {
      setCarregando(true);
      const data = await apiGet<{ simulacoes: Simulacao[] }>("/simulacoes");
      setSimulacoes(data.simulacoes);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function excluir(id: number, nome: string) {
    if (!confirm(`Excluir a simulação "${nome}"?`)) return;
    await apiDelete(`/simulacoes/${id}`);
    carregar();
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        titulo="Minhas Simulações"
        descricao="Estimativas de horas para projetos de implantação Clover CRM."
        acao={
          <div className="flex items-center gap-2">
            <Link href="/como-funciona" className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium px-4 py-2 transition-colors">
              📘 Orientações de uso
            </Link>
            <Link href="/simulacoes/nova" className="inline-flex items-center gap-1.5 rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium px-4 py-2 transition-colors">
              + Nova Simulação
            </Link>
          </div>
        }
      />

      <Link href="/como-funciona" className="block mb-6 rounded-xl border border-aliare-200 dark:border-aliare-800 bg-aliare-50 dark:bg-aliare-900/20 px-5 py-4 hover:bg-aliare-100 dark:hover:bg-aliare-900/30 transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-aliare-800 dark:text-aliare-200">📘 Entenda as regras do simulador</div>
            <div className="text-xs text-aliare-700/80 dark:text-aliare-300/80">Documentação visual: como o total de horas é calculado, o que cada parâmetro faz e os conceitos-chave.</div>
          </div>
          <span className="text-aliare-600 dark:text-aliare-400 text-sm font-medium shrink-0">Abrir →</span>
        </div>
      </Link>

      {erro && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{erro}</div>}

      {carregando ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Carregando…</div>
      ) : simulacoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma simulação ainda.</p>
          <Link href="/simulacoes/nova" className="mt-3 inline-block text-sm font-medium text-aliare-600 hover:text-aliare-700">
            Criar a primeira →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Cliente / Projeto</th>
                <th className="px-4 py-3 font-semibold">ERP</th>
                <th className="px-4 py-3 font-semibold text-center">Módulos</th>
                <th className="px-4 py-3 font-semibold">Atualizado</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {simulacoes.map((s) => (
                <tr key={s.id} className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3">
                    <Link href={`/simulacoes/${s.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-aliare-600">
                      {s.nome}
                    </Link>
                    <div className="text-xs text-gray-400">{s.criado_por_nome ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.erp_nome ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{s.qtd_modulos ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{dataHora(s.atualizado_em)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/simulacoes/${s.id}`} className="text-aliare-600 hover:text-aliare-700 font-medium mr-3">Abrir</Link>
                    <button onClick={() => excluir(s.id, s.nome)} className="text-red-500 hover:text-red-600">Excluir</button>
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
