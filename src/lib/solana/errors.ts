/**
 * Normalize the many shapes of wallet / RPC errors into something the UI can
 * explain. Wallets differ: Phantom throws code 4001, others throw
 * WalletSignTransactionError with a "rejected" message.
 */
export type TxErrorKind = "rejected" | "insufficient_funds" | "blockhash_expired" | "rpc" | "disconnected" | "unknown";

export interface ClassifiedError {
  kind: TxErrorKind;
  message: string;
}

export function classifyError(err: unknown): ClassifiedError {
  const e = err as { name?: string; message?: string; code?: number; error?: { code?: number; message?: string } };
  const code = e?.code ?? e?.error?.code;
  const msg = String(e?.message ?? e?.error?.message ?? err ?? "").toLowerCase();
  const name = String(e?.name ?? "");

  if (code === 4001 || msg.includes("user rejected") || msg.includes("rejected the request") || msg.includes("declined")) {
    return { kind: "rejected", message: "You declined the request in your wallet. Nothing was submitted." };
  }
  if (name === "WalletNotConnectedError" || msg.includes("not connected") || msg.includes("disconnected")) {
    return { kind: "disconnected", message: "Your wallet disconnected. Reconnect and try again." };
  }
  if (msg.includes("insufficient") || msg.includes("0x1") || msg.includes("attempt to debit an account but found no record")) {
    return { kind: "insufficient_funds", message: "Not enough SOL to cover rent and network fees." };
  }
  if (msg.includes("blockhash") || msg.includes("block height exceeded") || name === "TransactionExpiredBlockheightExceededError") {
    return {
      kind: "blockhash_expired",
      message: "The transaction expired before it was confirmed. It was not executed. You can safely retry.",
    };
  }
  if (msg.includes("failed to fetch") || msg.includes("429") || msg.includes("network") || msg.includes("timeout")) {
    return { kind: "rpc", message: "The RPC node could not be reached or is rate limiting. Try again shortly." };
  }
  return { kind: "unknown", message: e?.message ? String(e.message) : "Something went wrong." };
}
