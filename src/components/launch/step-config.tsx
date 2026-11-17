"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/primitives";
import { AffixInput, Field, Input } from "@/components/ui/form";
import { launchAdapters } from "@/lib/adapters";
import { CURVE_PRESETS, sampleCurve, spotPrice, type CurvePresetId } from "@/lib/curve";
import { DEMO_PARAMS } from "@/lib/data/demo";
import { cn, fmt } from "@/lib/utils";
import { initialBuyPreview, toEconomics, type LaunchFormApi } from "./use-launch-form";

function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  aside,
  children,
  disabled,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col rounded-md border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40",
        checked ? "border-accent/50 bg-accent-dim/40" : "border-line-2 bg-bg hover:border-line-3",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-4 shrink-0 place-items-center rounded-full border",
              checked ? "border-accent" : "border-line-3",
            )}
          >
            {checked && <span className="size-2 rounded-full bg-accent" />}
          </span>
          <span className="text-[13px] font-medium text-fg">{title}</span>
        </div>
        {aside}
      </div>
      <p className="mt-2 pl-6.5 text-xs leading-relaxed text-fg-2">{description}</p>
      {children && <div className="mt-3 pl-6.5">{children}</div>}
    </label>
  );
}

function CurveSpark({ preset, target }: { preset: CurvePresetId; target: number }) {
  const pts = sampleCurve(
    { virtualSol: CURVE_PRESETS[preset].virtualSol, curveTokens: 8e8, totalSupply: 1e9, targetSol: target, feeBps: 0 },
    32,
  );
  const max = Math.max(...pts.map((p) => p.price));
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * 100} ${30 - (p.price / max) * 28}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke="var(--color-fg-2)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StepConfig({ api, errors }: { api: LaunchFormApi; errors: Record<string, string> }) {
  const { publicKey } = useWallet();
  const c = api.form.config;
  const set = (patch: Partial<typeof c>) => api.update("config", patch);
  const target = Number(c.graduationTargetSol);
  const e = toEconomics(api.form.economics);
  const curveDisabled = c.launchType === "fixed";
  const curveAvail = launchAdapters.curve.availability();
  const fixedAvail = launchAdapters.fixed.availability();
  const preview = initialBuyPreview(api.form);

  // Price at the start and end of the curve, for the explanation panel.
  const economicsValid = e.totalSupply > 0 && e.curve > 0 && target >= 20;
  const cfg = economicsValid
    ? {
        virtualSol: CURVE_PRESETS[c.curvePreset].virtualSol,
        curveTokens: (e.totalSupply * e.curve) / 100,
        totalSupply: e.totalSupply,
        targetSol: target,
        feeBps: 100,
      }
    : null;
  const startMc = cfg ? spotPrice({ ...cfg, raisedSol: 0 }) * e.totalSupply : 0;
  const endMc = cfg ? spotPrice({ ...cfg, raisedSol: target }) * e.totalSupply : 0;

  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="text-[13px] font-medium text-fg">Launch type</legend>
        <p className="mt-0.5 text-xs text-fg-3">How the token reaches its first holders.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <OptionCard
            name="launchType"
            value="curve"
            checked={c.launchType === "curve"}
            onChange={() => set({ launchType: "curve" })}
            title="Bonding curve"
            description="Fair launch: anyone buys along a published price curve until the graduation threshold, then liquidity migrates to a pool."
            aside={!curveAvail.available && <Badge tone="warn">Not configured</Badge>}
          />
          <OptionCard
            name="launchType"
            value="fixed"
            checked={c.launchType === "fixed"}
            onChange={() => set({ launchType: "fixed" })}
            title="Fixed-supply mint"
            description="Creates the token with on-chain name and symbol, mints the full supply to the creator wallet, and revokes mint authority. No curve or pool."
            aside={<Badge tone={fixedAvail.available ? "up" : "warn"}>{fixedAvail.available ? "Available" : "Unavailable"}</Badge>}
          />
        </div>
      </fieldset>

      <fieldset disabled={curveDisabled} className={cn("transition-opacity", curveDisabled && "opacity-60")}>
        <div className="flex items-baseline justify-between gap-3">
          <legend className="text-[13px] font-medium text-fg">Bonding curve</legend>
          {curveDisabled && <span className="text-xs text-fg-3">Not used by a fixed-supply mint</span>}
        </div>
        <p className="mt-0.5 text-xs text-fg-3">
          The curve shape sets how fast the price rises as SOL comes in. Pricing follows a constant-product formula with a
          virtual SOL reserve.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(Object.keys(CURVE_PRESETS) as CurvePresetId[]).map((id) => (
            <OptionCard
              key={id}
              name="curvePreset"
              value={id}
              checked={c.curvePreset === id}
              onChange={() => set({ curvePreset: id })}
              title={CURVE_PRESETS[id].label}
              description={CURVE_PRESETS[id].description}
              disabled={curveDisabled}
            >
              <CurveSpark preset={id} target={target >= 20 ? target : 85} />
            </OptionCard>
          ))}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label="Graduation threshold"
            htmlFor="target"
            error={errors.graduationTargetSol}
            hint="SOL raised on the curve before it closes and liquidity can migrate. Published on your token page."
          >
            <AffixInput
              id="target"
              inputMode="decimal"
              suffix="SOL"
              value={c.graduationTargetSol}
              aria-invalid={Boolean(errors.graduationTargetSol) || undefined}
              onChange={(ev) => set({ graduationTargetSol: ev.target.value.replace(/[^0-9.]/g, "").slice(0, 6) })}
            />
          </Field>

          <div className="rounded-md border border-line bg-bg p-3.5 text-xs">
            <div className="text-fg-3">With these settings</div>
            <dl className="mt-2 grid grid-cols-2 gap-y-1.5">
              <dt className="text-fg-2">Starting market cap</dt>
              <dd className="text-right font-mono text-fg tabular">{cfg ? fmt.sol(startMc, 1) : "—"}</dd>
              <dt className="text-fg-2">At graduation</dt>
              <dd className="text-right font-mono text-fg tabular">{cfg ? fmt.sol(endMc, 1) : "—"}</dd>
              <dt className="text-fg-2">Price multiple</dt>
              <dd className="text-right font-mono text-fg tabular">{cfg ? `${(endMc / startMc).toFixed(1)}×` : "—"}</dd>
              <dt className="text-fg-2">Initial purchase</dt>
              <dd className="text-right font-mono text-fg tabular">
                {preview ? `${preview.pctOfSupply.toFixed(2)}% of supply` : "None"}
              </dd>
            </dl>
            <p className="mt-2 text-2xs text-fg-3">
              In USD at a ${DEMO_PARAMS.solUsd} reference price: {cfg ? `${fmt.usdCompact(startMc * DEMO_PARAMS.solUsd)} → ${fmt.usdCompact(endMc * DEMO_PARAMS.solUsd)}` : "—"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[13px] font-medium text-fg">Liquidity destination</div>
          <p className="mt-0.5 text-xs text-fg-3">Where curve liquidity migrates at graduation. Performed by the Meteora adapter.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <OptionCard
              name="liq"
              value="meteora-damm-v2"
              checked={c.liquidityDestination === "meteora-damm-v2"}
              onChange={() => set({ liquidityDestination: "meteora-damm-v2" })}
              title="Meteora DAMM v2"
              description="Constant-product pool. Simple, deep liquidity across the full price range."
              disabled={curveDisabled}
            />
            <OptionCard
              name="liq"
              value="meteora-dlmm"
              checked={c.liquidityDestination === "meteora-dlmm"}
              onChange={() => set({ liquidityDestination: "meteora-dlmm" })}
              title="Meteora DLMM"
              description="Concentrated, bin-based liquidity. More capital efficient, needs active management."
              disabled={curveDisabled}
            />
          </div>
        </div>
      </fieldset>

      <Field
        label="Creator wallet"
        htmlFor="creator-wallet"
        error={errors.creatorWallet}
        hint={
          c.launchType === "fixed"
            ? "Receives the entire supply. The connected wallet pays fees and becomes the metadata update authority."
            : "Receives the creator allocation and any creator fees."
        }
        aside={
          publicKey && c.creatorWallet !== publicKey.toBase58() ? (
            <button type="button" onClick={() => set({ creatorWallet: publicKey.toBase58() })} className="text-xs text-accent hover:underline">
              Use connected wallet
            </button>
          ) : null
        }
      >
        <Input
          id="creator-wallet"
          placeholder={publicKey ? publicKey.toBase58() : "Connect a wallet or paste an address"}
          value={c.creatorWallet}
          className="font-mono text-[13px]"
          spellCheck={false}
          autoComplete="off"
          aria-invalid={Boolean(errors.creatorWallet) || undefined}
          onChange={(ev) => set({ creatorWallet: ev.target.value.trim() })}
        />
      </Field>

      {c.launchType === "fixed" && (
        <div className="flex gap-2.5 rounded-md border border-line bg-bg-2 p-3.5 text-xs leading-relaxed text-fg-2">
          <Info className="mt-px size-3.5 shrink-0 text-fg-3" />
          <span>
            A fixed-supply mint sends 100% of supply to the creator wallet. Your allocation plan is recorded in the review
            but is not enforced on-chain: distributing to treasury, community and liquidity is up to you. Bonding-curve
            settings above are ignored.
          </span>
        </div>
      )}
    </div>
  );
}
