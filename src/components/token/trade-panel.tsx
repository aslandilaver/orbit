"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { AlertTriangle, Info, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { inputClass } from "@/components/ui/form";
import { Row } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/segmented";
import { useWalletModal } from "@/components/providers/solana-provider";
import { resolveTradeAdapter } from "@/lib/adapters";
import { quoteBuy, quoteCpmm, quoteSell, type Quote } from "@/lib/curve";
import { DEMO_PARAMS } from "@/lib/data/demo";
import type { Token } from "@/lib/data/types";
import { useSolBalance } from "@/lib/solana/hooks";
import { cn, fmt } from "@/lib/utils";

type Side = "buy" | "sell";
const SLIPPAGE_PRESETS = [50, 100, 200];
/** Keep a little SOL back for network fees and rent. */
const FEE_RESERVE_SOL = 0.01;

export function TradePanel({ token }: { token: Token }) {
  const { connected } = useWallet();
  const { setOpen } = useWalletModal();
  const { state: balance } = useSolBalance();
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(100);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [review, setReview] = useState(false);
  const mounted = useMounted();

  const route = resolveTradeAdapter(token);
  const graduated = token.status === "graduated";
  const priceSol = token.priceUsd / DEMO_PARAMS.solUsd;

  // Demo tokens are not on-chain, so a connected wallet holds none of them.
  const tokenBalance = 0;
  const solBalance = balance.status === "success" ? balance.data : null;

  const parsed = Number(amount);
  const quote: Quote | null = useMemo(() => {
    if (!amount || !(parsed > 0)) return null;
    if (graduated) {
      const solReserve = token.liquidityUsd / 2 / DEMO_PARAMS.solUsd;
      return quoteCpmm(
        { solReserve, tokenReserve: solReserve / priceSol, feeBps: 25 },
        side,
        parsed,
        slippageBps,
      );
    }
    return side === "buy" ? quoteBuy(token.curve, parsed, slippageBps) : quoteSell(token.curve, parsed, slippageBps);
  }, [amount, parsed, graduated, token, priceSol, side, slippageBps]);

  // Input validation, in priority order.
  let error: string | null = null;
  if (amount && (!Number.isFinite(parsed) || parsed <= 0)) error = "Enter an amount greater than 0";
  else if (amount && side === "buy" && parsed > 1000) error = "Maximum 1,000 SOL per trade";
  else if (connected && side === "buy" && solBalance !== null && parsed > Math.max(0, solBalance - FEE_RESERVE_SOL))
    error = `Insufficient SOL. Keep ~${FEE_RESERVE_SOL} SOL for fees.`;
  else if (connected && side === "sell" && amount && parsed > tokenBalance) error = `You hold ${fmt.compact(tokenBalance)} ${token.ticker}`;

  const impact = quote?.priceImpact ?? 0;
  const impactTone = impact > 0.15 ? "text-down" : impact > 0.05 ? "text-warn" : "text-fg";
  const quick = side === "buy" ? ["0.1", "0.5", "1", "5"] : ["25", "50", "75", "100"];

  function applyQuick(v: string) {
    if (side === "buy") setAmount(v);
    else setAmount(String((tokenBalance * Number(v)) / 100));
  }

  const customInvalid =
    customSlippage !== "" && (!(Number(customSlippage) >= 0.1) || Number(customSlippage) > 50);

  return (
    <div id="trade" className="scroll-mt-20 rounded-lg border border-line bg-bg-2">
      <div className="flex items-center justify-between border-b border-line p-3">
        <Tabs
          variant="pill"
          label="Trade side"
          idPrefix="side"
          value={side}
          onChange={(s) => {
            setSide(s);
            setAmount("");
          }}
          items={[
            { value: "buy", label: "Buy" },
            { value: "sell", label: "Sell" },
          ]}
        />
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          aria-expanded={showSettings}
          aria-controls="slippage-settings"
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-sm px-2 font-mono text-xs transition-colors hover:bg-surface hover:text-fg",
            showSettings ? "bg-surface text-fg" : "text-fg-2",
          )}
        >
          <Settings2 className="size-3.5" />
          {(slippageBps / 100).toFixed(slippageBps % 100 ? 1 : 0)}%
          <span className="sr-only">slippage settings</span>
        </button>
      </div>

      {showSettings && (
        <div id="slippage-settings" className="border-b border-line p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-fg-2">Max slippage</span>
            <span className="text-fg-3">Trade reverts if price moves more</span>
          </div>
          <div className="flex gap-1.5">
            {SLIPPAGE_PRESETS.map((bps) => (
              <button
                key={bps}
                type="button"
                onClick={() => {
                  setSlippageBps(bps);
                  setCustomSlippage("");
                }}
                className={cn(
                  "h-8 flex-1 rounded-sm border font-mono text-xs transition-colors",
                  slippageBps === bps && !customSlippage
                    ? "border-line-3 bg-surface-3 text-fg"
                    : "border-line-2 text-fg-2 hover:text-fg",
                )}
              >
                {bps / 100}%
              </button>
            ))}
            <div className="relative flex-[1.3]">
              <input
                inputMode="decimal"
                aria-label="Custom slippage percent"
                placeholder="Custom"
                value={customSlippage}
                aria-invalid={customInvalid || undefined}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  setCustomSlippage(v);
                  const n = Number(v);
                  if (n >= 0.1 && n <= 50) setSlippageBps(Math.round(n * 100));
                }}
                className={cn(inputClass, "h-8 pr-6 font-mono text-xs")}
              />
              <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 font-mono text-xs text-fg-3">
                %
              </span>
            </div>
          </div>
          {customInvalid && <p className="mt-1.5 text-xs text-down">Enter between 0.1% and 50%</p>}
          {!customInvalid && slippageBps > 500 && (
            <p className="mt-1.5 text-xs text-warn">High slippage increases the risk of an unfavorable fill.</p>
          )}
        </div>
      )}

      <div className="p-3">
        <div className="rounded-md border border-line-2 bg-bg p-3 focus-within:border-accent/50">
          <div className="flex items-center justify-between text-xs text-fg-3">
            <label htmlFor="trade-amount">{side === "buy" ? "You pay" : "You sell"}</label>
            {mounted && connected && (
              <span className="font-mono tabular">
                Balance:{" "}
                {side === "buy"
                  ? solBalance !== null
                    ? fmt.sol(solBalance)
                    : "—"
                  : `${fmt.compact(tokenBalance)} ${token.ticker}`}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="trade-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "trade-error" : undefined}
              onChange={(e) => {
                const v = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
                if ((v.match(/\./g) ?? []).length <= 1 && v.length <= 18) setAmount(v);
              }}
              className="w-full min-w-0 bg-transparent font-mono text-2xl text-fg outline-none placeholder:text-fg-3 tabular"
            />
            <span className="shrink-0 rounded-sm border border-line-2 bg-surface px-2 py-1 font-mono text-xs text-fg">
              {side === "buy" ? "SOL" : token.ticker}
            </span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => applyQuick(q)}
              disabled={side === "sell" && tokenBalance === 0}
              title={side === "sell" && tokenBalance === 0 ? "No balance to sell" : undefined}
              className="h-8 rounded-sm border border-line-2 font-mono text-xs text-fg-2 transition-colors hover:border-line-3 hover:text-fg disabled:opacity-40"
            >
              {side === "buy" ? `${q} SOL` : `${q}%`}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-md border border-line bg-bg px-3 py-2.5">
          <div className="text-xs text-fg-3">{side === "buy" ? "You receive (estimated)" : "You receive (estimated)"}</div>
          <div className="mt-1 font-mono text-lg text-fg tabular">
            {quote
              ? side === "buy"
                ? `${fmt.num(quote.outputAmount, 0)} ${token.ticker}`
                : fmt.sol(quote.outputAmount, 6)
              : "—"}
          </div>
        </div>

        {error && (
          <p id="trade-error" role="alert" className="mt-2 text-xs text-down">
            {error}
          </p>
        )}
        {quote?.capped && (
          <p className="mt-2 flex gap-1.5 text-xs text-warn">
            <Info className="mt-px size-3.5 shrink-0" />
            {side === "buy"
              ? `Order reduced to the ${fmt.sol(token.curve.targetSol - token.curve.raisedSol)} left before graduation.`
              : "Amount reduced to what the curve can buy back."}
          </p>
        )}

        <div className="mt-3 border-t border-line pt-2">
          <Row label="Price" value={`${fmt.price(token.priceUsd)}`} />
          <Row
            label="Price impact"
            value={<span className={impactTone}>{quote ? fmt.pctPlain(quote.priceImpact * 100, 2) : "—"}</span>}
          />
          <Row
            label={side === "buy" ? "Minimum received" : "Minimum SOL"}
            value={
              quote
                ? side === "buy"
                  ? `${fmt.compact(quote.minOutput)} ${token.ticker}`
                  : fmt.sol(quote.minOutput, 6)
                : "—"
            }
          />
          <Row
            label={graduated ? "Pool fee (0.25%)" : `Curve fee (${DEMO_PARAMS.tradeFeeBps / 100}%)`}
            value={quote ? fmt.sol(quote.fee, 6) : "—"}
          />
          <Row label="Route" value={<span className="font-sans text-fg-2">{route.adapter.label}</span>} />
        </div>

        {impact > 0.15 && (
          <div className="mt-2 flex gap-2 rounded-sm border border-down/25 bg-down-dim p-2.5 text-xs text-down">
            <AlertTriangle className="size-3.5 shrink-0" />
            Price impact above 15%. You will pay significantly more than the current price.
          </div>
        )}

        <div className="mt-3">
          {!mounted || !connected ? (
            <Button variant="primary" size="lg" className="w-full" onClick={() => setOpen(true)}>
              Connect Wallet
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!quote || Boolean(error)}
              onClick={() => setReview(true)}
            >
              {!amount ? "Enter an amount" : error ? "Fix input to continue" : "Review swap"}
            </Button>
          )}
        </div>
        {!route.availability.available && (
          <p className="mt-2.5 text-center text-xs text-fg-3">Quotes are calculated locally. Execution is unavailable — see review.</p>
        )}
      </div>

      <Dialog open={review} onOpenChange={setReview} title="Review swap" description="Check the details before your wallet asks for approval.">
        {quote && (
          <div className="px-5 py-4">
            <Row label={side === "buy" ? "You pay" : "You sell"} value={side === "buy" ? fmt.sol(quote.inputAmount) : `${fmt.compact(quote.inputAmount)} ${token.ticker}`} />
            <Row
              label="You receive (est.)"
              value={side === "buy" ? `${fmt.compact(quote.outputAmount)} ${token.ticker}` : fmt.sol(quote.outputAmount, 6)}
            />
            <Row
              label="Minimum received"
              value={side === "buy" ? `${fmt.compact(quote.minOutput)} ${token.ticker}` : fmt.sol(quote.minOutput, 6)}
            />
            <Row label="Max slippage" value={`${slippageBps / 100}%`} />
            <Row label="Price impact" value={<span className={impactTone}>{fmt.pctPlain(quote.priceImpact * 100, 2)}</span>} />
            <Row label="Fee" value={fmt.sol(quote.fee, 6)} />
            <Row label="Route" value={<span className="font-sans">{route.adapter.label}</span>} />

            {!route.availability.available ? (
              <div className="mt-4 rounded-md border border-warn/25 bg-warn-dim p-3 text-[13px] text-warn">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="size-4" />
                  Swap cannot be submitted
                </div>
                <p className="mt-1 text-xs leading-relaxed text-warn/90">{route.availability.reason}</p>
                <p className="mt-1 text-xs leading-relaxed text-warn/90">No transaction will be created and nothing was sent to your wallet.</p>
              </div>
            ) : null}

            <div className="mt-5 flex gap-2">
              <Button className="flex-1" onClick={() => setReview(false)}>
                Back
              </Button>
              <Button variant="primary" className="flex-1" disabled={!route.availability.available}>
                Confirm Swap
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
