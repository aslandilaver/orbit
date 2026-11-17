import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compact notation implemented by hand: Intl's compact output differs between
 * ICU versions (Node vs browsers), which breaks hydration.
 */
function compact(n: number): string {
  const abs = Math.abs(n);
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const v = n / size;
      const str = Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "");
      return `${str}${suffix}`;
    }
  }
  if (abs >= 100) return n.toFixed(0);
  return String(Number(n.toFixed(abs < 10 ? 2 : 1)));
}

const fullUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const intNum = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function subscript(n: number) {
  const map = "₀₁₂₃₄₅₆₇₈₉";
  return String(n)
    .split("")
    .map((d) => map[Number(d)])
    .join("");
}

export const fmt = {
  usdCompact: (n: number) => `${n < 0 ? "-" : ""}$${compact(Math.abs(n))}`,
  usd: (n: number) => fullUsd.format(n),
  compact,
  int: (n: number) => intNum.format(n),
  /** New-token prices are tiny: show significant digits with a zero-count subscript, not fixed decimals. */
  price: (n: number) => {
    if (!Number.isFinite(n) || n <= 0) return "$0.00";
    if (n >= 1) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    if (n >= 0.01) return `$${n.toFixed(4)}`;
    const exp = Math.floor(Math.log10(n));
    const zeros = -exp - 1;
    const digits = Math.round(n * 10 ** (-exp + 3))
      .toString()
      .slice(0, 4);
    return zeros >= 4 ? `$0.0${subscript(zeros)}${digits}` : `$${n.toFixed(zeros + 4)}`;
  },
  sol: (n: number, digits = 4) =>
    `${n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 2 : digits })} SOL`,
  num: (n: number, digits = 2) => n.toLocaleString("en-US", { maximumFractionDigits: digits }),
  pct: (n: number, digits = 1) => `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`,
  pctPlain: (n: number, digits = 1) => `${n.toFixed(digits)}%`,
  age: (minutes: number) => {
    if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
    if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
    if (minutes < 60 * 24 * 30) return `${Math.round(minutes / 60 / 24)}d`;
    return `${Math.round(minutes / 60 / 24 / 30)}mo`;
  },
  address: (a: string, chars = 4) => (a.length <= chars * 2 + 1 ? a : `${a.slice(0, chars)}…${a.slice(-chars)}`),
};

/** Deterministic PRNG — demo data must be identical on server and client to avoid hydration mismatches. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
