import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─── Surface ──────────────────────────────────────────────────── */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-lg border border-line bg-bg-2", className)} {...props} />;
}

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-line px-4 py-3", className)}>
      <div className="min-w-0">
        <h3 className="text-[13px] font-medium text-fg">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-fg-3">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─── Badge ────────────────────────────────────────────────────── */
type Tone = "neutral" | "accent" | "up" | "down" | "warn";
const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-2 border-line-2",
  accent: "bg-accent-dim text-accent border-accent/20",
  up: "bg-up-dim text-up border-up/20",
  down: "bg-down-dim text-down border-down/20",
  warn: "bg-warn-dim text-warn border-warn/20",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-xs border px-1.5 text-2xs font-medium whitespace-nowrap [&_svg]:size-3",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-sm bg-[linear-gradient(90deg,var(--color-surface)_0%,var(--color-surface-2)_50%,var(--color-surface)_100%)] bg-size-[200%_100%]",
        className,
      )}
    />
  );
}

/* ─── Stat ─────────────────────────────────────────────────────── */
export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-xs text-fg-3">{label}</div>
      <div className="mt-1 truncate font-mono text-[15px] text-fg tabular">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-fg-3">{hint}</div>}
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────── */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-xl">
        {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
        <h2 className="text-xl font-medium tracking-[-0.015em] text-fg sm:text-2xl">{title}</h2>
        {description && <p className="mt-2 text-sm text-fg-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Empty / error ───────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {icon && (
        <div className="mb-4 grid size-10 place-items-center rounded-md border border-line-2 bg-surface text-fg-2 [&_svg]:size-4.5">
          {icon}
        </div>
      )}
      <div className="text-sm font-medium text-fg">{title}</div>
      {description && <div className="mt-1 max-w-sm text-[13px] text-fg-2">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded-xs border border-line-2 bg-surface px-1.5 font-mono text-2xs text-fg-3">
      {children}
    </kbd>
  );
}

/* ─── Key-value row ───────────────────────────────────────────── */
export function Row({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-1.5 text-[13px]", className)}>
      <span className="text-fg-2">{label}</span>
      <span className="text-right font-mono text-fg tabular">{value}</span>
    </div>
  );
}
