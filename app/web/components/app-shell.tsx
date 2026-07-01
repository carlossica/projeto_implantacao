"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

// Rotas sem casca (login renderiza o próprio layout).
const ROTAS_SEM_CASCA = ["/login"];
const CHAVE_RECOLHIDO = "sidebar_recolhido";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [recolhido, setRecolhido] = useState(false);

  // Restaura a preferência do usuário após montar (evita mismatch de hidratação).
  useEffect(() => {
    if (localStorage.getItem(CHAVE_RECOLHIDO) === "1") setRecolhido(true);
  }, []);

  function alternarSidebar() {
    setRecolhido((v) => {
      const novo = !v;
      try { localStorage.setItem(CHAVE_RECOLHIDO, novo ? "1" : "0"); } catch {}
      return novo;
    });
  }

  if (ROTAS_SEM_CASCA.includes(pathname)) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex h-full min-h-screen">
          <Sidebar recolhido={recolhido} />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar recolhido={recolhido} onAlternarSidebar={alternarSidebar} />
            <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
          </div>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
