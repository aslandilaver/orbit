import { Database, FlaskConical } from "lucide-react";
import type { DataSource } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * Every data-driven surface shows where its numbers come from. Demo data is
 * never presented unlabeled.
 */
export function SourceBadge({ source, className }: { source: DataSource; className?: string }) {
  if (source === "demo") {
    return (
      <span
        title="Sample data bundled with the app. Not live market data."
        className={cn(
          "inline-flex h-5 items-center gap-1 rounded-xs border border-warn/20 bg-warn-dim px-1.5 font-mono text-[10px] tracking-wide text-warn uppercase",
          className,
        )}
      >
        <FlaskConical className="size-3" aria-hidden />
        Demo data
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-xs border border-line-2 bg-surface px-1.5 font-mono text-[10px] tracking-wide text-fg-2 uppercase",
        className,
      )}
    >
      <Database className="size-3" aria-hidden />
      {source === "chain" ? "On-chain" : "Indexed"}
    </span>
  );
}
