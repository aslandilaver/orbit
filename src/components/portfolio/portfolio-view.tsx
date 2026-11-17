"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ArrowUpRight, CircleX, Coins, History, Inbox, RefreshCw, Rocket, Wallet } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LAUNCHES_KEY } from "@/lib/launch/storage";
import { useWalletModal } from "@/components/providers/solana-provider";
import { Button, buttonClass } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { SourceBadge } from "@/components/ui/data-source";
import { EmptyState, Panel, PanelHeader, Skeleton } from "@/components/ui/primitives";
import { CLUSTER, CLUSTER_LABEL } from "@/config/public-env";
import { classifyError } from "@/lib/solana/errors";
import { explorerUrl } from "@/lib/solana/explorer";
import { fetchActivity, fetchHoldings, useSolBalance, type ActivityItem, type AsyncState, type Holding } from "@/lib/solana/hooks";
import { useMounted } from "@/lib/use-mounted";
import { cn, fmt } from "@/lib/utils";

interface StoredLaunch {
  mint: string;
  signature: string;
  name: string;
  ticker: string;
  cluster: string;
  at: number;
}

function useAsync<T>(fn: (() => Promise<T>) | null) {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });
  const run = useCallback(() => {
    if (!fn) return setState({ status: "idle" });
    setState({ status: "loading" });
    fn()
      .then((data) => setState({ status: "success", data }))
      .catch((e) => setState({ status: "error", error: classifyError(e).message }));
  }, [fn]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- starts an async RPC fetch; loading state is set first by design
  useEffect(() => run(), [run]);
  return { state, retry: run };
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <EmptyState
      icon={<CircleX />}
      title="Could not load from RPC"
      description={message}
      action={
        <Button size="sm" onClick={onRetry}>
          <RefreshCw /> Retry
        </Button>
      }
    />
  );
}

function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4" aria-busy aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function PortfolioView() {
  const { connection } = useConnection();
  const { publicKey, connected, connecting, wallet } = useWallet();
  const { setOpen } = useWalletModal();
  const { state: balance, refresh } = useSolBalance();
  const mounted = useMounted();
  // Only rendered after mount (wallet required), so reading storage lazily cannot cause a hydration mismatch.
  const [launches] = useState<StoredLaunch[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const all = JSON.parse(localStorage.getItem(LAUNCHES_KEY) || "[]") as StoredLaunch[];
      return all.filter((l) => l.cluster === CLUSTER);
    } catch {
      return [];
    }
  });

  const holdingsFn = useCallback(
    () => (publicKey ? fetchHoldings(connection, publicKey) : Promise.resolve([] as Holding[])),
    [connection, publicKey],
  );
  const activityFn = useCallback(
    () => (publicKey ? fetchActivity(connection, publicKey, 15) : Promise.resolve([] as ActivityItem[])),
    [connection, publicKey],
  );
  const holdings = useAsync(publicKey ? holdingsFn : null);
  const activity = useAsync(publicKey ? activityFn : null);

  if (!mounted || !connected || !publicKey) {
    return (
      <Panel>
        <EmptyState
          icon={<Wallet />}
          title="Connect a wallet to see your portfolio"
          description={`Balances, token holdings and transaction history are read directly from Solana ${CLUSTER_LABEL[CLUSTER]}. ORBIT stores none of it.`}
          action={
            <Button variant="primary" onClick={() => setOpen(true)} loading={mounted && connecting}>
              Connect Wallet
            </Button>
          }
          className="py-20"
        />
      </Panel>
    );
  }

  const address = publicKey.toBase58();

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="bg-bg-2 p-5">
          <div className="flex items-center gap-2 text-xs text-fg-3">
            {wallet?.adapter.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wallet.adapter.icon} alt="" className="size-4 rounded-xs" />
            )}
            {wallet?.adapter.name} · {CLUSTER_LABEL[CLUSTER]}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span className="truncate font-mono text-[13px] text-fg">{address}</span>
            <CopyButton value={address} label="Copy address" />
            <a
              href={explorerUrl("address", address)}
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-6 shrink-0 place-items-center rounded-xs text-fg-3 hover:bg-surface-2 hover:text-fg"
              aria-label="View wallet on Explorer"
            >
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
        <div className="bg-bg-2 p-5">
          <div className="flex items-center justify-between text-xs text-fg-3">
            SOL balance
            <button type="button" onClick={refresh} aria-label="Refresh balance" className="hover:text-fg">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
          <div className="mt-2 font-mono text-2xl text-fg tabular">
            {balance.status === "success" ? (
              fmt.sol(balance.data, 4)
            ) : balance.status === "error" ? (
              <span className="text-sm text-down">{balance.error}</span>
            ) : (
              <Skeleton className="h-8 w-32" />
            )}
          </div>
        </div>
        <div className="bg-bg-2 p-5">
          <div className="text-xs text-fg-3">Token accounts</div>
          <div className="mt-2 font-mono text-2xl text-fg tabular">
            {holdings.state.status === "success" ? holdings.state.data.length : holdings.state.status === "error" ? "—" : <Skeleton className="h-8 w-12" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Panel>
          <PanelHeader
            title={
              <span className="flex items-center gap-2">
                <Coins className="size-4 text-fg-2" /> Holdings
              </span>
            }
            description="SPL Token and Token-2022 accounts"
            action={<SourceBadge source="chain" />}
          />
          {holdings.state.status === "loading" || holdings.state.status === "idle" ? (
            <RowsSkeleton />
          ) : holdings.state.status === "error" ? (
            <ErrorRow message={holdings.state.error} onRetry={holdings.retry} />
          ) : holdings.state.data.length === 0 ? (
            <EmptyState
              icon={<Inbox />}
              title="No tokens yet"
              description="Tokens you hold on this network will appear here."
              action={
                <Link href="/explore" className={buttonClass("secondary", "sm")}>
                  Explore tokens
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-fg-3">
                    <th scope="col" className="py-2.5 pl-4 font-normal">
                      Mint
                    </th>
                    <th scope="col" className="py-2.5 pl-4 font-normal">
                      Program
                    </th>
                    <th scope="col" className="py-2.5 pr-4 pl-4 text-right font-normal">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.state.data.map((h) => (
                    <tr key={h.account} className="border-b border-line last:border-0 hover:bg-surface">
                      <td className="py-2.5 pl-4">
                        <Link href={`/token/${h.mint}`} className="font-mono text-xs text-fg hover:underline">
                          {fmt.address(h.mint, 6)}
                        </Link>
                      </td>
                      <td className="py-2.5 pl-4 text-xs text-fg-3">{h.program === "token-2022" ? "Token-2022" : "SPL Token"}</td>
                      <td className="py-2.5 pr-4 pl-4 text-right font-mono text-fg tabular">{fmt.num(h.amount, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader
              title={
                <span className="flex items-center gap-2">
                  <History className="size-4 text-fg-2" /> Transaction history
                </span>
              }
              action={<SourceBadge source="chain" />}
            />
            {activity.state.status === "loading" || activity.state.status === "idle" ? (
              <RowsSkeleton rows={5} />
            ) : activity.state.status === "error" ? (
              <ErrorRow message={activity.state.error} onRetry={activity.retry} />
            ) : activity.state.data.length === 0 ? (
              <EmptyState icon={<History />} title="No transactions" description="This wallet has no history on this network." />
            ) : (
              <ul className="divide-y divide-line">
                {activity.state.data.map((a) => (
                  <li key={a.signature}>
                    <a
                      href={explorerUrl("tx", a.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-surface"
                    >
                      <span className={cn("size-1.5 shrink-0 rounded-full", a.failed ? "bg-down" : "bg-up")} aria-hidden />
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg-2">{fmt.address(a.signature, 8)}</span>
                      <span className={cn("text-xs", a.failed ? "text-down" : "text-fg-3")}>{a.failed ? "Failed" : "Success"}</span>
                      <span className="w-28 text-right font-mono text-2xs text-fg-3">
                        {a.blockTime ? new Date(a.blockTime * 1000).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : `slot ${a.slot}`}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title={
                <span className="flex items-center gap-2">
                  <Rocket className="size-4 text-fg-2" /> Your launches
                </span>
              }
              description="Launched from this browser"
            />
            {launches.length === 0 ? (
              <EmptyState
                title="No launches yet"
                action={
                  <Link href="/launch" className={buttonClass("secondary", "sm")}>
                    Launch a token
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {launches.map((l) => (
                  <li key={l.mint}>
                    <Link href={`/token/${l.mint}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface">
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] text-fg">{l.name}</span>
                        <span className="block font-mono text-xs text-fg-3">${l.ticker}</span>
                      </span>
                      <span className="font-mono text-xs text-fg-3">{fmt.address(l.mint)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
