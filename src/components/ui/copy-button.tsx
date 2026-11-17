"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 1600);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("copied");
        } catch {
          setState("failed");
        }
      }}
      className={cn(
        "inline-grid size-6 place-items-center rounded-xs text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg",
        className,
      )}
      aria-label={state === "copied" ? "Copied" : label}
      title={state === "failed" ? "Clipboard unavailable" : label}
    >
      {state === "copied" ? <Check className="size-3.5 text-up" /> : <Copy className="size-3.5" />}
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Copy failed" : ""}
      </span>
    </button>
  );
}
