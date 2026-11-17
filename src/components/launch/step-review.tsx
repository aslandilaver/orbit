"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AlertTriangle, Check, CircleDashed, Pencil, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { TokenAvatar } from "@/components/token/token-bits";
import { TokenomicsBreakdown } from "@/components/token/panels";
import { Row, Skeleton } from "@/components/ui/primitives";
import { CLUSTER, CLUSTER_LABEL } from "@/config/public-env";
import { launchAdapters } from "@/lib/adapters";
import type { CostEstimate } from "@/lib/adapters/types";
import { CURVE_PRESETS } from "@/lib/curve";
import { assertLaunchParams } from "@/lib/launch/schema";
import { useSolBalance } from "@/lib/solana/hooks";
import { cn, fmt } from "@/lib/utils";
import { initialBuyPreview, toParams, type LaunchFormApi } from "./use-launch-form";

function Section({ title, onEdit, children }: { title: string; onEdit?: () => void; children: ReactNode }) {
  return (
    <section className="rounded-md border border-line bg-bg">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h3 className="text-[13px] font-medium text-fg">{title}</h3>
        {onEdit && (
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-xs text-fg-2 hover:text-fg">
            <Pencil className="size-3" /> Edit
          </button>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

export function useCostEstimate(api: LaunchFormApi) {
  const { connection } = useConnection();
  const [state, setState] = useState<{ loading: boolean; data: CostEstimate | null; error: string | null }>({
    loading: true,
    data: null,
    error: null,
  });
  const json = JSON.stringify(toParams(api.form));

  useEffect(() => {
    let cancelled = false;
    let params;
    try {
      params = assertLaunchParams(JSON.parse(json));
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guards an async RPC estimate
      setState({ loading: false, data: null, error: "Complete the previous steps to estimate costs." });
      return;
    }
    const adapter = launchAdapters[params.launchType];
    setState((s) => ({ ...s, loading: true }));
    adapter
      .estimateCost(connection, params)
      .then((data) => !cancelled && setState({ loading: false, data, error: null }))
      .catch(() => !cancelled && setState({ loading: false, data: null, error: "Could not estimate costs." }));
    return () => {
      cancelled = true;
    };
  }, [json, connection]);

  return state;
}

export function StepReview({ api, goTo }: { api: LaunchFormApi; goTo: (step: number) => void }) {
  const { form, logo } = api;
  const { connected } = useWallet();
  const { state: balance } = useSolBalance();
  const cost = useCostEstimate(api);
  const isCurve = form.config.launchType === "curve";
  const adapter = launchAdapters[form.config.launchType];
  const avail = adapter.availability();
  const preview = initialBuyPreview(form);
  const initialBuy = isCurve ? Number(form.economics.initialBuySol || 0) : 0;
  const total = (cost.data?.totalSol ?? 0) + initialBuy;
  const creatorPct = Number(form.economics.creator);
  const supply = Number(form.economics.totalSupply);

  const checks: { ok: boolean | null; label: string; detail?: string }[] = [
    { ok: connected ? true : null, label: "Wallet connected", detail: connected ? undefined : "Connect in the final step" },
    { ok: true, label: `Network: Solana ${CLUSTER_LABEL[CLUSTER]}`, detail: "Your wallet must be on the same network" },
    {
      ok: !connected ? null : balance.status === "success" ? balance.data >= total : null,
      label: `Balance covers ${fmt.sol(total, 4)}`,
      detail:
        connected && balance.status === "success"
          ? `Wallet holds ${fmt.sol(balance.data, 4)}`
          : connected
            ? "Checking balance…"
            : "Checked after connecting",
    },
    { ok: avail.available, label: `${adapter.label} adapter available`, detail: avail.reason },
  ];

  const warnings = [
    !logo && "No logo. Wallets will show a placeholder.",
    creatorPct > 10 && `Creator allocation of ${creatorPct}% will be flagged as a risk on your token page.`,
    !form.details.website && !form.details.x && !form.details.telegram && !form.details.discord && "No project links. Holders will see a risk note.",
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-4">
      <Section title="Token" onEdit={() => goTo(0)}>
        <div className="flex items-start gap-3.5">
          <TokenAvatar name={form.details.name} ticker={form.details.ticker || "?"} hue={150} src={logo?.url} size={48} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-fg">{form.details.name}</span>
              <span className="font-mono text-xs text-fg-2">${form.details.ticker}</span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-2">{form.details.description}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-3">
              {(["website", "x", "telegram", "discord"] as const)
                .filter((k) => form.details[k])
                .map((k) => (
                  <span key={k} className="max-w-[220px] truncate">
                    {form.details[k].replace(/^https:\/\//, "")}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Tokenomics" onEdit={() => goTo(1)}>
          <Row label="Total supply" value={fmt.int(supply)} />
          <Row label="Decimals" value="6" />
          <TokenomicsBreakdown
            className="mt-3"
            supply={supply}
            tokenomics={{
              curve: Number(form.economics.curve),
              creator: creatorPct,
              community: Number(form.economics.community),
              treasury: Number(form.economics.treasury),
            }}
          />
        </Section>

        <Section title="Configuration" onEdit={() => goTo(2)}>
          <Row label="Launch type" value={<span className="font-sans">{adapter.label}</span>} />
          {isCurve && (
            <>
              <Row label="Curve" value={<span className="font-sans">{CURVE_PRESETS[form.config.curvePreset].label}</span>} />
              <Row label="Graduation threshold" value={fmt.sol(Number(form.config.graduationTargetSol), 2)} />
              <Row
                label="Liquidity destination"
                value={<span className="font-sans">{form.config.liquidityDestination === "meteora-dlmm" ? "Meteora DLMM" : "Meteora DAMM v2"}</span>}
              />
              <Row
                label="Initial buy"
                value={initialBuy > 0 ? `${fmt.sol(initialBuy)} → ${preview ? fmt.compact(preview.tokens) : "—"}` : "None"}
              />
            </>
          )}
          <Row label="Mint authority" value={<span className="font-sans text-up">Revoked at launch</span>} />
          <Row label="Freeze authority" value={<span className="font-sans text-up">None</span>} />
          <Row label="Creator wallet" value={fmt.address(form.config.creatorWallet, 5)} />
        </Section>
      </div>

      <Section title="Fees and estimated cost">
        {cost.loading ? (
          <div className="flex flex-col gap-2 py-1" aria-busy>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : cost.error ? (
          <p className="text-[13px] text-fg-2">{cost.error}</p>
        ) : cost.data && cost.data.lines.length > 0 ? (
          <>
            {cost.data.lines.map((l) => (
              <Row
                key={l.label}
                label={
                  <span>
                    {l.label}
                    {l.note && <span className="ml-2 text-xs text-fg-3">{l.note}</span>}
                  </span>
                }
                value={fmt.sol(l.sol, 6)}
              />
            ))}
            {initialBuy > 0 && <Row label="Initial buy" value={fmt.sol(initialBuy, 6)} />}
            <div className="mt-1 border-t border-line pt-1">
              <Row label={<span className="font-medium text-fg">Estimated total</span>} value={<span className="text-accent">{fmt.sol(total, 6)}</span>} />
            </div>
            <p className="mt-1 text-xs text-fg-3">
              {cost.data.basis === "chain"
                ? "Rent read from the RPC node. Your wallet shows the final amount before you approve."
                : "RPC unavailable — rent estimated offline. Your wallet shows the final amount before you approve."}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-fg-2">
            Costs for {adapter.label.toLowerCase()} launches depend on the Meteora pool config, which is not configured.
            No estimate is shown rather than a guess.
          </p>
        )}
      </Section>

      <Section title="Wallet requirements">
        <ul className="flex flex-col gap-2.5">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2.5 text-[13px]">
              <span
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                  c.ok === true ? "bg-up-dim text-up" : c.ok === false ? "bg-down-dim text-down" : "text-fg-3",
                )}
              >
                {c.ok === true ? <Check className="size-3" /> : c.ok === false ? <X className="size-3" /> : <CircleDashed className="size-3.5" />}
              </span>
              <div>
                <div className="text-fg">{c.label}</div>
                {c.detail && <div className="text-xs text-fg-3">{c.detail}</div>}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {warnings.length > 0 && (
        <div className="rounded-md border border-warn/25 bg-warn-dim p-3.5">
          <ul className="flex flex-col gap-1.5 text-xs text-warn">
            {warnings.map((w) => (
              <li key={w} className="flex gap-2">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
