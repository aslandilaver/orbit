import { ArrowDownRight, ArrowUpRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { STATUS_LABEL, type TokenStatus } from "@/lib/data/types";
import { cn, fmt } from "@/lib/utils";

export function TokenAvatar({
  name,
  ticker,
  hue,
  src,
  size = 36,
  className,
}: {
  name: string;
  ticker: string;
  hue: number;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`${name} logo`} style={style} className={cn("shrink-0 rounded-md object-cover", className)} />;
  }
  // Generated monogram: deterministic from the token's hue. Muted, never neon.
  return (
    <div
      role="img"
      aria-label={`${name} logo`}
      style={{
        ...style,
        background: `linear-gradient(140deg, hsl(${hue} 22% 22%), hsl(${hue} 18% 13%))`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 25% 30% / 0.6)`,
        fontSize: Math.round(size * 0.36),
      }}
      className={cn("grid shrink-0 place-items-center rounded-md font-semibold text-fg/90", className)}
    >
      <span style={{ color: `hsl(${hue} 45% 78%)` }}>{ticker.slice(0, 2)}</span>
    </div>
  );
}

export function Change({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("relative inline-flex items-center gap-0.5 font-mono tabular", up ? "text-up" : "text-down", className)}>
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(value).toFixed(1)}%<span className="sr-only">{up ? " increase" : " decrease"}</span>
    </span>
  );
}

export function CurveProgress({
  value,
  graduated,
  showLabel = true,
  className,
}: {
  /** 0..1 */
  value: number;
  graduated?: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10;
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Bonding curve progress"
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out",
            graduated ? "bg-accent" : pct >= 80 ? "bg-accent/80" : "bg-fg-2",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-11 text-right font-mono text-xs text-fg-2 tabular">
          {graduated ? <Check className="ml-auto size-3.5 text-accent" aria-label="Complete" /> : `${pct.toFixed(0)}%`}
        </span>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: TokenStatus }) {
  const tone = status === "graduated" ? "accent" : status === "graduating" ? "up" : "neutral";
  return (
    <Badge tone={tone}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "graduated" ? "bg-accent" : status === "graduating" ? "bg-up" : status === "new" ? "bg-fg" : "bg-fg-3",
        )}
      />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const STAGES: { id: TokenStatus; label: string }[] = [
  { id: "new", label: "New launch" },
  { id: "bonding", label: "Bonding curve" },
  { id: "graduating", label: "Graduation ready" },
  { id: "graduated", label: "Graduated" },
];

/** New Launch → Bonding Curve → Graduation Ready → Graduated */
export function GraduationTrack({ status, className }: { status: TokenStatus; className?: string }) {
  const current = STAGES.findIndex((s) => s.id === status);
  return (
    <ol className={cn("grid grid-cols-4 gap-1.5", className)} aria-label="Graduation stage">
      {STAGES.map((s, i) => {
        const done = i < current || status === "graduated";
        const active = i === current;
        return (
          <li key={s.id} aria-current={active ? "step" : undefined} className="min-w-0">
            <div
              className={cn(
                "h-1 rounded-full",
                done ? "bg-accent" : active ? "bg-accent/50" : "bg-surface-3",
              )}
            />
            <div className={cn("mt-2 truncate text-2xs sm:text-xs", active ? "text-fg" : done ? "text-fg-2" : "text-fg-3")}>
              {s.label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function fmtTokens(n: number) {
  return fmt.compact(n);
}
