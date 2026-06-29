"use client";

import { useState } from "react";
import { AliareLogo } from "@/components/aliare-logo";
import { PasswordInput } from "@/components/password-input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErro(body.error ?? `Erro ${res.status}`);
        setEnviando(false);
        return;
      }
      // Hard navigate: o proxy do Next precisa re-ler o cookie recém-setado.
      window.location.href = "/";
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lateral preta — branding (oculta em mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-[#0a0a0a] text-white flex-col justify-between py-16 pl-6 pr-16">
        <AliareLogo variant="light" className="h-14 w-auto" />

        <div>
          <div className="text-[#3CC72D] text-sm font-bold tracking-widest uppercase mb-6">
            Simulador Clover
          </div>
          <h2 className="text-3xl leading-tight font-bold">
            Estimativa de horas para projetos de implantação Clover CRM.
          </h2>
        </div>

        <div />
      </div>

      {/* Lado branco — formulário */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Logo em mobile (substitui a lateral preta) */}
          <div className="md:hidden flex justify-center mb-10">
            <AliareLogo className="h-10 w-auto" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-10">
            Acesse sua conta
          </h1>

          <form onSubmit={entrar} className="space-y-6">
            {erro && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="nome@aliare.com"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:border-aliare-600 focus:ring-2 focus:ring-aliare-600/15"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1.5">
                Senha
              </label>
              <PasswordInput
                value={senha}
                onChange={setSenha}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:border-aliare-600 focus:ring-2 focus:ring-aliare-600/15"
              />
            </div>

            <button
              type="submit"
              disabled={enviando || !email.trim() || !senha}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-aliare-600 hover:bg-aliare-700 px-4 py-3.5 text-base font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 dark:text-gray-300 mt-8">
            Contate o administrador para ter um usuário.
          </p>
        </div>
      </div>
    </div>
  );
}
