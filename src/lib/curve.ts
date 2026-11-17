/**
 * Constant-product bonding curve with virtual reserves.
 *
 *   k = (V0 + raised) * T
 *
 * V0 is a virtual SOL reserve that sets the starting price; T is the remaining
 * token reserve on the curve. Buys add SOL, remove tokens; sells do the reverse.
 * This module is pure math used for quotes and previews. It does not execute
 * trades: execution belongs to the on-chain program behind a TradeAdapter.
 */

export type CurvePresetId = "standard" | "gentle" | "steep";

export interface CurvePreset {
  id: CurvePresetId;
  label: string;
  description: string;
  /** Virtual SOL reserve at launch. Higher = higher starting price, flatter curve. */
  virtualSol: number;
  /** Fraction of total supply sold through the curve before graduation. */
  curveShare: number;
}

export const CURVE_PRESETS: Record<CurvePresetId, CurvePreset> = {
  standard: {
    id: "standard",
    label: "Standard",
    description: "Balanced price discovery. Suitable for most community launches.",
    virtualSol: 28,
    curveShare: 0.8,
  },
  gentle: {
    id: "gentle",
    label: "Gentle",
    description: "Higher starting price, slower appreciation. Rewards later buyers more evenly.",
    virtualSol: 45,
    curveShare: 0.8,
  },
  steep: {
    id: "steep",
    label: "Steep",
    description: "Low starting price, fast appreciation. Early buyers carry more risk and reward.",
    virtualSol: 16,
    curveShare: 0.8,
  },
};

export interface CurveConfig {
  virtualSol: number;
  /** Tokens allocated to the curve (raw units, not decimals-adjusted). */
  curveTokens: number;
  totalSupply: number;
  /** SOL raised at which the curve is complete and the token can graduate. */
  targetSol: number;
  /** Trade fee in basis points, taken from the SOL side. */
  feeBps: number;
}

export interface CurveState extends CurveConfig {
  raisedSol: number;
}

/**
 * The virtual token reserve is chosen so that exactly `curveTokens` are sold
 * when `targetSol` has been raised:
 *   V0 * T0 = (V0 + target) * (T0 - curveTokens)
 *   => T0 = curveTokens * (V0 + target) / target
 */
export function virtualTokenReserve(c: CurveConfig) {
  return (c.curveTokens * (c.virtualSol + c.targetSol)) / c.targetSol;
}

export function reserves(s: CurveState) {
  const T0 = virtualTokenReserve(s);
  const k = s.virtualSol * T0;
  const sol = s.virtualSol + s.raisedSol;
  const tokens = k / sol;
  return { k, sol, tokens, T0, sold: T0 - tokens };
}

/** Spot price in SOL per token. */
export function spotPrice(s: CurveState) {
  const r = reserves(s);
  return r.sol / r.tokens;
}

export function progress(s: CurveState) {
  return Math.min(1, s.raisedSol / s.targetSol);
}

export interface Quote {
  inputAmount: number;
  outputAmount: number;
  fee: number;
  /** SOL actually entering/leaving the curve after fee. */
  netSol: number;
  priceBefore: number;
  priceAfter: number;
  executionPrice: number;
  /** Execution price vs spot, as a fraction (0.02 = 2%). */
  priceImpact: number;
  /** True when the order was reduced because the curve would complete. */
  capped: boolean;
  /** Minimum output after slippage tolerance. */
  minOutput: number;
}

export function quoteBuy(s: CurveState, solIn: number, slippageBps: number): Quote | null {
  if (!(solIn > 0) || !Number.isFinite(solIn)) return null;
  const r = reserves(s);
  const fee = (solIn * s.feeBps) / 10_000;
  let net = solIn - fee;
  const remaining = Math.max(0, s.targetSol - s.raisedSol);
  let capped = false;
  if (net > remaining) {
    net = remaining;
    capped = true;
  }
  if (net <= 0) return null;
  const tokensOut = r.tokens - r.k / (r.sol + net);
  const priceBefore = r.sol / r.tokens;
  const priceAfter = (r.sol + net) / (r.k / (r.sol + net));
  const executionPrice = net / tokensOut;
  return {
    inputAmount: capped ? net + (net * s.feeBps) / (10_000 - s.feeBps) : solIn,
    outputAmount: tokensOut,
    fee: capped ? (net * s.feeBps) / (10_000 - s.feeBps) : fee,
    netSol: net,
    priceBefore,
    priceAfter,
    executionPrice,
    priceImpact: executionPrice / priceBefore - 1,
    capped,
    minOutput: tokensOut * (1 - slippageBps / 10_000),
  };
}

export function quoteSell(s: CurveState, tokensIn: number, slippageBps: number): Quote | null {
  if (!(tokensIn > 0) || !Number.isFinite(tokensIn)) return null;
  const r = reserves(s);
  // Cannot sell more than has been bought from the curve.
  const sellable = r.sold;
  let capped = false;
  let amount = tokensIn;
  if (amount > sellable) {
    amount = sellable;
    capped = true;
  }
  if (amount <= 0) return null;
  const grossSol = r.sol - r.k / (r.tokens + amount);
  const fee = (grossSol * s.feeBps) / 10_000;
  const net = grossSol - fee;
  const priceBefore = r.sol / r.tokens;
  const newTokens = r.tokens + amount;
  const priceAfter = r.k / newTokens / newTokens;
  const executionPrice = grossSol / amount;
  return {
    inputAmount: amount,
    outputAmount: net,
    fee,
    netSol: net,
    priceBefore,
    priceAfter,
    executionPrice,
    priceImpact: 1 - executionPrice / priceBefore,
    capped,
    minOutput: net * (1 - slippageBps / 10_000),
  };
}

/**
 * Constant-product pool quote (x*y=k), used for graduated tokens that trade
 * against an external pool. `side` is from the user's perspective.
 */
export function quoteCpmm(
  pool: { solReserve: number; tokenReserve: number; feeBps: number },
  side: "buy" | "sell",
  amountIn: number,
  slippageBps: number,
): Quote | null {
  if (!(amountIn > 0) || !Number.isFinite(amountIn)) return null;
  const { solReserve: x, tokenReserve: y, feeBps } = pool;
  const k = x * y;
  const priceBefore = x / y;
  if (side === "buy") {
    const fee = (amountIn * feeBps) / 10_000;
    const net = amountIn - fee;
    const out = y - k / (x + net);
    const exec = net / out;
    const nx = x + net;
    return {
      inputAmount: amountIn,
      outputAmount: out,
      fee,
      netSol: net,
      priceBefore,
      priceAfter: nx / (k / nx),
      executionPrice: exec,
      priceImpact: exec / priceBefore - 1,
      capped: false,
      minOutput: out * (1 - slippageBps / 10_000),
    };
  }
  const gross = x - k / (y + amountIn);
  const fee = (gross * feeBps) / 10_000;
  const net = gross - fee;
  const exec = gross / amountIn;
  const ny = y + amountIn;
  return {
    inputAmount: amountIn,
    outputAmount: net,
    fee,
    netSol: net,
    priceBefore,
    priceAfter: k / ny / ny,
    executionPrice: exec,
    priceImpact: 1 - exec / priceBefore,
    capped: false,
    minOutput: net * (1 - slippageBps / 10_000),
  };
}

/** Sample the curve for charting price against SOL raised. */
export function sampleCurve(c: CurveConfig, points = 48) {
  const out: { raised: number; price: number }[] = [];
  for (let i = 0; i <= points; i++) {
    const raised = (c.targetSol * i) / points;
    out.push({ raised, price: spotPrice({ ...c, raisedSol: raised }) });
  }
  return out;
}
