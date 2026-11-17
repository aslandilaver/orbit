import type { CurveState } from "@/lib/curve";

/**
 * Where a piece of data came from. UI must surface anything that is not "live".
 * - demo: deterministic sample data bundled with the app. Not real market data.
 * - chain: read directly from a Solana RPC node.
 * - indexer: from an indexing service (Helius / Supabase).
 */
export type DataSource = "demo" | "chain" | "indexer";

export interface Sourced<T> {
  data: T;
  source: DataSource;
}

export type TokenCategory = "meme" | "ai" | "defi" | "gaming" | "infra" | "social" | "depin";

export const CATEGORY_LABEL: Record<TokenCategory, string> = {
  meme: "Meme",
  ai: "AI",
  defi: "DeFi",
  gaming: "Gaming",
  infra: "Infrastructure",
  social: "Social",
  depin: "DePIN",
};

/** Lifecycle: New Launch → Bonding Curve → Graduation Ready → Graduated */
export type TokenStatus = "new" | "bonding" | "graduating" | "graduated";

export const STATUS_LABEL: Record<TokenStatus, string> = {
  new: "New launch",
  bonding: "Bonding curve",
  graduating: "Graduation ready",
  graduated: "Graduated",
};

export interface TokenLinks {
  website?: string;
  x?: string;
  telegram?: string;
  discord?: string;
}

export interface Tokenomics {
  curve: number;
  creator: number;
  community: number;
  treasury: number;
}

export interface TokenRiskInputs {
  mintAuthorityActive: boolean;
  freezeAuthorityActive: boolean;
  topHolderPct: number;
  top10Pct: number;
  creatorPct: number;
}

export interface Token {
  address: string;
  isDemo: boolean;
  name: string;
  ticker: string;
  category: TokenCategory;
  description: string;
  /** Hue used for the generated avatar when no logo is hosted. */
  hue: number;
  ageMinutes: number;
  priceUsd: number;
  marketCapUsd: number;
  liquidityUsd: number;
  volume24hUsd: number;
  change24h: number;
  holders: number;
  status: TokenStatus;
  communityPick: boolean;
  communitySlug?: string;
  links: TokenLinks;
  tokenomics: Tokenomics;
  curve: CurveState;
  risk: TokenRiskInputs;
  creator: string;
  graduatedAgeMinutes?: number;
}

export interface CommunityUpdate {
  id: string;
  kind: "update" | "announcement" | "milestone";
  title: string;
  body: string;
  ageMinutes: number;
}

export interface Community {
  slug: string;
  name: string;
  tagline: string;
  about: string;
  tokenAddress: string;
  members: number;
  activeWallets7d: number;
  featured: boolean;
  links: TokenLinks;
  updates: CommunityUpdate[];
}

export interface Trade {
  id: string;
  side: "buy" | "sell";
  wallet: string;
  sol: number;
  tokens: number;
  ageMinutes: number;
}

export interface Holder {
  label: string;
  wallet: string;
  pct: number;
  kind: "curve" | "creator" | "holder" | "treasury" | "community";
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface GraduationEvent {
  label: string;
  detail: string;
  ageMinutes: number | null;
  reached: boolean;
}

export interface EcosystemStats {
  launched: number;
  volume24hUsd: number;
  activeCommunities: number;
  graduated: number;
}
