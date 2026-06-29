"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { PageHeader } from "@/components/page-header";

export default function TrocarSenha() {
  const router = useRouter();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setMsg(null);
    try {
      await apiPost("/auth/trocar-senha", { senha_atual: atual, senha_nova: nova });
      setMsg("Senha alterada com sucesso.");
      setAtual(""); setNova("");
      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro");
    }
  }

  const inputCls = "w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-aliare-500";

  return (
    <div className="max-w-md mx-auto">
      <PageHeader titulo="Trocar senha" />
      <form onSubmit={enviar} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha atual</label>
          <input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
          <input type="password" value={nova} onChange={(e) => setNova(e.target.value)} className={inputCls} required minLength={6} />
        </div>
        {erro && <div className="text-sm text-red-600 dark:text-red-400">{erro}</div>}
        {msg && <div className="text-sm text-aliare-600">{msg}</div>}
        <button type="submit" className="w-full rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium py-2">Alterar senha</button>
      </form>
    </div>
  );
}
