"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "info" | "error";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (payload: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((payload: { title: string; description?: string; variant?: ToastVariant }) => {
    const id = Date.now() + Math.random();
    const toast = { ...payload, id, variant: payload.variant ?? "success" };

    setItems((current) => [...current, toast]);
    window.setTimeout(() => {
      setItems((current) => current.filter((entry) => entry.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed bottom-20 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2 sm:bottom-24 sm:right-6">
        {items.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-all duration-300 ${
              toast.variant === "error"
                ? "border-red-200 text-red-700"
                : toast.variant === "info"
                  ? "border-cyan-200 text-slate-800"
                  : "border-emerald-200 text-emerald-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                  toast.variant === "error"
                    ? "bg-red-100 text-red-600"
                    : toast.variant === "info"
                      ? "bg-cyan-100 text-cyan-700"
                      : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {toast.variant === "error" ? "!" : toast.variant === "info" ? "i" : "✓"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-xs opacity-80">{toast.description}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
