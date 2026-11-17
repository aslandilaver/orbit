"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Accessible tab list (WAI-ARIA tabs pattern, arrow-key navigation).
 * `variant="underline"` for page-level tabs, `"pill"` for compact toggles.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  variant = "underline",
  label,
  className,
  idPrefix = "tab",
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: ReactNode; count?: number }[];
  variant?: "underline" | "pill";
  label: string;
  className?: string;
  idPrefix?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent, i: number) {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(items[next]!.value);
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        variant === "underline"
          ? "flex gap-5 overflow-x-auto border-b border-line [scrollbar-width:none]"
          : "inline-flex rounded-md border border-line-2 bg-bg p-0.5",
        className,
      )}
    >
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${idPrefix}-${item.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative shrink-0 whitespace-nowrap transition-colors",
              variant === "underline"
                ? cn(
                    "-mb-px flex h-10 items-center gap-1.5 border-b text-[13px]",
                    active ? "border-fg text-fg" : "border-transparent text-fg-2 hover:text-fg",
                  )
                : cn(
                    "h-7 rounded-sm px-3 text-[13px] font-medium",
                    active ? "bg-surface-3 text-fg" : "text-fg-2 hover:text-fg",
                  ),
            )}
          >
            {item.label}
            {item.count !== undefined && <span className="font-mono text-2xs text-fg-3 tabular">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
