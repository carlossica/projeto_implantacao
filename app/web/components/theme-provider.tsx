"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Tema = "claro" | "escuro";

type TemaCtx = { tema: Tema; alternar: () => void };
const Ctx = createContext<TemaCtx | null>(null);

const STORAGE_KEY = "tema";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE_KEY);
      if (t === "escuro" || t === "claro") setTema(t);
    } catch {
      /* sem localStorage */
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (tema === "escuro") html.classList.add("dark");
    else html.classList.remove("dark");
  }, [tema]);

  function alternar() {
    setTema((cur) => {
      const next = cur === "claro" ? "escuro" : "claro";
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }

  return <Ctx.Provider value={{ tema, alternar }}>{children}</Ctx.Provider>;
}

export function useTema(): TemaCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTema precisa estar dentro de ThemeProvider");
  return v;
}
