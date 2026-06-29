"use client";

import { useState } from "react";

/** Input de senha com botão olho pra mostrar/ocultar. */
export function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
  minLength,
  autoFocus,
  autoComplete,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  autoComplete?: string;
  className?: string;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative">
      <input
        type={visivel ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className={
          (className ??
            "w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-aliare-600 focus:ring-2 focus:ring-aliare-600/15") +
          " pr-10"
        }
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        title={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 transition-colors"
      >
        {visivel ? (
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M3.7 2.3a1 1 0 011.4 1.4l-1.2 1.2a10 10 0 014-.9c4.5 0 8.4 3 9.7 7a10 10 0 01-2.5 4l1.5 1.5a1 1 0 11-1.4 1.4l-14-14a1 1 0 010-1.4zm5.2 6.6L7 7c-.5.8-.8 1.8-.8 2.8 0 2.8 2.3 5 5 5 1 0 1.9-.3 2.7-.8l-1.8-1.8a3 3 0 01-4-4z" clipRule="evenodd" />
            <path d="M10 5c-1 0-1.9.1-2.8.4l1.5 1.5a3 3 0 013.4 3.4l2 2A8 8 0 0019.7 10 10 10 0 0010 5z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M10 4c-4.5 0-8.4 3-9.7 7C1.6 15 5.5 18 10 18s8.4-3 9.7-7c-1.3-4-5.2-7-9.7-7zm0 11a4 4 0 110-8 4 4 0 010 8z" />
            <circle cx="10" cy="11" r="2.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
