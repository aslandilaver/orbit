"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowUpRight, Check, ChevronDown, Copy, LogOut, PieChart, RefreshCw, Repeat } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalletModal } from "@/components/providers/solana-provider";
import { useToast } from "@/components/providers/toast";
import { CLUSTER, CLUSTER_LABEL } from "@/config/public-env";
import { explorerUrl } from "@/lib/solana/explorer";
import { useSolBalance } from "@/lib/solana/hooks";
import { useMounted } from "@/lib/use-mounted";
import { cn, fmt } from "@/lib/utils";

const item =
  "flex h-9 cursor-default items-center gap-2.5 rounded-sm px-2.5 text-[13px] text-fg-2 outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg [&_svg]:size-3.5";

export function WalletButton({ className, block }: { className?: string; block?: boolean }) {
  const { publicKey, connected, connecting, disconnecting, disconnect, wallet } = useWallet();
  const { setOpen } = useWalletModal();
  const { state: balance, refresh } = useSolBalance();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  // Wallet state only exists in the browser; render the neutral button during SSR.
  const mounted = useMounted();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  if (!mounted || !connected || !publicKey) {
    return (
      <Button
        variant="primary"
        size="md"
        className={cn(block && "w-full", className)}
        loading={mounted && connecting}
        onClick={() => setOpen(true)}
      >
        {mounted && connecting ? "Connecting" : "Connect Wallet"}
      </Button>
    );
  }

  const address = publicKey.toBase58();

  return (
    <DM.Root>
      <DM.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border border-line-2 bg-surface pr-2 pl-2.5 text-[13px] text-fg transition-colors hover:border-line-3 data-[state=open]:border-line-3",
            block && "w-full justify-between",
            className,
          )}
          aria-label={`Wallet ${fmt.address(address)}`}
        >
          <span className="flex items-center gap-2">
            {wallet?.adapter.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wallet.adapter.icon} alt="" className="size-4 rounded-xs" />
            ) : (
              <span className="size-2 rounded-full bg-accent" />
            )}
            <span className="font-mono">{fmt.address(address)}</span>
          </span>
          <span className="hidden font-mono text-xs text-fg-3 sm:inline">
            {balance.status === "success" ? `${balance.data.toFixed(2)} SOL` : balance.status === "loading" ? "…" : ""}
          </span>
          <ChevronDown className="size-3.5 text-fg-3" />
        </button>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 animate-[dialog-in_140ms_ease-out] rounded-md border border-line-2 bg-bg-2 p-1 shadow-2xl"
        >
          <div className="px-2.5 pt-2 pb-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-fg-3">{wallet?.adapter.name ?? "Wallet"}</span>
              <span className="font-mono text-2xs text-fg-3 uppercase">{CLUSTER_LABEL[CLUSTER]}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-lg text-fg tabular">
                {balance.status === "success"
                  ? fmt.sol(balance.data)
                  : balance.status === "error"
                    ? "Unavailable"
                    : "Loading…"}
              </span>
              <button
                type="button"
                onClick={refresh}
                className="text-fg-3 hover:text-fg"
                aria-label="Refresh balance"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>
            {balance.status === "error" && <div className="mt-1 text-xs text-down">{balance.error}</div>}
          </div>
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.Item
            className={item}
            onSelect={async (e) => {
              e.preventDefault();
              try {
                await navigator.clipboard.writeText(address);
                setCopied(true);
              } catch {
                toast.push({ tone: "error", title: "Clipboard unavailable" });
              }
            }}
          >
            {copied ? <Check className="text-up" /> : <Copy />}
            {copied ? "Copied" : "Copy address"}
          </DM.Item>
          <DM.Item asChild className={item}>
            <Link href="/portfolio">
              <PieChart />
              Portfolio
            </Link>
          </DM.Item>
          <DM.Item asChild className={item}>
            <a href={explorerUrl("address", address)} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight />
              View on Explorer
            </a>
          </DM.Item>
          <DM.Item className={item} onSelect={() => setOpen(true)}>
            <Repeat />
            Change wallet
          </DM.Item>
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.Item
            className={cn(item, "data-[highlighted]:text-down")}
            disabled={disconnecting}
            onSelect={() => {
              disconnect().catch(() => toast.push({ tone: "error", title: "Could not disconnect" }));
            }}
          >
            <LogOut />
            Disconnect
          </DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
