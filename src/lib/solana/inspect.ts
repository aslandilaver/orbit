import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getExtensionTypes,
  getTokenMetadata,
  unpackMint,
} from "@solana/spl-token";
import { PublicKey, type Connection } from "@solana/web3.js";

export interface OnchainMint {
  address: string;
  program: "spl-token" | "token-2022";
  decimals: number;
  supply: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  extensions: string[];
  metadata: { name: string; symbol: string; uri: string; updateAuthority: string | null } | null;
  largestHolders: { address: string; amount: number; pct: number }[];
}

export function parsePublicKey(value: string): PublicKey | null {
  if (value.length < 32 || value.length > 44) return null;
  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

/**
 * Read a mint directly from the chain. Works for any SPL / Token-2022 mint,
 * independent of ORBIT, so the token page can show verifiable facts (supply,
 * authorities) even when no indexer data exists.
 */
export async function fetchMint(connection: Connection, address: PublicKey): Promise<OnchainMint | null> {
  const info = await connection.getAccountInfo(address, "confirmed");
  if (!info) return null;
  const isT22 = info.owner.equals(TOKEN_2022_PROGRAM_ID);
  if (!isT22 && !info.owner.equals(TOKEN_PROGRAM_ID)) return null;

  const mint = unpackMint(address, info, info.owner);
  const decimals = mint.decimals;
  const supply = Number(mint.supply) / 10 ** decimals;

  let metadata: OnchainMint["metadata"] = null;
  let extensions: string[] = [];
  if (isT22) {
    extensions = getExtensionTypes(mint.tlvData).map((t) => ExtensionType[t] ?? String(t));
    try {
      const md = await getTokenMetadata(connection, address, "confirmed", TOKEN_2022_PROGRAM_ID);
      if (md) {
        metadata = {
          name: md.name,
          symbol: md.symbol,
          uri: md.uri,
          updateAuthority: md.updateAuthority ? md.updateAuthority.toBase58() : null,
        };
      }
    } catch {
      metadata = null;
    }
  }

  let largestHolders: OnchainMint["largestHolders"] = [];
  try {
    const largest = await connection.getTokenLargestAccounts(address, "confirmed");
    largestHolders = largest.value.slice(0, 10).map((a) => {
      const amount = Number(a.uiAmount ?? 0);
      return { address: a.address.toBase58(), amount, pct: supply > 0 ? (amount / supply) * 100 : 0 };
    });
  } catch {
    // Some RPC providers disable this method; the UI shows an empty state.
  }

  return {
    address: address.toBase58(),
    program: isT22 ? "token-2022" : "spl-token",
    decimals,
    supply,
    mintAuthority: mint.mintAuthority ? mint.mintAuthority.toBase58() : null,
    freezeAuthority: mint.freezeAuthority ? mint.freezeAuthority.toBase58() : null,
    extensions,
    metadata,
    largestHolders,
  };
}
