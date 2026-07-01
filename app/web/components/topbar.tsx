"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useTema } from "@/components/theme-provider";

export function Topbar({ recolhido = false, onAlternarSidebar }: { recolhido?: boolean; onAlternarSidebar?: () => void }) {
  const { usuario, sair } = useAuth();
  const { tema, alternar } = useTema();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fora(ev: MouseEvent) {
      if (ref.current && !ref.current.contains(ev.target as Node)) setAberto(false);
    }
    function esc(ev: KeyboardEvent) { if (ev.key === "Escape") setAberto(false); }
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  if (!usuario) return null;

  const papelLabel = usuario.papel === "admin" ? "Administrador" : usuario.papel === "editor" ? "Editor" : "Visualizador";
  const iniciais = usuario.nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="h-14 shrink-0 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center justify-between px-6">
      <button
        type="button"
        onClick={onAlternarSidebar}
        title={recolhido ? "Expandir menu" : "Recolher menu"}
        aria-label={recolhido ? "Expandir menu lateral" : "Recolher menu lateral"}
        className="rounded-md p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5A.75.75 0 012.75 14h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 14.75z" clipRule="evenodd" />
        </svg>
      </button>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="w-8 h-8 rounded-full bg-aliare-600 text-white text-sm font-semibold flex items-center justify-center">
            {iniciais}
          </span>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">{usuario.nome}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">{papelLabel}</span>
          </div>
          <svg className={"w-3.5 h-3.5 text-gray-400 transition-transform " + (aberto ? "rotate-180" : "")} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" clipRule="evenodd" />
          </svg>
        </button>

        {aberto && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{usuario.nome}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{usuario.email}</div>
            </div>
            <div className="py-1">
              <Link href="/trocar-senha" onClick={() => setAberto(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                Trocar senha
              </Link>
              <button type="button" onClick={alternar} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                {tema === "claro" ? "Tema Escuro" : "Tema Claro"}
              </button>
              <button type="button" onClick={() => { setAberto(false); sair(); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
