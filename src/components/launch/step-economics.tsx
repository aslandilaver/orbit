"use client";

import { AlertTriangle, Check, Wand2 } from "lucide-react";
import { TokenomicsBreakdown } from "@/components/token/panels";
import { Button } from "@/components/ui/button";
import { AffixInput, Field } from "@/components/ui/form";
import { cn, fmt } from "@/lib/utils";
import { initialBuyPreview, toEconomics, type LaunchFormApi } from "./use-launch-form";

const SUPPLY_PRESETS = [
  { label: "100M", value: "100000000" },
  { label: "1B", value: "1000000000" },
  { label: "10B", value: "10000000000" },
];

const ALLOCATIONS = [
  { key: "curve", label: "Initial liquidity", hint: "Sold through the bonding curve. Minimum 50%.", color: "bg-accent", max: 100 },
  { key: "creator", label: "Creator", hint: "ORBIT guideline: 10% or less. Hard cap 20%.", color: "bg-warn", max: 20 },
  { key: "community", label: "Community", hint: "Rewards, grants, contributors.", color: "bg-up", max: 50 },
  { key: "treasury", label: "Treasury", hint: "Project operations.", color: "bg-[#8aa4c8]", max: 50 },
] as const;

export function StepEconomics({ api, errors }: { api: LaunchFormApi; errors: Record<string, string> }) {
  const e = api.form.economics;
  const set = (patch: Partial<typeof e>) => api.update("economics", patch);
  const n = toEconomics(e);
  const parts = [n.curve, n.creator, n.community, n.treasury].map((v) => (Number.isFinite(v) ? v : 0));
  const sum = Math.round(parts.reduce((a, b) => a + b, 0) * 100) / 100;
  const balanced = Math.abs(sum - 100) < 0.001;
  const preview = initialBuyPreview(api.form);
  const supply = Number.isFinite(n.totalSupply) ? n.totalSupply : 0;

  function autoBalance() {
    const others = parts[1]! + parts[2]! + parts[3]!;
    set({ curve: String(Math.max(0, Math.round((100 - others) * 100) / 100)) });
  }

  return (
    <div className="flex flex-col gap-8">
      <Field
        label="Total supply"
        htmlFor="supply"
        error={errors.totalSupply}
        hint="Fixed at launch. Mint authority is revoked, so supply can never increase."
        aside={
          <div className="flex gap-1">
            {SUPPLY_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set({ totalSupply: p.value })}
                className={cn(
                  "h-6 rounded-xs border px-2 font-mono text-2xs transition-colors",
                  e.totalSupply === p.value ? "border-line-3 bg-surface-3 text-fg" : "border-line-2 text-fg-3 hover:text-fg",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      >
        <AffixInput
          id="supply"
          inputMode="numeric"
          suffix="tokens"
          value={e.totalSupply}
          aria-invalid={Boolean(errors.totalSupply) || undefined}
          onChange={(ev) => set({ totalSupply: ev.target.value.replace(/[^0-9]/g, "").slice(0, 13) })}
        />
      </Field>

      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium text-fg">Allocation</div>
            <p className="mt-0.5 text-xs text-fg-3">Percentages of total supply. Must add up to exactly 100%.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={autoBalance} disabled={balanced}>
            <Wand2 />
            Balance into liquidity
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-line">
          {ALLOCATIONS.map((a) => {
            const v = e[a.key];
            const numV = Number(v);
            return (
              <div key={a.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line bg-bg px-4 py-3 last:border-0 sm:grid-cols-[180px_1fr_110px]">
                <div className="flex items-center gap-2.5">
                  <span className={cn("size-2 rounded-full", a.color)} />
                  <div>
                    <label htmlFor={`alloc-${a.key}`} className="text-[13px] text-fg">
                      {a.label}
                    </label>
                    <div className="text-2xs text-fg-3 sm:hidden">{a.hint}</div>
                  </div>
                </div>
                <div className="order-3 col-span-2 sm:order-none sm:col-span-1">
                  <input
                    type="range"
                    min={0}
                    max={a.max}
                    step={0.5}
                    value={Number.isFinite(numV) ? numV : 0}
                    onChange={(ev) => set({ [a.key]: ev.target.value })}
                    aria-label={`${a.label} slider`}
                    className="w-full accent-[var(--color-accent)]"
                  />
                  <div className="hidden text-2xs text-fg-3 sm:block">{a.hint}</div>
                </div>
                <AffixInput
                  id={`alloc-${a.key}`}
                  inputMode="decimal"
                  suffix="%"
                  value={v}
                  className="w-24 sm:w-auto"
                  aria-invalid={Boolean(errors[a.key]) || undefined}
                  onChange={(ev) => set({ [a.key]: ev.target.value.replace(/[^0-9.]/g, "").slice(0, 6) })}
                />
              </div>
            );
          })}
        </div>

        <div
          className={cn(
            "mt-3 flex items-center justify-between rounded-md border px-4 py-2.5 text-[13px]",
            balanced ? "border-line bg-bg-2" : "border-down/30 bg-down-dim",
          )}
          role="status"
        >
          <span className={cn("flex items-center gap-2", balanced ? "text-fg-2" : "text-down")}>
            {balanced ? <Check className="size-4 text-up" /> : <AlertTriangle className="size-4" />}
            {balanced ? "Allocations balanced" : sum > 100 ? `Over by ${fmt.num(sum - 100)}%` : `${fmt.num(100 - sum)}% unallocated`}
          </span>
          <span className="font-mono tabular">{fmt.num(sum)}%</span>
        </div>
        {Object.entries(errors)
          .filter(([k]) => ["curve", "creator", "community", "treasury"].includes(k) || (k === "allocations" && !balanced))
          .map(([k, m]) => (
            <p key={k} className="mt-1.5 text-xs text-down" role="alert">
              {m}
            </p>
          ))}
        {n.creator > 10 && n.creator <= 20 && (
          <p className="mt-2 flex gap-1.5 text-xs text-warn">
            <AlertTriangle className="mt-px size-3.5 shrink-0" />
            Creator allocation above 10% is flagged on your token page as a risk.
          </p>
        )}

        <div className="mt-6 rounded-md border border-line bg-bg-2 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-fg-3">
            <span>Distribution preview</span>
            <span className="font-mono">{supply ? fmt.compact(supply) : "—"} total</span>
          </div>
          <TokenomicsBreakdown
            supply={supply}
            tokenomics={{ curve: parts[0]!, creator: parts[1]!, community: parts[2]!, treasury: parts[3]! }}
          />
        </div>
      </div>

      <Field
        label="Initial buy"
        htmlFor="initial-buy"
        optional
        error={errors.initialBuySol}
        hint={
          preview
            ? `≈ ${fmt.compact(preview.tokens)} tokens (${preview.pctOfSupply.toFixed(2)}% of supply) at the start of the curve, before anyone else can buy.`
            : "SOL you buy on the curve in the same transaction as the launch. Applies to bonding-curve launches."
        }
      >
        <AffixInput
          id="initial-buy"
          inputMode="decimal"
          suffix="SOL"
          value={e.initialBuySol}
          aria-invalid={Boolean(errors.initialBuySol) || undefined}
          onChange={(ev) => set({ initialBuySol: ev.target.value.replace(/[^0-9.]/g, "").slice(0, 8) })}
        />
      </Field>
    </div>
  );
}
