import { CLUSTER } from "@/config/public-env";

type Kind = "tx" | "address" | "token";

/** Solana Explorer link for the active cluster. */
export function explorerUrl(kind: Kind, value: string) {
  const path = kind === "tx" ? "tx" : "address";
  const cluster = CLUSTER === "mainnet-beta" ? "" : `?cluster=${CLUSTER}`;
  return `https://explorer.solana.com/${path}/${encodeURIComponent(value)}${cluster}`;
}

export function solscanUrl(kind: Kind, value: string) {
  const path = kind === "tx" ? "tx" : kind === "token" ? "token" : "account";
  const cluster = CLUSTER === "mainnet-beta" ? "" : `?cluster=${CLUSTER}`;
  return `https://solscan.io/${path}/${encodeURIComponent(value)}${cluster}`;
}
