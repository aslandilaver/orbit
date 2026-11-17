/**
 * Offline check: builds the fixed-supply launch transaction with worst-case
 * field lengths, signs it with throwaway keys, and asserts it fits in a packet.
 * Run: npx tsx scripts/verify-launch-tx.ts
 */
import { Keypair } from "@solana/web3.js";
import { buildFixedSupplyLaunchTx } from "../src/lib/adapters/token2022-fixed";
import { assertLaunchParams } from "../src/lib/launch/schema";

const payer = Keypair.generate();
const mint = Keypair.generate();
const params = assertLaunchParams({
  details: {
    name: "N".repeat(32),
    ticker: "TICKER1234",
    description: "A sufficiently long description for validation.",
    website: "https://" + "w".repeat(150) + ".com",
    x: "https://x.com/" + "h".repeat(160),
    telegram: "",
    discord: "",
  },
  economics: { totalSupply: 1_000_000_000_000, curve: 80, creator: 10, community: 5, treasury: 5, initialBuySol: 1 },
  config: {
    launchType: "fixed",
    curvePreset: "standard",
    graduationTargetSol: 85,
    liquidityDestination: "meteora-damm-v2",
    creatorWallet: payer.publicKey.toBase58(),
  },
});
const { tx } = buildFixedSupplyLaunchTx({ params, payer: payer.publicKey, mint: mint.publicKey, mintRentLamports: 5_000_000 });
tx.feePayer = payer.publicKey;
tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
tx.sign(payer, mint);
const size = tx.serialize().length;
console.log(`instructions=${tx.instructions.length} size=${size} bytes (limit 1232)`);
if (size > 1232) { console.error("TOO LARGE"); process.exit(1); }
// Must reject bad input:
try { assertLaunchParams({ details: { name: "x" }, economics: {}, config: {} }); console.error("validation did not throw"); process.exit(1); } catch { console.log("invalid params rejected: ok"); }
