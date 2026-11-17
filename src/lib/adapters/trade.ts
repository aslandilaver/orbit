import { VersionedTransaction, type Connection } from "@solana/web3.js";
import { z } from "zod";
import { IS_MAINNET } from "@/config/public-env";
import type { TradeAdapter, WalletLike } from "./types";

/**
 * On-curve trading needs the launch program (Meteora DBC). Not configured.
 */
export const curveTradeAdapter: TradeAdapter = {
  id: "curve",
  label: "Bonding curve",
  availability(token) {
    if (token.isDemo) {
      return { available: false, reason: "This is a demo token. It does not exist on-chain and cannot be traded." };
    }
    return {
      available: false,
      reason: "Bonding-curve trading requires the Meteora DBC adapter, which is not configured on this deployment.",
    };
  },
};

/**
 * Jupiter routes swaps for graduated tokens that have external liquidity.
 * Jupiter operates on mainnet only, so this is disabled on devnet.
 */
export const jupiterTradeAdapter: TradeAdapter = {
  id: "jupiter",
  label: "Jupiter",
  availability(token) {
    if (token.isDemo) {
      return { available: false, reason: "This is a demo token. It does not exist on-chain and cannot be traded." };
    }
    if (!IS_MAINNET) {
      return { available: false, reason: "Jupiter routing is mainnet-only. This deployment is running on a test cluster." };
    }
    if (token.status !== "graduated") {
      return { available: false, reason: "Jupiter routing applies to graduated tokens with external liquidity." };
    }
    return { available: true };
  },
};

const JUP_BASE = "https://lite-api.jup.ag/swap/v1";

const QuoteSchema = z
  .object({
    inputMint: z.string(),
    outputMint: z.string(),
    inAmount: z.string(),
    outAmount: z.string(),
    otherAmountThreshold: z.string(),
    priceImpactPct: z.string(),
    slippageBps: z.number(),
  })
  .loose();
export type JupiterQuote = z.infer<typeof QuoteSchema>;

export async function jupiterQuote(p: { inputMint: string; outputMint: string; amount: bigint; slippageBps: number }) {
  const url = new URL(`${JUP_BASE}/quote`);
  url.searchParams.set("inputMint", p.inputMint);
  url.searchParams.set("outputMint", p.outputMint);
  url.searchParams.set("amount", p.amount.toString());
  url.searchParams.set("slippageBps", String(Math.round(p.slippageBps)));
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Jupiter quote failed (${res.status})`);
  return QuoteSchema.parse(await res.json());
}

/**
 * SENSITIVE: executes a Jupiter swap. The returned transaction is deserialized
 * and handed to the user's wallet for review and signature — never signed here.
 * The quote's outputs are re-validated by Jupiter's program on-chain
 * (otherAmountThreshold enforces slippage).
 */
export async function jupiterSwap(opts: { connection: Connection; wallet: WalletLike; quote: JupiterQuote }) {
  const { connection, wallet, quote } = opts;
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const res = await fetch(`${JUP_BASE}/swap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: wallet.publicKey.toBase58(),
      dynamicComputeUnitLimit: true,
    }),
  });
  if (!res.ok) throw new Error(`Jupiter swap build failed (${res.status})`);
  const body = z.object({ swapTransaction: z.string(), lastValidBlockHeight: z.number() }).parse(await res.json());
  const tx = VersionedTransaction.deserialize(Buffer.from(body.swapTransaction, "base64"));
  const signature = await wallet.sendTransaction(tx, connection, { maxRetries: 3 });
  const conf = await connection.confirmTransaction(
    { signature, blockhash: tx.message.recentBlockhash, lastValidBlockHeight: body.lastValidBlockHeight },
    "confirmed",
  );
  if (conf.value.err) throw new Error(`Swap failed on-chain: ${JSON.stringify(conf.value.err)}`);
  return signature;
}
