/**
 * Data provider facade.
 *
 * UI code reads tokens and communities only through these functions. Today
 * they return the bundled demo dataset tagged `source: "demo"`. To go live,
 * implement the same signatures against an indexer (Helius DAS + a launch
 * program indexer, persisted in Supabase) and return `source: "indexer"`.
 * Nothing else in the UI needs to change, and demo labels disappear
 * automatically because they key off `source`.
 */
import {
  DEMO_COMMUNITIES,
  DEMO_TOKENS,
  demoCandles,
  demoEcosystemStats,
  demoGraduationHistory,
  demoHolders,
  demoTrades,
} from "./demo";
import type { Community, Sourced, Token } from "./types";

export function getTokens(): Sourced<Token[]> {
  return { data: DEMO_TOKENS, source: "demo" };
}

export function getToken(address: string): Sourced<Token> | null {
  const token = DEMO_TOKENS.find((t) => t.address === address);
  return token ? { data: token, source: "demo" } : null;
}

export function getTokenMarket(token: Token) {
  return {
    source: "demo" as const,
    candles: demoCandles(token),
    trades: demoTrades(token),
    holders: demoHolders(token),
    graduation: demoGraduationHistory(token),
  };
}

export function getCommunities(): Sourced<Community[]> {
  return { data: DEMO_COMMUNITIES, source: "demo" };
}

export function getCommunity(slug: string): Sourced<Community> | null {
  const c = DEMO_COMMUNITIES.find((x) => x.slug === slug);
  return c ? { data: c, source: "demo" } : null;
}

export function getEcosystemStats() {
  return { data: demoEcosystemStats(), source: "demo" as const };
}

export function isDemoAddress(address: string) {
  return address.startsWith("demo-");
}
