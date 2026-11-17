import type { WalletContextState } from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";
import type { LaunchParams } from "@/lib/launch/schema";
import type { TxPhase } from "@/lib/solana/send";

/**
 * Adapter contracts. The UI depends only on these interfaces so protocol
 * integrations (Meteora DBC, Jupiter, a custom program) can be swapped in
 * without touching components. An adapter that is not wired up must say so
 * through `availability()` — never simulate success.
 */

export interface Availability {
  available: boolean;
  /** Human-readable reason when unavailable; shown verbatim in the UI. */
  reason?: string;
  /** What an operator must do to enable it. */
  requirements?: string[];
}

export type WalletLike = Pick<WalletContextState, "publicKey" | "sendTransaction" | "connected">;

export interface CostLine {
  label: string;
  sol: number;
  note?: string;
}

export interface CostEstimate {
  lines: CostLine[];
  totalSol: number;
  /** "chain" when rent was read from the RPC; "estimate" when computed offline. */
  basis: "chain" | "estimate";
}

export interface LaunchResult {
  mint: string;
  signature: string;
  slot: number;
}

export interface LaunchAdapter {
  id: string;
  label: string;
  description: string;
  availability(): Availability;
  estimateCost(connection: Connection, params: LaunchParams): Promise<CostEstimate>;
  launch(ctx: {
    connection: Connection;
    wallet: WalletLike;
    params: LaunchParams;
    onPhase?: (p: TxPhase, sig?: string) => void;
  }): Promise<LaunchResult>;
}

export interface TradeAdapter {
  id: string;
  label: string;
  availability(token: { address: string; isDemo: boolean; status: string }): Availability;
}

export interface GraduationState {
  graduated: boolean;
  pool?: string;
  migratedAtSlot?: number;
}

export interface GraduationAdapter {
  id: string;
  label: string;
  availability(): Availability;
  getState(mint: string): Promise<GraduationState>;
}
