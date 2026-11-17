import type { WalletContextState } from "@solana/wallet-adapter-react";
import type { Connection, Keypair, Transaction } from "@solana/web3.js";

export type TxPhase = "building" | "awaiting_signature" | "submitted" | "confirming" | "confirmed";

export interface SendResult {
  signature: string;
  slot: number;
}

/**
 * SENSITIVE: submits a transaction through the user's wallet.
 *
 * - The wallet adapter's `sendTransaction` asks the wallet to sign. The user
 *   approves or rejects in their wallet UI — this code never sees a private key.
 * - `extraSigners` are ephemeral keypairs for *new accounts* (e.g. a new mint
 *   address) that must co-sign their own creation. They hold no funds and are
 *   discarded after this call.
 * - We do not report success until the cluster confirms the signature with
 *   `confirmed` commitment and the transaction has no error.
 */
export async function sendAndConfirm(opts: {
  connection: Connection;
  wallet: Pick<WalletContextState, "publicKey" | "sendTransaction">;
  transaction: Transaction;
  extraSigners?: Keypair[];
  onPhase?: (phase: TxPhase, signature?: string) => void;
}): Promise<SendResult> {
  const { connection, wallet, transaction, extraSigners = [], onPhase } = opts;
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  onPhase?.("building");
  const latest = await connection.getLatestBlockhash("confirmed");
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = latest.blockhash;

  // Simulate first so obvious failures (insufficient funds, bad accounts) surface
  // before the user is asked to sign anything.
  const sim = await connection.simulateTransaction(transaction);
  if (sim.value.err) {
    const logs = sim.value.logs?.slice(-4).join(" | ") ?? "";
    throw new Error(`Simulation failed: ${JSON.stringify(sim.value.err)} ${logs}`);
  }

  onPhase?.("awaiting_signature");
  const signature = await wallet.sendTransaction(transaction, connection, {
    signers: extraSigners,
    preflightCommitment: "confirmed",
    maxRetries: 3,
  });

  onPhase?.("submitted", signature);
  onPhase?.("confirming", signature);
  const res = await connection.confirmTransaction(
    { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
    "confirmed",
  );
  if (res.value.err) {
    throw new Error(`Transaction ${signature} failed on-chain: ${JSON.stringify(res.value.err)}`);
  }
  onPhase?.("confirmed", signature);
  return { signature, slot: res.context.slot };
}
