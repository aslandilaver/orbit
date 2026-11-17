"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import type { WalletError } from "@solana/wallet-adapter-base";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { RPC_URL } from "@/config/public-env";
import { classifyError } from "@/lib/solana/errors";
import { ToastProvider, useToast } from "./toast";
import { WalletModal } from "@/components/layout/wallet-modal";

const WalletModalCtx = createContext<{ open: boolean; setOpen: (o: boolean) => void } | null>(null);

export function useWalletModal() {
  const ctx = useContext(WalletModalCtx);
  if (!ctx) throw new Error("useWalletModal must be used within SolanaProvider");
  return ctx;
}

function Inner({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const onError = useCallback(
    (error: WalletError) => {
      // Not-ready errors are surfaced inside the modal with install links instead.
      if (error.name === "WalletNotReadyError") return;
      const c = classifyError(error);
      toast.push({ tone: "error", title: c.kind === "rejected" ? "Request declined" : "Wallet error", description: c.message });
    },
    [toast],
  );

  /**
   * Wallets are discovered through the Wallet Standard (Phantom, Solflare,
   * Backpack and others register themselves), so no legacy adapters are bundled.
   * Wallet adapter never exposes keys; every signature is approved in the wallet.
   */
  const wallets = useMemo(() => [], []);
  const modal = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <ConnectionProvider endpoint={RPC_URL} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalCtx.Provider value={modal}>
          {children}
          <WalletModal />
        </WalletModalCtx.Provider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <Inner>{children}</Inner>
    </ToastProvider>
  );
}
