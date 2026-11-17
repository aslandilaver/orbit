"use client";

import { useState } from "react";
import { SourceBadge } from "@/components/ui/data-source";
import { Tabs } from "@/components/ui/segmented";
import type { DataSource, Holder, Token, Trade } from "@/lib/data/types";
import { cn, fmt } from "@/lib/utils";

const HOLDER_COLOR: Record<Holder["kind"], string> = {
  curve: "bg-accent",
  creator: "bg-warn",
  treasury: "bg-[#8aa4c8]",
  community: "bg-up",
  holder: "bg-fg-3",
};

export function TokenActivity({
  token,
  trades,
  holders,
  source,
}: {
  token: Token;
  trades: Trade[];
  holders: Holder[];
  source: DataSource;
}) {
  const [tab, setTab] = useState<"trades" | "holders">("trades");

  return (
    <div className="rounded-lg border border-line bg-bg-2">
      <div className="flex items-center justify-between gap-3 px-4">
        <Tabs
          label="Token activity"
          idPrefix="activity"
          value={tab}
          onChange={setTab}
          className="border-0"
          items={[
            { value: "trades", label: "Trade history", count: trades.length },
            { value: "holders", label: "Holders", count: token.holders },
          ]}
        />
        <SourceBadge source={source} />
      </div>
      <div className="border-t border-line" role="tabpanel" aria-labelledby={`activity-${tab}`}>
        {tab === "trades" ? (
          <div className="max-h-[440px] overflow-auto">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead className="sticky top-0 bg-bg-2">
                <tr className="border-b border-line text-left text-xs text-fg-3">
                  <th scope="col" className="py-2 pl-4 font-normal">
                    Type
                  </th>
                  <th scope="col" className="py-2 pl-4 text-right font-normal">
                    SOL
                  </th>
                  <th scope="col" className="py-2 pl-4 text-right font-normal">
                    {token.ticker}
                  </th>
                  <th scope="col" className="py-2 pl-4 font-normal">
                    Wallet
                  </th>
                  <th scope="col" className="py-2 pr-4 pl-4 text-right font-normal">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0">
                    <td className={cn("py-2 pl-4 font-medium", t.side === "buy" ? "text-up" : "text-down")}>
                      {t.side === "buy" ? "Buy" : "Sell"}
                    </td>
                    <td className="py-2 pl-4 text-right font-mono text-fg tabular">{t.sol.toFixed(3)}</td>
                    <td className="py-2 pl-4 text-right font-mono text-fg-2 tabular">{fmt.compact(t.tokens)}</td>
                    <td className="py-2 pl-4 font-mono text-xs text-fg-2">{fmt.address(t.wallet)}</td>
                    <td className="py-2 pr-4 pl-4 text-right font-mono text-xs text-fg-3">{fmt.age(t.ageMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            {/* Distribution bar */}
            <div className="flex h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden>
              {holders.map((h, i) => (
                <div key={i} className={cn(HOLDER_COLOR[h.kind], "border-r border-bg-2 last:border-0")} style={{ width: `${h.pct}%` }} />
              ))}
            </div>
            <ul className="mt-4 divide-y divide-line">
              {holders.map((h, i) => (
                <li key={i} className="flex items-center gap-3 py-2 text-[13px]">
                  <span className="w-5 font-mono text-xs text-fg-3 tabular">{i + 1}</span>
                  <span className={cn("size-2 shrink-0 rounded-full", HOLDER_COLOR[h.kind])} />
                  <span className="min-w-0 flex-1 truncate text-fg-2">
                    {h.kind === "holder" ? (
                      <span className="font-mono text-xs">{fmt.address(h.wallet, 5)}</span>
                    ) : (
                      <span className="text-fg">{h.label}</span>
                    )}
                  </span>
                  <span className="w-24 text-right">
                    <span className="inline-block h-1 w-16 overflow-hidden rounded-full bg-surface-3 align-middle">
                      <span className="block h-full bg-fg-3" style={{ width: `${Math.min(100, h.pct * 2)}%` }} />
                    </span>
                  </span>
                  <span className="w-14 text-right font-mono text-fg tabular">{h.pct.toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
