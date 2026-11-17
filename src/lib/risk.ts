import type { TokenRiskInputs } from "@/lib/data/types";

export type RiskLevel = "high" | "medium" | "info";

export interface RiskFlag {
  id: string;
  level: RiskLevel;
  title: string;
  detail: string;
}

/**
 * Heuristic warnings. These flag known risk patterns; their absence does NOT
 * mean a token is safe. The UI states this alongside every result.
 */
export function assessRisk(r: TokenRiskInputs & { holders?: number; ageMinutes?: number; hasLinks?: boolean }): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (r.mintAuthorityActive) {
    flags.push({
      id: "mint",
      level: "high",
      title: "Mint authority is active",
      detail: "The authority can create new tokens at any time, diluting every holder.",
    });
  }
  if (r.freezeAuthorityActive) {
    flags.push({
      id: "freeze",
      level: "high",
      title: "Freeze authority is active",
      detail: "The authority can freeze token accounts, preventing holders from selling or transferring.",
    });
  }
  if (r.topHolderPct >= 15) {
    flags.push({
      id: "top1",
      level: "high",
      title: `Single wallet holds ${r.topHolderPct.toFixed(1)}%`,
      detail: "A large holder can move the price significantly by selling.",
    });
  }
  if (r.top10Pct >= 45) {
    flags.push({
      id: "top10",
      level: "medium",
      title: `Top 10 wallets hold ${r.top10Pct.toFixed(1)}%`,
      detail: "Supply is concentrated. Excludes the bonding curve / pool account.",
    });
  }
  if (r.creatorPct > 10) {
    flags.push({
      id: "creator",
      level: "medium",
      title: `Creator allocation is ${r.creatorPct}%`,
      detail: "Above the 10% ORBIT guideline. Check whether it is vested.",
    });
  }
  if (r.ageMinutes !== undefined && r.ageMinutes < 60) {
    flags.push({
      id: "age",
      level: "info",
      title: "Launched less than an hour ago",
      detail: "Very new tokens have little price history and volatile liquidity.",
    });
  }
  if (r.holders !== undefined && r.holders < 50) {
    flags.push({ id: "holders", level: "info", title: "Fewer than 50 holders", detail: "Thin distribution and liquidity." });
  }
  if (r.hasLinks === false) {
    flags.push({ id: "links", level: "info", title: "No project links", detail: "No website or social channels were provided." });
  }
  return flags;
}
