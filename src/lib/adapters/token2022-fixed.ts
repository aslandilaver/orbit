import {
  AuthorityType,
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  getMintLen,
} from "@solana/spl-token";
import { createInitializeInstruction, createUpdateFieldInstruction, pack, type TokenMetadata } from "@solana/spl-token-metadata";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, type Connection } from "@solana/web3.js";
import { IS_MAINNET } from "@/config/public-env";
import type { LaunchParams } from "@/lib/launch/schema";
import { sendAndConfirm } from "@/lib/solana/send";
import type { CostEstimate, LaunchAdapter } from "./types";

export const TOKEN_DECIMALS = 6;
/** Base fee per signature. Two signatures: payer + new mint. */
const SIGNATURE_FEE_LAMPORTS = 5_000;
/** SPL associated token account size (Token-2022, ImmutableOwner extension). */
const ATA_SIZE_T22 = 170;

function buildMetadata(params: LaunchParams, mint: PublicKey, authority: PublicKey): TokenMetadata {
  // Only links go into additional metadata; long descriptions belong off-chain.
  const additional: [string, string][] = [];
  if (params.website) additional.push(["website", params.website]);
  if (params.x) additional.push(["x", params.x]);
  return {
    mint,
    updateAuthority: authority,
    name: params.name,
    symbol: params.ticker,
    // No metadata host is configured, so there is no JSON/image URI. Wallets will
    // show name and symbol but no logo until the update authority sets a URI.
    uri: "",
    additionalMetadata: additional,
  };
}

function sizes(params: LaunchParams, mint: PublicKey, authority: PublicKey) {
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(buildMetadata(params, mint, authority)).length;
  return { mintLen, metadataLen };
}

/**
 * Build the launch transaction. Exported separately so it can be unit-tested
 * without a wallet. Instructions:
 *  1. create the mint account (owned by Token-2022)
 *  2. point metadata at the mint itself (MetadataPointer extension)
 *  3. initialize the mint — freeze authority is null, so holders can never be frozen
 *  4. write name / symbol on-chain (Token Metadata interface)
 *  5. create the recipient's associated token account
 *  6. mint the full supply to the recipient
 *  7. revoke mint authority — supply is fixed forever
 */
export function buildFixedSupplyLaunchTx(opts: {
  params: LaunchParams;
  payer: PublicKey;
  mint: PublicKey;
  mintRentLamports: number;
}) {
  const { params, payer, mint, mintRentLamports } = opts;
  const recipient = new PublicKey(params.creatorWallet);
  const { mintLen } = sizes(params, mint, payer);
  const md = buildMetadata(params, mint, payer);
  const ata = getAssociatedTokenAddressSync(mint, recipient, false, TOKEN_2022_PROGRAM_ID);
  const rawSupply = BigInt(params.totalSupply) * 10n ** BigInt(TOKEN_DECIMALS);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint,
      space: mintLen,
      lamports: mintRentLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(mint, payer, mint, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(mint, TOKEN_DECIMALS, payer, null, TOKEN_2022_PROGRAM_ID),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint,
      metadata: mint,
      name: md.name,
      symbol: md.symbol,
      uri: md.uri,
      mintAuthority: payer,
      updateAuthority: payer,
    }),
    ...md.additionalMetadata.map(([field, value]) =>
      createUpdateFieldInstruction({ programId: TOKEN_2022_PROGRAM_ID, metadata: mint, updateAuthority: payer, field, value }),
    ),
    createAssociatedTokenAccountInstruction(payer, ata, recipient, mint, TOKEN_2022_PROGRAM_ID),
    createMintToInstruction(mint, ata, payer, rawSupply, [], TOKEN_2022_PROGRAM_ID),
    createSetAuthorityInstruction(mint, payer, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
  );
  return { tx, ata };
}

export const token2022FixedAdapter: LaunchAdapter = {
  id: "token2022-fixed",
  label: "Fixed-supply mint",
  description:
    "Creates a Token-2022 mint with on-chain name and symbol, mints the entire supply to the creator wallet, and permanently revokes mint authority. No bonding curve or pool is created.",

  availability() {
    if (IS_MAINNET) {
      return {
        available: false,
        reason: "Disabled on mainnet in this build. Test on devnet first, then enable deliberately.",
      };
    }
    return { available: true };
  },

  async estimateCost(connection: Connection, params: LaunchParams): Promise<CostEstimate> {
    const placeholder = PublicKey.default;
    const { mintLen, metadataLen } = sizes(params, placeholder, placeholder);
    let mintRent: number;
    let ataRent: number;
    let basis: CostEstimate["basis"] = "chain";
    try {
      [mintRent, ataRent] = await Promise.all([
        connection.getMinimumBalanceForRentExemption(mintLen + metadataLen),
        connection.getMinimumBalanceForRentExemption(ATA_SIZE_T22),
      ]);
    } catch {
      // Offline fallback using the current rent formula: (size + 128) * 6960 lamports.
      basis = "estimate";
      mintRent = (mintLen + metadataLen + 128) * 6_960;
      ataRent = (ATA_SIZE_T22 + 128) * 6_960;
    }
    const fee = SIGNATURE_FEE_LAMPORTS * 2;
    const lines = [
      { label: "Mint account rent", sol: mintRent / LAMPORTS_PER_SOL, note: "Refundable only if the account is closed" },
      { label: "Token account rent", sol: ataRent / LAMPORTS_PER_SOL },
      { label: "Network fee", sol: fee / LAMPORTS_PER_SOL, note: "2 signatures" },
      { label: "ORBIT protocol fee", sol: 0, note: "Not charged by this adapter" },
    ];
    return { lines, totalSol: (mintRent + ataRent + fee) / LAMPORTS_PER_SOL, basis };
  },

  async launch({ connection, wallet, params, onPhase }) {
    const avail = this.availability();
    if (!avail.available) throw new Error(avail.reason);
    if (!wallet.publicKey || !wallet.connected) throw new Error("Wallet not connected");

    // SENSITIVE: a fresh keypair for the *mint address*. It must co-sign its own
    // account creation. It controls nothing after this transaction (mint
    // authority is the user's wallet, then revoked) and is never persisted.
    const mintKeypair = Keypair.generate();
    const { mintLen, metadataLen } = sizes(params, mintKeypair.publicKey, wallet.publicKey);
    const mintRentLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    const { tx } = buildFixedSupplyLaunchTx({
      params,
      payer: wallet.publicKey,
      mint: mintKeypair.publicKey,
      mintRentLamports,
    });

    // The mint keypair partially signs inside sendAndConfirm (via wallet adapter
    // `signers`); the user's wallet adds the fee-payer signature after approval.
    const res = await sendAndConfirm({ connection, wallet, transaction: tx, extraSigners: [mintKeypair], onPhase });
    return { mint: mintKeypair.publicKey.toBase58(), signature: res.signature, slot: res.slot };
  },
};
