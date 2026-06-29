// Helpers de fetch client-side contra /api/* (proxado pro backend Express).

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Não autenticado");
  }
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const corpo = await res.json();
      msg = corpo.error ?? msg;
      if (Array.isArray(corpo.detalhes) && corpo.detalhes.length) msg += `: ${corpo.detalhes.join(", ")}`;
    } catch {
      /* corpo não-json */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`/api${path}`, { cache: "no-store" }).then((r) => handle<T>(r));
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => handle<T>(r));
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`/api${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => handle<T>(r));
}

export function apiDelete<T>(path: string): Promise<T> {
  return fetch(`/api${path}`, { method: "DELETE" }).then((r) => handle<T>(r));
}
