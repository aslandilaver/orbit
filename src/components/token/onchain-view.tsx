"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { ArrowUpRight, ChartCandlestick, ChevronLeft, CircleX, RefreshCw, SearchX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { SourceBadge } from "@/components/ui/data-source";
import { EmptyState, Panel, PanelHeader, Row, Skeleton } from "@/components/ui/primitives";
import { CLUSTER, CLUSTER_LABEL } from "@/config/public-env";
import { curveTradeAdapter } from "@/lib/adapters";
import { assessRisk } from "@/lib/risk";
import { classifyError } from "@/lib/solana/errors";
import { explorerUrl, solscanUrl } from "@/lib/solana/explorer";
import { fetchMint, parsePublicKey, type OnchainMint } from "@/lib/solana/inspect";
import { fmt, hashString } from "@/lib/utils";
import { RiskPanel } from "./panels";
import { TokenAvatar } from "./token-bits";

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; mint: OnchainMint };

export function OnchainTokenView({ address }: { address: string }) {
  const { connection } = useConnection();
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    const pk = parsePublicKey(address);
    if (!pk) return setState({ status: "missing" });
    setState({ status: "loading" });
    try {
      const mint = await fetchMint(connection, pk);
      setState(mint ? { status: "ready", mint } : { status: "missing" });
    } catch (e) {
      setState({ status: "error", message: classifyError(e).message });
    }
  }, [address, connection]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async RPC fetch from an external system
    load();
  }, [load]);

  return (
    <div className="container-page pt-6">
      <Link href="/explore" className="inline-flex items-center gap-1 text-xs text-fg-3 hover:text-fg">
        <ChevronLeft className="size-3.5" />
        Explore
      </Link>

      {state.status === "loading" && (
        <div className="mt-6" aria-busy aria-label="Loading token from chain">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="mt-2 h-4 w-72 max-w-full" />
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_360px]">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </div>
      )}

      {state.status === "missing" && (
        <Panel className="mt-6">
          <EmptyState
            icon={<SearchX />}
            title="No token mint at this address"
            description={`Nothing on Solana ${CLUSTER_LABEL[CLUSTER]} at ${fmt.address(address, 6)} is an SPL or Token-2022 mint. Check the address and the network.`}
            action={
              <div className="flex gap-2">
                <a className={buttonClass("secondary", "sm")} href={explorerUrl("address", address)} target="_blank" rel="noopener noreferrer">
                  Open in Explorer <ArrowUpRight />
                </a>
                <Link className={buttonClass("ghost", "sm")} href="/explore">
                  Back to Explore
                </Link>
              </div>
            }
          />
        </Panel>
      )}

      {state.status === "error" && (
        <Panel className="mt-6">
          <EmptyState
            icon={<CircleX />}
            title="Could not reach the RPC node"
            description={state.message}
            action={
              <Button size="sm" onClick={load}>
                <RefreshCw /> Retry
              </Button>
            }
          />
        </Panel>
      )}

      {state.status === "ready" && <Ready mint={state.mint} />}
    </div>
  );
}

function Ready({ mint }: { mint: OnchainMint }) {
  const name = mint.metadata?.name || "Unnamed token";
  const symbol = mint.metadata?.symbol || "—";
  const top = mint.largestHolders[0]?.pct ?? 0;
  const top10 = mint.largestHolders.reduce((s, h) => s + h.pct, 0);
  const flags = assessRisk({
    mintAuthorityActive: Boolean(mint.mintAuthority),
    freezeAuthorityActive: Boolean(mint.freezeAuthority),
    topHolderPct: top,
    top10Pct: top10,
    creatorPct: 0,
  });
  const avail = curveTradeAdapter.availability({ address: mint.address, isDemo: false, status: "unknown" });

  return (
    <>
      <div className="mt-5 flex items-start gap-4">
        <TokenAvatar name={name} ticker={symbol === "—" ? "?" : symbol} hue={hashString(mint.address) % 360} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-xl font-medium tracking-[-0.015em] text-fg sm:text-2xl">{name}</h1>
            <span className="font-mono text-sm text-fg-2">{symbol !== "—" ? `$${symbol}` : ""}</span>
            <SourceBadge source="chain" />
          </div>
          <div className="mt-1.5 flex min-w-0 items-center gap-1 text-xs text-fg-3">
            <span className="truncate font-mono">{mint.address}</span>
            <CopyButton value={mint.address} label="Copy mint address" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel>
            <PanelHeader
              title="Mint"
              description={`Read directly from Solana ${CLUSTER_LABEL[CLUSTER]}`}
              action={
                <div className="flex gap-1">
                  <a className={buttonClass("ghost", "sm")} href={explorerUrl("address", mint.address)} target="_blank" rel="noopener noreferrer">
                    Explorer <ArrowUpRight />
                  </a>
                  <a className={buttonClass("ghost", "sm")} href={solscanUrl("token", mint.address)} target="_blank" rel="noopener noreferrer">
                    Solscan <ArrowUpRight />
                  </a>
                </div>
              }
            />
            <div className="grid gap-x-8 px-4 py-2 sm:grid-cols-2">
              <Row label="Program" value={mint.program === "token-2022" ? "Token-2022" : "SPL Token"} />
              <Row label="Supply" value={fmt.num(mint.supply, 2)} />
              <Row label="Decimals" value={mint.decimals} />
              <Row label="Mint authority" value={mint.mintAuthority ? fmt.address(mint.mintAuthority) : <span className="text-up">Revoked</span>} />
              <Row label="Freeze authority" value={mint.freezeAuthority ? fmt.address(mint.freezeAuthority) : <span className="text-up">None</span>} />
              <Row
                label="Metadata update authority"
                value={mint.metadata?.updateAuthority ? fmt.address(mint.metadata.updateAuthority) : "—"}
              />
              {mint.extensions.length > 0 && (
                <Row className="sm:col-span-2" label="Extensions" value={<span className="font-sans text-xs">{mint.extensions.join(", ")}</span>} />
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Price" />
            <EmptyState
              icon={<ChartCandlestick />}
              title="No market data indexed"
              description="ORBIT has no trading history for this mint. Charts appear once a pool exists and an indexer is connected."
            />
          </Panel>

          <Panel>
            <PanelHeader title="Largest holders" description="Top token accounts by balance" action={<SourceBadge source="chain" />} />
            {mint.largestHolders.length === 0 ? (
              <EmptyState title="No holder data" description="The RPC node returned no token accounts for this mint." />
            ) : (
              <ul className="divide-y divide-line px-4">
                {mint.largestHolders.map((h, i) => (
                  <li key={h.address} className="flex items-center gap-3 py-2.5 text-[13px]">
                    <span className="w-5 font-mono text-xs text-fg-3">{i + 1}</span>
                    <a
                      href={explorerUrl("address", h.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate font-mono text-xs text-fg-2 hover:text-fg"
                    >
                      {fmt.address(h.address, 6)}
                    </a>
                    <span className="font-mono text-xs text-fg-3 tabular">{fmt.compact(h.amount)}</span>
                    <span className="w-16 text-right font-mono text-fg tabular">{h.pct.toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="flex flex-col gap-4">
          <Panel>
            <PanelHeader title="Trade" />
            <div className="p-4 text-[13px] text-fg-2">
              <p>{avail.reason}</p>
              <p className="mt-2 text-xs text-fg-3">ORBIT will not build a transaction it cannot route safely.</p>
            </div>
          </Panel>
          <RiskPanel flags={flags} source="chain" />
        </aside>
      </div>
    </>
  );
}
