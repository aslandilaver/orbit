"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

/** Live SOL balance for the connected wallet; subscribes to account changes. */
export function useSolBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [state, setState] = useState<AsyncState<number>>({ status: "idle" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!publicKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the wallet disconnects (external system)
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    setState((s) => (s.status === "success" ? s : { status: "loading" }));
    connection
      .getBalance(publicKey, "confirmed")
      .then((lamports) => !cancelled && setState({ status: "success", data: lamports / LAMPORTS_PER_SOL }))
      .catch(() => !cancelled && setState({ status: "error", error: "Could not load balance from RPC" }));

    let subId: number | null = null;
    try {
      subId = connection.onAccountChange(
        publicKey,
        (acc) => !cancelled && setState({ status: "success", data: acc.lamports / LAMPORTS_PER_SOL }),
        { commitment: "confirmed" },
      );
    } catch {
      subId = null;
    }
    return () => {
      cancelled = true;
      if (subId !== null) connection.removeAccountChangeListener(subId).catch(() => {});
    };
  }, [connection, publicKey, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { state, refresh };
}

export interface Holding {
  mint: string;
  account: string;
  amount: number;
  decimals: number;
  program: "spl-token" | "token-2022";
}

export interface ActivityItem {
  signature: string;
  slot: number;
  blockTime: number | null;
  failed: boolean;
  memo: string | null;
}

/** Token balances held by an owner across both token programs. */
export async function fetchHoldings(connection: ReturnType<typeof useConnection>["connection"], owner: PublicKey) {
  const [legacy, t22] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }, "confirmed"),
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }, "confirmed"),
  ]);
  const map = (list: typeof legacy, program: Holding["program"]): Holding[] =>
    list.value.map((a) => {
      const info = a.account.data.parsed.info as {
        mint: string;
        tokenAmount: { uiAmount: number | null; decimals: number };
      };
      return {
        mint: info.mint,
        account: a.pubkey.toBase58(),
        amount: info.tokenAmount.uiAmount ?? 0,
        decimals: info.tokenAmount.decimals,
        program,
      };
    });
  return [...map(legacy, "spl-token"), ...map(t22, "token-2022")].sort((a, b) => b.amount - a.amount);
}

export async function fetchActivity(
  connection: ReturnType<typeof useConnection>["connection"],
  owner: PublicKey,
  limit = 15,
): Promise<ActivityItem[]> {
  const sigs = await connection.getSignaturesForAddress(owner, { limit }, "confirmed");
  return sigs.map((s) => ({
    signature: s.signature,
    slot: s.slot,
    blockTime: s.blockTime ?? null,
    failed: s.err !== null,
    memo: s.memo,
  }));
}
