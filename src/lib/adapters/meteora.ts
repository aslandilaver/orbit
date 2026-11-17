import type { GraduationAdapter, LaunchAdapter } from "./types";

/**
 * Meteora Dynamic Bonding Curve (DBC) — NOT IMPLEMENTED IN THIS BUILD.
 *
 * Intended flow once integrated (see /docs#integrations):
 *  1. Operator creates a DBC pool config (curve shape, fees, migration target,
 *     graduation threshold) and sets METEORA_DBC_CONFIG.
 *  2. `launch` builds a create-pool transaction with
 *     `@meteora-ag/dynamic-bonding-curve-sdk` against that config.
 *  3. Trades route through the DBC program; when the quote threshold is met,
 *     the pool migrates to DAMM v2 (or DLMM), performed by the protocol's
 *     migration keeper — not by this frontend.
 *
 * Until then both adapters report unavailable so the UI never claims a curve
 * or migration exists.
 */
const REQUIREMENTS = [
  "Install and pin @meteora-ag/dynamic-bonding-curve-sdk",
  "Create a DBC pool config on devnet and set METEORA_DBC_CONFIG",
  "Implement createPool + swap builders behind this adapter",
  "Verify migration to DAMM v2 end to end on devnet",
];

export const meteoraDbcLaunchAdapter: LaunchAdapter = {
  id: "meteora-dbc",
  label: "Bonding curve launch",
  description:
    "Creates a Meteora Dynamic Bonding Curve pool. Tokens are sold along the curve until the graduation threshold, then liquidity migrates to a Meteora pool.",
  availability() {
    return {
      available: false,
      reason: "The Meteora bonding-curve integration is not configured on this deployment.",
      requirements: REQUIREMENTS,
    };
  },
  async estimateCost() {
    return { lines: [], totalSol: 0, basis: "estimate" };
  },
  async launch() {
    throw new Error("Meteora DBC adapter is not configured.");
  },
};

export const meteoraGraduationAdapter: GraduationAdapter = {
  id: "meteora-migration",
  label: "Meteora migration",
  availability() {
    return {
      available: false,
      reason: "Graduation status is not indexed: the Meteora migration adapter is not configured.",
      requirements: REQUIREMENTS,
    };
  },
  async getState() {
    throw new Error("Meteora migration adapter is not configured.");
  },
};
