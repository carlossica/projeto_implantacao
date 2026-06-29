"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Usuario } from "@/lib/types";

type AuthCtx = {
  usuario: Usuario | null;
  carregando: boolean;
  ehAdmin: boolean;
  podeEscrever: boolean;
  recarregar: () => Promise<void>;
  sair: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsuario(data.usuario);
      } else {
        setUsuario(null);
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    } catch {
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  const sair = useCallback(async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    setUsuario(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);

  const ehAdmin = !!usuario && usuario.papel === "admin";
  const podeEscrever = !!usuario && (usuario.papel === "admin" || usuario.papel === "editor");

  return (
    <Ctx.Provider value={{ usuario, carregando, ehAdmin, podeEscrever, recarregar, sair }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return v;
}
