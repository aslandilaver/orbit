import { AlertTriangle, CircleCheck, Info, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { SourceBadge } from "@/components/ui/data-source";
import { meteoraGraduationAdapter } from "@/lib/adapters";
import { progress } from "@/lib/curve";
import type { DataSource, GraduationEvent, Token, Tokenomics } from "@/lib/data/types";
import type { RiskFlag } from "@/lib/risk";
import { cn, fmt } from "@/lib/utils";
import { GraduationTrack } from "./token-bits";

export function RiskPanel({ flags, source }: { flags: RiskFlag[]; source?: DataSource }) {
  const high = flags.filter((f) => f.level === "high").length;
  return (
    <Panel>
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-fg-2" />
            Risk checks
          </span>
        }
        action={source && <SourceBadge source={source} />}
      />
      <div className="p-4">
        {flags.length === 0 ? (
          <div className="flex gap-2.5 text-[13px] text-fg-2">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-fg-3" />
            No known risk patterns detected by ORBIT&apos;s automated checks.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {flags.map((f) => (
              <li key={f.id} className="flex gap-2.5">
                {f.level === "high" ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-down" />
                ) : f.level === "medium" ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
                ) : (
                  <Info className="mt-0.5 size-4 shrink-0 text-fg-3" />
                )}
                <div>
                  <div className={cn("text-[13px] font-medium", f.level === "high" ? "text-down" : "text-fg")}>{f.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-fg-2">{f.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-fg-3">
          {high > 0 ? "High-risk properties found. " : ""}
          Automated checks catch known patterns only. Appearing on ORBIT does not mean a token is safe, audited or
          endorsed. <Link href="/docs#risk" className="text-fg-2 underline-offset-2 hover:underline">Read the risk disclosure</Link>.
        </p>
      </div>
    </Panel>
  );
}

export function GraduationPanel({ token, history }: { token: Token; history: GraduationEvent[] }) {
  const p = progress(token.curve);
  const remaining = Math.max(0, token.curve.targetSol - token.curve.raisedSol);
  const adapter = meteoraGraduationAdapter.availability();
  return (
    <Panel>
      <PanelHeader
        title="Graduation"
        description="Curve completes at the threshold set when the token launched."
        action={token.isDemo && <SourceBadge source="demo" />}
      />
      <div className="p-4">
        <GraduationTrack status={token.status} />
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-fg-3">Progress</dt>
            <dd className="mt-1 font-mono text-[15px] text-fg tabular">{(p * 100).toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-3">Raised</dt>
            <dd className="mt-1 font-mono text-[15px] text-fg tabular">{fmt.sol(token.curve.raisedSol, 2)}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-3">Target</dt>
            <dd className="mt-1 font-mono text-[15px] text-fg tabular">{fmt.sol(token.curve.targetSol, 2)}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-3">Remaining</dt>
            <dd className="mt-1 font-mono text-[15px] text-fg tabular">{fmt.sol(remaining, 2)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-line pt-4">
          <div className="mb-3 text-xs text-fg-3">History</div>
          <ol className="relative flex flex-col gap-3.5 border-l border-line-2 pl-4">
            {history.map((e) => (
              <li key={e.label} className="relative">
                <span
                  className={cn(
                    "absolute top-1.5 -left-[20.5px] size-2 rounded-full ring-4 ring-bg-2",
                    e.reached ? "bg-accent" : "bg-surface-3",
                  )}
                />
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn("text-[13px]", e.reached ? "text-fg" : "text-fg-3")}>{e.label}</span>
                  <span className="font-mono text-xs text-fg-3">
                    {e.reached && e.ageMinutes !== null ? `${fmt.age(e.ageMinutes)} ago` : "Pending"}
                  </span>
                </div>
                <div className="text-xs text-fg-3">{e.detail}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-5 flex gap-2 rounded-md border border-line bg-bg p-3 text-xs leading-relaxed text-fg-2">
          <Info className="mt-px size-3.5 shrink-0 text-fg-3" />
          <span>
            {token.status === "graduated"
              ? "In this demo, graduated tokens are modeled as trading in an external pool. "
              : "When the target is reached the curve closes to new buys. "}
            Liquidity migration is performed by the Meteora adapter, which is{" "}
            {adapter.available ? "configured" : "not configured on this deployment"}.{" "}
            <Link href="/docs#graduation" className="text-fg underline-offset-2 hover:underline">
              How graduation works
            </Link>
          </span>
        </div>
      </div>
    </Panel>
  );
}

const TOKENOMICS_ROWS: { key: keyof Tokenomics; label: string; color: string; note: string }[] = [
  { key: "curve", label: "Bonding curve", color: "bg-accent", note: "Sold to the public along the curve" },
  { key: "creator", label: "Creator", color: "bg-warn", note: "Held by the creator wallet" },
  { key: "community", label: "Community", color: "bg-up", note: "Rewards, grants and contributors" },
  { key: "treasury", label: "Treasury", color: "bg-[#8aa4c8]", note: "Project operations" },
];

export function TokenomicsBreakdown({
  tokenomics,
  supply,
  className,
}: {
  tokenomics: Tokenomics;
  supply: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden>
        {TOKENOMICS_ROWS.map((r) =>
          tokenomics[r.key] > 0 ? (
            <div
              key={r.key}
              className={cn(r.color, "border-r border-bg-2 transition-[width] duration-300 last:border-0")}
              style={{ width: `${tokenomics[r.key]}%` }}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-4 flex flex-col gap-2.5">
        {TOKENOMICS_ROWS.map((r) => (
          <li key={r.key} className="flex items-center gap-3 text-[13px]">
            <span className={cn("size-2 shrink-0 rounded-full", r.color)} />
            <span className="min-w-0 flex-1">
              <span className="text-fg">{r.label}</span>
              <span className="ml-2 hidden text-xs text-fg-3 sm:inline">{r.note}</span>
            </span>
            <span className="font-mono text-xs text-fg-3 tabular">{fmt.compact((supply * tokenomics[r.key]) / 100)}</span>
            <span className="w-12 text-right font-mono text-fg tabular">{tokenomics[r.key].toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
