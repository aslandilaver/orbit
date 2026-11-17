import Link from "next/link";
import { CATEGORY_LABEL, type Token } from "@/lib/data/types";
import { progress } from "@/lib/curve";
import { fmt } from "@/lib/utils";
import { Change, CurveProgress, StatusBadge, TokenAvatar } from "./token-bits";

export function TokenCard({ token }: { token: Token }) {
  const p = progress(token.curve);
  return (
    <Link
      href={`/token/${token.address}`}
      className="group flex flex-col rounded-lg border border-line bg-bg-2 p-4 transition-colors hover:border-line-3 hover:bg-surface"
    >
      <div className="flex items-start gap-3">
        <TokenAvatar name={token.name} ticker={token.ticker} hue={token.hue} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-fg">{token.name}</span>
            <Change value={token.change24h} className="text-xs" />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-3">
            <span className="font-mono">${token.ticker}</span>
            <span aria-hidden>·</span>
            <span>{CATEGORY_LABEL[token.category]}</span>
            <span aria-hidden>·</span>
            <span>{fmt.age(token.ageMinutes)}</span>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-fg-3">Market cap</dt>
          <dd className="mt-0.5 font-mono text-[13px] text-fg tabular">{fmt.usdCompact(token.marketCapUsd)}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg-3">24h volume</dt>
          <dd className="mt-0.5 font-mono text-[13px] text-fg tabular">{fmt.usdCompact(token.volume24hUsd)}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-line pt-3.5">
        <div className="mb-2 flex items-center justify-between">
          <StatusBadge status={token.status} />
          <span className="font-mono text-2xs text-fg-3 tabular">
            {token.curve.raisedSol.toFixed(1)} / {token.curve.targetSol} SOL
          </span>
        </div>
        <CurveProgress value={p} graduated={token.status === "graduated"} />
      </div>
    </Link>
  );
}
