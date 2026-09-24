"use client";

import { useState, useTransition, type FormEvent } from "react";
import { apiCreateStockAlert } from "@/app/lib/api";

interface Props {
  productId: number;
  variantId?: number;
  /** Optional label shown above the form — defaults to the standard message */
  label?: string;
}

type State = "idle" | "success" | "duplicate" | "error";

export default function NotifyMeForm({ productId, variantId, label }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      try {
        await apiCreateStockAlert(productId, email.trim(), variantId);
        setState("success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        if (msg.toLowerCase().includes("already")) {
          setState("duplicate");
        } else {
          setState("error");
          setErrorMsg(msg);
        }
      }
    });
  }

  // ── Success state ─────────────────────────────────────────────────────
  if (state === "success" || state === "duplicate") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          {state === "duplicate"
            ? "You're already on the notify list for this item."
            : "Got it! We'll email you the moment it's back in stock."}
        </p>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      {/* Bell icon + label */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-zinc-600 dark:text-zinc-300">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {label ?? "Notify me when available"}
        </p>
      </div>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Enter your email and we&apos;ll let you know the moment this item is restocked.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
        />
        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {isPending ? "…" : "Notify me"}
        </button>
      </form>

      {state === "error" && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
