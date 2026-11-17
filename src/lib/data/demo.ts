/**
 * DEMO DATASET — not real market data.
 *
 * Deterministic sample data so every surface can be designed and exercised
 * without an indexer. Every value derived here is tagged `source: "demo"` by
 * the provider, and the UI labels it as such. Prices and market caps are
 * computed from the same bonding-curve math the trade panel uses, so the
 * numbers are internally consistent — but none of them describe real tokens.
 */
import { CURVE_PRESETS, spotPrice, type CurvePresetId } from "@/lib/curve";
import { hashString, seeded } from "@/lib/utils";
import type {
  Candle,
  Community,
  EcosystemStats,
  GraduationEvent,
  Holder,
  Token,
  TokenCategory,
  TokenLinks,
  Trade,
} from "./types";

/** Demo reference parameters. Shown in the UI wherever they influence a number. */
export const DEMO_PARAMS = {
  solUsd: 180,
  graduationTargetSol: 85,
  tradeFeeBps: 100,
  totalSupply: 1_000_000_000,
} as const;

interface Seed {
  slug: string;
  name: string;
  ticker: string;
  category: TokenCategory;
  description: string;
  hue: number;
  /** Fraction of graduation target raised; >= 1 means graduated. */
  progress: number;
  ageMinutes: number;
  preset: CurvePresetId;
  community?: boolean;
  pick?: boolean;
  links: TokenLinks;
  mintAuthority?: boolean;
  freezeAuthority?: boolean;
  creatorPct: number;
}

const SEEDS: Seed[] = [
  {
    slug: "lumen",
    name: "Lumen Network",
    ticker: "LUMEN",
    category: "infra",
    description:
      "Light-client relay network for verifiable cross-chain messages. Relayers stake LUMEN and are slashed for invalid proofs.",
    hue: 82,
    progress: 1,
    ageMinutes: 60 * 24 * 41,
    preset: "gentle",
    community: true,
    pick: true,
    links: { website: "https://example.com/lumen", x: "https://x.com/example", discord: "https://discord.gg/example" },
    creatorPct: 5,
  },
  {
    slug: "moss",
    name: "Mossy",
    ticker: "MOSS",
    category: "meme",
    description: "A slow frog with a patient community. No roadmap. Just a pond, a chat, and a long time horizon.",
    hue: 120,
    progress: 0.86,
    ageMinutes: 60 * 31,
    preset: "standard",
    community: true,
    pick: true,
    links: { x: "https://x.com/example", telegram: "https://t.me/example" },
    creatorPct: 2,
  },
  {
    slug: "tide",
    name: "Tidepool",
    ticker: "TIDE",
    category: "defi",
    description:
      "Concentrated liquidity vaults that rebalance on realized volatility. Strategy parameters are set by depositor vote.",
    hue: 190,
    progress: 1,
    ageMinutes: 60 * 24 * 18,
    preset: "standard",
    community: true,
    links: { website: "https://example.com/tide", x: "https://x.com/example", discord: "https://discord.gg/example" },
    creatorPct: 8,
  },
  {
    slug: "prlx",
    name: "Parallax",
    ticker: "PRLX",
    category: "ai",
    description: "Open inference marketplace that matches independent GPU operators with on-chain agents and settles per token.",
    hue: 262,
    progress: 0.64,
    ageMinutes: 60 * 9,
    preset: "gentle",
    community: true,
    pick: true,
    links: { website: "https://example.com/parallax", x: "https://x.com/example" },
    creatorPct: 10,
  },
  {
    slug: "note",
    name: "Fieldnote",
    ticker: "NOTE",
    category: "social",
    description: "Token-gated research notes for on-chain analysts. Holders vote on which reports get commissioned next.",
    hue: 38,
    progress: 0.41,
    ageMinutes: 60 * 14,
    preset: "standard",
    community: true,
    links: { website: "https://example.com/fieldnote", telegram: "https://t.me/example" },
    creatorPct: 6,
  },
  {
    slug: "halc",
    name: "Halcyon",
    ticker: "HALC",
    category: "gaming",
    description: "Persistent space strategy game with player-owned stations and an economy settled on Solana.",
    hue: 220,
    progress: 0.93,
    ageMinutes: 60 * 52,
    preset: "standard",
    community: true,
    links: { website: "https://example.com/halcyon", discord: "https://discord.gg/example" },
    creatorPct: 7,
  },
  {
    slug: "grid",
    name: "Gridline",
    ticker: "GRID",
    category: "depin",
    description: "Community-run energy meters reporting verified rooftop solar output. Operators earn per attested kWh.",
    hue: 52,
    progress: 0.27,
    ageMinutes: 60 * 4.5,
    preset: "gentle",
    community: true,
    links: { website: "https://example.com/gridline" },
    creatorPct: 9,
  },
  {
    slug: "pbl",
    name: "Pebble",
    ticker: "PBL",
    category: "meme",
    description: "It's a pebble. It does not do anything. That is the point.",
    hue: 30,
    progress: 0.08,
    ageMinutes: 38,
    preset: "steep",
    links: { x: "https://x.com/example" },
    creatorPct: 3,
  },
  {
    slug: "arc",
    name: "Arcwell",
    ticker: "ARC",
    category: "defi",
    description: "Fixed-rate lending for SPL tokens with published, deterministic liquidation curves.",
    hue: 168,
    progress: 0.55,
    ageMinutes: 60 * 26,
    preset: "standard",
    links: { website: "https://example.com/arcwell", x: "https://x.com/example" },
    creatorPct: 12,
  },
  {
    slug: "sable",
    name: "Sable Cats",
    ticker: "SABLE",
    category: "meme",
    description: "A collective of black cats. Each new holder is assigned a cat name by the community bot.",
    hue: 300,
    progress: 0.12,
    ageMinutes: 95,
    preset: "steep",
    links: { telegram: "https://t.me/example" },
    mintAuthority: true,
    creatorPct: 18,
  },
  {
    slug: "qrm",
    name: "Quorum Kit",
    ticker: "QRM",
    category: "infra",
    description: "Composable governance modules: snapshot voting, timelocks and treasury streams for SPL communities.",
    hue: 140,
    progress: 1,
    ageMinutes: 60 * 24 * 7,
    preset: "standard",
    community: true,
    links: { website: "https://example.com/quorum", x: "https://x.com/example", discord: "https://discord.gg/example" },
    creatorPct: 6,
  },
  {
    slug: "nwr",
    name: "Northwind Radio",
    ticker: "NWR",
    category: "social",
    description: "A 24/7 community radio station. Holders schedule shows and split listener tips.",
    hue: 8,
    progress: 0.33,
    ageMinutes: 60 * 7,
    preset: "standard",
    links: { website: "https://example.com/northwind" },
    creatorPct: 5,
  },
  {
    slug: "wren",
    name: "Wren",
    ticker: "WREN",
    category: "ai",
    description: "Small on-device agent that signs nothing without an explicit, human-readable confirmation.",
    hue: 96,
    progress: 0.05,
    ageMinutes: 14,
    preset: "standard",
    links: { x: "https://x.com/example" },
    creatorPct: 4,
  },
  {
    slug: "bnfr",
    name: "Bonfire",
    ticker: "BNFR",
    category: "meme",
    description: "Gather round. Every Friday the community burns a portion of the treasury on stream.",
    hue: 18,
    progress: 0.81,
    ageMinutes: 60 * 19,
    preset: "steep",
    pick: true,
    links: { x: "https://x.com/example", telegram: "https://t.me/example" },
    freezeAuthority: true,
    creatorPct: 9,
  },
  {
    slug: "cart",
    name: "Cartograph",
    ticker: "CART",
    category: "depin",
    description: "Street-level map imagery from dashcam contributors, licensed openly to non-commercial projects.",
    hue: 205,
    progress: 0.47,
    ageMinutes: 60 * 33,
    preset: "gentle",
    links: { website: "https://example.com/cartograph", discord: "https://discord.gg/example" },
    creatorPct: 8,
  },
  {
    slug: "odd",
    name: "Oddball",
    ticker: "ODD",
    category: "gaming",
    description: "Weekly physics-puzzle tournaments. Entry fees go to a prize pool held in a public vault.",
    hue: 330,
    progress: 0.19,
    ageMinutes: 60 * 3,
    preset: "standard",
    links: { x: "https://x.com/example", discord: "https://discord.gg/example" },
    creatorPct: 7,
  },
  {
    slug: "bslt",
    name: "Basalt",
    ticker: "BSLT",
    category: "infra",
    description: "Open validator tooling: alerting, vote-credit analytics and automated key rotation.",
    hue: 75,
    progress: 1,
    ageMinutes: 60 * 24 * 64,
    preset: "gentle",
    links: { website: "https://example.com/basalt", x: "https://x.com/example" },
    creatorPct: 4,
  },
  {
    slug: "velv",
    name: "Velvet Hound",
    ticker: "VELV",
    category: "meme",
    description: "A very good dog in a very nice coat.",
    hue: 345,
    progress: 0.71,
    ageMinutes: 60 * 11,
    preset: "standard",
    links: { x: "https://x.com/example" },
    creatorPct: 3,
  },
  {
    slug: "leaf",
    name: "Mintleaf",
    ticker: "LEAF",
    category: "social",
    description: "Direct creator tips with on-chain receipts. Holders curate the weekly featured creators list.",
    hue: 150,
    progress: 0.03,
    ageMinutes: 6,
    preset: "standard",
    links: { website: "https://example.com/mintleaf" },
    creatorPct: 6,
  },
  {
    slug: "strt",
    name: "Stratus Compute",
    ticker: "STRT",
    category: "ai",
    description: "Spot GPU capacity aggregated from idle research clusters, priced by an open auction.",
    hue: 240,
    progress: 0.89,
    ageMinutes: 60 * 40,
    preset: "gentle",
    links: { website: "https://example.com/stratus", x: "https://x.com/example" },
    creatorPct: 10,
  },
  {
    slug: "drift",
    name: "Driftwood",
    ticker: "DRIFT",
    category: "meme",
    description: "Washed up on the shore of the timeline. Still floating.",
    hue: 44,
    progress: 0.22,
    ageMinutes: 60 * 2,
    preset: "steep",
    links: { telegram: "https://t.me/example" },
    creatorPct: 5,
  },
  {
    slug: "kettle",
    name: "Kettle",
    ticker: "KTL",
    category: "meme",
    description: "Always about to boil.",
    hue: 12,
    progress: 0.58,
    ageMinutes: 60 * 6,
    preset: "standard",
    links: { x: "https://x.com/example" },
    creatorPct: 4,
  },
];

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function fakeWallet(rand: () => number) {
  let s = "";
  for (let i = 0; i < 44; i++) s += BASE58[Math.floor(rand() * BASE58.length)];
  return s;
}

function buildToken(seed: Seed): Token {
  const rand = seeded(hashString(seed.slug));
  const preset = CURVE_PRESETS[seed.preset];
  const supply = DEMO_PARAMS.totalSupply;
  const curvePct = preset.curveShare * 100;
  const remainder = 100 - curvePct - seed.creatorPct;
  const treasury = Math.round(remainder * 0.5 * 10) / 10;
  const community = Math.round((remainder - treasury) * 10) / 10;

  const graduated = seed.progress >= 1;
  const raisedSol = Math.min(1, seed.progress) * DEMO_PARAMS.graduationTargetSol;
  const curve = {
    virtualSol: preset.virtualSol,
    curveTokens: supply * preset.curveShare,
    totalSupply: supply,
    targetSol: DEMO_PARAMS.graduationTargetSol,
    feeBps: DEMO_PARAMS.tradeFeeBps,
    raisedSol,
  };

  // Graduated tokens trade in an external pool; model drift from the final curve price.
  const postGradMultiplier = graduated ? 0.7 + rand() * 3.2 : 1;
  const priceSol = spotPrice(curve) * postGradMultiplier;
  const priceUsd = priceSol * DEMO_PARAMS.solUsd;
  const marketCapUsd = priceUsd * supply;
  const liquidityUsd = graduated
    ? DEMO_PARAMS.graduationTargetSol * DEMO_PARAMS.solUsd * 2 * Math.sqrt(postGradMultiplier)
    : raisedSol * DEMO_PARAMS.solUsd;

  const activity = 0.25 + rand() * 2.4;
  const volume24hUsd = marketCapUsd * activity * (seed.ageMinutes < 60 * 24 ? 1 : 0.35);
  const change24h = graduated ? (rand() - 0.45) * 60 : (rand() - 0.25) * (seed.ageMinutes < 60 * 24 ? 220 : 80);
  const holders = Math.round(18 + raisedSol * (9 + rand() * 14) + (graduated ? 1200 + rand() * 4200 : 0));

  const status: Token["status"] = graduated
    ? "graduated"
    : seed.progress >= 0.8
      ? "graduating"
      : seed.ageMinutes < 6 * 60 && seed.progress < 0.15
        ? "new"
        : "bonding";

  const topHolderPct = 1.5 + rand() * (seed.mintAuthority ? 22 : 7);
  const top10Pct = topHolderPct + 8 + rand() * 18;

  return {
    address: `demo-${seed.slug}`,
    isDemo: true,
    name: seed.name,
    ticker: seed.ticker,
    category: seed.category,
    description: seed.description,
    hue: seed.hue,
    ageMinutes: seed.ageMinutes,
    priceUsd,
    marketCapUsd,
    liquidityUsd,
    volume24hUsd,
    change24h,
    holders,
    status,
    communityPick: Boolean(seed.pick),
    communitySlug: seed.community ? seed.slug : undefined,
    links: seed.links,
    tokenomics: { curve: curvePct, creator: seed.creatorPct, community, treasury },
    curve,
    risk: {
      mintAuthorityActive: Boolean(seed.mintAuthority),
      freezeAuthorityActive: Boolean(seed.freezeAuthority),
      topHolderPct,
      top10Pct,
      creatorPct: seed.creatorPct,
    },
    creator: fakeWallet(rand),
    graduatedAgeMinutes: graduated ? Math.round(seed.ageMinutes * (0.4 + rand() * 0.4)) : undefined,
  };
}

export const DEMO_TOKENS: Token[] = SEEDS.map(buildToken);

const UPDATES: Record<string, Community["updates"]> = {
  lumen: [
    {
      id: "l1",
      kind: "milestone",
      title: "Relayer set expanded to 48 operators",
      body: "Twelve new independent operators completed the staking onboarding this week. Proof latency p95 is down to 2.1s.",
      ageMinutes: 60 * 20,
    },
    {
      id: "l2",
      kind: "update",
      title: "Audit scope published",
      body: "The scope for the second light-client audit is public. Comments are open in the forum until Friday.",
      ageMinutes: 60 * 24 * 3,
    },
    {
      id: "l3",
      kind: "announcement",
      title: "Graduated to external liquidity",
      body: "LUMEN completed its bonding curve. Liquidity details and pool addresses are listed on the token page.",
      ageMinutes: 60 * 24 * 22,
    },
  ],
  moss: [
    {
      id: "m1",
      kind: "announcement",
      title: "Pond meeting, Thursday 18:00 UTC",
      body: "Voice chat in Telegram. Agenda: sticker pack, a name for the frog, and whether we need a website (we don't).",
      ageMinutes: 60 * 3,
    },
    {
      id: "m2",
      kind: "milestone",
      title: "86% of the way to graduation",
      body: "Thanks to everyone being patient. No one is in a hurry here.",
      ageMinutes: 60 * 6,
    },
  ],
  tide: [
    {
      id: "t1",
      kind: "update",
      title: "Vault v2 parameters proposed",
      body: "A draft of the volatility bands for the SOL/USDC vault is up for discussion. No vote has been opened yet.",
      ageMinutes: 60 * 30,
    },
    {
      id: "t2",
      kind: "update",
      title: "Monthly transparency report",
      body: "Treasury holdings, contributor payments and vault performance for last month, with transaction links.",
      ageMinutes: 60 * 24 * 9,
    },
  ],
  prlx: [
    {
      id: "p1",
      kind: "announcement",
      title: "Operator testnet opens",
      body: "GPU operators can register on devnet. Rewards on devnet have no value; this is for load testing only.",
      ageMinutes: 60 * 2,
    },
    {
      id: "p2",
      kind: "update",
      title: "Architecture notes",
      body: "How job routing, attestation and settlement fit together. Feedback from operators is especially welcome.",
      ageMinutes: 60 * 8,
    },
  ],
  note: [
    {
      id: "n1",
      kind: "update",
      title: "Report: validator client diversity",
      body: "The first commissioned report is out to holders. A public summary follows in two weeks.",
      ageMinutes: 60 * 10,
    },
  ],
  halc: [
    {
      id: "h1",
      kind: "milestone",
      title: "Season one map revealed",
      body: "Forty sectors, six contested. Station ownership snapshots will be taken at graduation.",
      ageMinutes: 60 * 12,
    },
    {
      id: "h2",
      kind: "update",
      title: "Playtest feedback round",
      body: "We collected 340 responses. The top three requests and what we plan to change are in Discord.",
      ageMinutes: 60 * 40,
    },
  ],
  grid: [
    {
      id: "g1",
      kind: "announcement",
      title: "Meter hardware spec v0.3",
      body: "Open hardware files are published. We are looking for ten pilot installers in Europe.",
      ageMinutes: 60 * 3,
    },
  ],
  qrm: [
    {
      id: "q1",
      kind: "update",
      title: "Timelock module released",
      body: "Configurable delays for treasury actions, with a public queue anyone can monitor.",
      ageMinutes: 60 * 24 * 2,
    },
    {
      id: "q2",
      kind: "milestone",
      title: "Graduated",
      body: "QRM completed its bonding curve. Thank you to the 1,900 wallets who got us here.",
      ageMinutes: 60 * 24 * 4,
    },
  ],
};

const TAGLINES: Record<string, string> = {
  lumen: "Verifiable messaging between chains.",
  moss: "Patience is a strategy.",
  tide: "Liquidity that adapts.",
  prlx: "Open inference, settled on-chain.",
  note: "Research, commissioned by holders.",
  halc: "A galaxy owned by its players.",
  grid: "Energy data from the rooftops up.",
  qrm: "Governance building blocks for communities.",
};

export const DEMO_COMMUNITIES: Community[] = DEMO_TOKENS.filter((t) => t.communitySlug).map((t) => {
  const rand = seeded(hashString(`community-${t.communitySlug}`));
  const slug = t.communitySlug!;
  return {
    slug,
    name: t.name,
    tagline: TAGLINES[slug] ?? t.description,
    about: t.description,
    tokenAddress: t.address,
    members: Math.round(t.holders * (1.4 + rand() * 1.6)),
    activeWallets7d: Math.round(t.holders * (0.2 + rand() * 0.35)),
    featured: ["lumen", "moss", "prlx", "halc"].includes(slug),
    links: t.links,
    updates: UPDATES[slug] ?? [],
  };
});

export function demoTrades(token: Token, count = 24): Trade[] {
  const rand = seeded(hashString(`trades-${token.address}`));
  const price = token.priceUsd / DEMO_PARAMS.solUsd;
  const trades: Trade[] = [];
  let age = rand() * 3;
  for (let i = 0; i < count; i++) {
    const side = rand() > (token.change24h > 0 ? 0.36 : 0.56) ? "buy" : "sell";
    const sol = Math.round((0.05 + rand() ** 2.2 * 6) * 1000) / 1000;
    trades.push({
      id: `${token.address}-${i}`,
      side,
      wallet: fakeWallet(rand),
      sol,
      tokens: sol / price,
      ageMinutes: age,
    });
    age += rand() * (token.ageMinutes < 120 ? 3 : 18);
  }
  return trades;
}

export function demoHolders(token: Token): Holder[] {
  const rand = seeded(hashString(`holders-${token.address}`));
  const holders: Holder[] = [];
  if (token.status !== "graduated") {
    const unsold = (1 - token.curve.raisedSol / token.curve.targetSol) * token.tokenomics.curve;
    holders.push({ label: "Bonding curve", wallet: "curve", pct: unsold, kind: "curve" });
  } else {
    holders.push({ label: "Liquidity pool", wallet: "pool", pct: 6 + rand() * 8, kind: "curve" });
  }
  holders.push({ label: "Creator", wallet: token.creator, pct: token.tokenomics.creator, kind: "creator" });
  holders.push({ label: "Treasury", wallet: fakeWallet(rand), pct: token.tokenomics.treasury, kind: "treasury" });
  holders.push({ label: "Community fund", wallet: fakeWallet(rand), pct: token.tokenomics.community, kind: "community" });
  let remaining = token.risk.top10Pct;
  holders.push({ label: "Holder", wallet: fakeWallet(rand), pct: token.risk.topHolderPct, kind: "holder" });
  remaining -= token.risk.topHolderPct;
  for (let i = 0; i < 6; i++) {
    const share = remaining * (0.18 + rand() * 0.18);
    remaining -= share;
    holders.push({ label: "Holder", wallet: fakeWallet(rand), pct: share, kind: "holder" });
  }
  return holders.sort((a, b) => b.pct - a.pct);
}

/** Synthetic candles ending at the token's current price. Clearly labeled as demo in the UI. */
export function demoCandles(token: Token, count = 120): Candle[] {
  const rand = seeded(hashString(`candles-${token.address}`));
  const end = token.priceUsd;
  const start = end / (1 + token.change24h / 100) || end;
  // Walk backwards from the current price so the last candle matches the displayed price.
  const closes: number[] = new Array(count);
  closes[count - 1] = end;
  const drift = Math.log(end / start) / count;
  for (let i = count - 2; i >= 0; i--) {
    const shock = (rand() - 0.5) * 0.09;
    closes[i] = closes[i + 1]! / Math.exp(drift + shock);
  }
  // Fixed epoch keeps server and client output identical.
  const epoch = 1_763_000_000;
  const step = 15 * 60;
  return closes.map((close, i) => {
    const open = i === 0 ? close * (1 + (rand() - 0.5) * 0.04) : closes[i - 1]!;
    const hi = Math.max(open, close) * (1 + rand() * 0.035);
    const lo = Math.min(open, close) * (1 - rand() * 0.035);
    return { time: epoch + i * step, open, high: hi, low: lo, close };
  });
}

export function demoGraduationHistory(token: Token): GraduationEvent[] {
  const p = token.curve.raisedSol / token.curve.targetSol;
  // Milestones are interpolated between launch and the latest reached point
  // (graduation, or "now" at current progress) so the timeline stays ordered.
  const endAge = token.graduatedAgeMinutes ?? 0;
  const endFrac = token.status === "graduated" ? 1 : Math.max(p, 1e-6);
  const at = (frac: number) =>
    p >= frac ? Math.round(token.ageMinutes - (token.ageMinutes - endAge) * (frac / endFrac)) : null;
  return [
    { label: "Launched", detail: "Mint created, curve opened", ageMinutes: token.ageMinutes, reached: true },
    { label: "25% raised", detail: `${(token.curve.targetSol * 0.25).toFixed(1)} SOL`, ageMinutes: at(0.25), reached: p >= 0.25 },
    { label: "50% raised", detail: `${(token.curve.targetSol * 0.5).toFixed(1)} SOL`, ageMinutes: at(0.5), reached: p >= 0.5 },
    {
      label: "Graduation ready",
      detail: `${(token.curve.targetSol * 0.8).toFixed(1)} SOL — 80% of target`,
      ageMinutes: at(0.8),
      reached: p >= 0.8,
    },
    {
      label: "Graduated",
      detail: `${token.curve.targetSol} SOL target reached`,
      ageMinutes: token.graduatedAgeMinutes ?? null,
      reached: token.status === "graduated",
    },
  ];
}

export function demoEcosystemStats(): EcosystemStats {
  return {
    launched: DEMO_TOKENS.length,
    volume24hUsd: DEMO_TOKENS.reduce((s, t) => s + t.volume24hUsd, 0),
    activeCommunities: DEMO_COMMUNITIES.length,
    graduated: DEMO_TOKENS.filter((t) => t.status === "graduated").length,
  };
}
