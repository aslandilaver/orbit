"use client";

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

const ToastCtx = createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      setTimeout(() => dismiss(id), t.tone === "error" ? 7000 : 4500);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:right-0 sm:left-auto sm:items-end"
      >
        {toasts.map((t) => {
          const Icon = t.tone === "success" ? CircleCheck : t.tone === "error" ? CircleAlert : Info;
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm animate-[dialog-in_180ms_ease-out] items-start gap-3 rounded-md border border-line-2 bg-surface px-3.5 py-3 shadow-xl"
            >
              <Icon
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  t.tone === "success" ? "text-up" : t.tone === "error" ? "text-down" : "text-fg-2",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-fg">{t.title}</div>
                {t.description && <div className="mt-0.5 text-xs break-words text-fg-2">{t.description}</div>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-fg-3 hover:text-fg"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
