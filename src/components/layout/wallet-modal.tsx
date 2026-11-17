"use client";

import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowUpRight, ShieldCheck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { useWalletModal } from "@/components/providers/solana-provider";
import { CLUSTER_LABEL, CLUSTER } from "@/config/public-env";
import { cn } from "@/lib/utils";

const INSTALL_LINKS = [
  { name: "Phantom", url: "https://phantom.com/download" },
  { name: "Solflare", url: "https://solflare.com/download" },
  { name: "Backpack", url: "https://backpack.app/download" },
];

export function WalletModal() {
  const { open, setOpen } = useWalletModal();
  const { wallets, select, connecting, connected, wallet } = useWallet();
  const [pending, setPending] = useState<string | null>(null);

  // Close once the wallet reports a new connection. Track the transition so
  // "Change wallet" (opening the modal while connected) still works.
  const [wasConnected, setWasConnected] = useState(connected);
  if (wasConnected !== connected) {
    setWasConnected(connected);
    if (connected && open) setOpen(false);
  }
  // Pending label only matters while the wallet is connecting.
  const activePending = connecting ? pending : null;

  const detected = useMemo(
    () =>
      wallets
        .filter((w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable)
        .sort((a, b) => a.adapter.name.localeCompare(b.adapter.name)),
    [wallets],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Connect a wallet"
      description={`ORBIT is running on Solana ${CLUSTER_LABEL[CLUSTER]}. Make sure your wallet uses the same network.`}
    >
      <div className="p-3">
        {detected.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {detected.map((w) => {
              const isPending = activePending === w.adapter.name;
              return (
                <li key={w.adapter.name}>
                  <button
                    type="button"
                    disabled={connecting}
                    onClick={() => {
                      setPending(w.adapter.name);
                      // autoConnect on the provider connects as soon as a wallet is selected.
                      select(w.adapter.name as WalletName);
                    }}
                    className={cn(
                      "flex h-12 w-full items-center gap-3 rounded-md px-3 text-left transition-colors hover:bg-surface disabled:opacity-60",
                      wallet?.adapter.name === w.adapter.name && "bg-surface",
                    )}
                  >
                    {/* Wallet icons are data URIs supplied by the wallet itself. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.adapter.icon} alt="" className="size-7 rounded-sm" />
                    <span className="flex-1 text-sm font-medium text-fg">{w.adapter.name}</span>
                    <span className="font-mono text-2xs text-fg-3 uppercase">{isPending ? "Approve in wallet…" : "Detected"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-2 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-md border border-line-2 bg-surface text-fg-2">
                <Wallet className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-fg">No Solana wallet detected</div>
                <div className="text-xs text-fg-2">Install a wallet extension or open ORBIT in a wallet&apos;s browser.</div>
              </div>
            </div>
            <ul className="mt-4 grid gap-1">
              {INSTALL_LINKS.map((l) => (
                <li key={l.name}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 items-center justify-between rounded-md px-3 text-[13px] text-fg-2 hover:bg-surface hover:text-fg"
                  >
                    Get {l.name}
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex items-start gap-2.5 border-t border-line px-5 py-3.5 text-xs text-fg-2">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-accent" />
        <p>
          ORBIT never asks for your seed phrase or private key. Every transaction is shown and approved in your wallet.
        </p>
      </div>
    </Dialog>
  );
}
