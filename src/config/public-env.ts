import { z } from "zod";

/**
 * Public, browser-safe configuration.
 *
 * Every value here is inlined into the client bundle at build time, so this file
 * must never read secrets. Server-only values live in `server-env.ts`.
 * Each variable is referenced literally so Next.js can inline it.
 */
const ClusterSchema = z.enum(["devnet", "testnet", "mainnet-beta"]);
export type Cluster = z.infer<typeof ClusterSchema>;

const rawCluster = ClusterSchema.safeParse(process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet");
const mainnetEnabled = process.env.NEXT_PUBLIC_ENABLE_MAINNET === "true";
const requestedCluster: Cluster = rawCluster.success ? rawCluster.data : "devnet";

/**
 * Mainnet is gated behind an explicit flag. If the cluster is set to
 * mainnet-beta without enabling it, fall back to devnet rather than risk
 * real funds against untested adapters.
 */
export const CLUSTER: Cluster =
  requestedCluster === "mainnet-beta" && !mainnetEnabled ? "devnet" : requestedCluster;

export const CLUSTER_FALLBACK_REASON =
  requestedCluster === "mainnet-beta" && !mainnetEnabled
    ? "Mainnet requested but NEXT_PUBLIC_ENABLE_MAINNET is not 'true'. Using devnet."
    : null;

const DEFAULT_RPC: Record<Cluster, string> = {
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
};

const rpcOverride = z.url().safeParse(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || undefined);
export const RPC_URL = rpcOverride.success ? rpcOverride.data : DEFAULT_RPC[CLUSTER];
export const RPC_IS_PUBLIC_DEFAULT = !rpcOverride.success;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const IS_MAINNET = CLUSTER === "mainnet-beta";

export const CLUSTER_LABEL: Record<Cluster, string> = {
  devnet: "Devnet",
  testnet: "Testnet",
  "mainnet-beta": "Mainnet",
};
