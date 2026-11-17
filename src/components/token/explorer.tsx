"use client";

import { ArrowDown, ArrowUp, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SourceBadge } from "@/components/ui/data-source";
import { inputClass } from "@/components/ui/form";
import { EmptyState, Kbd } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/segmented";
import { progress } from "@/lib/curve";
import { CATEGORY_LABEL, type DataSource, type Token, type TokenCategory } from "@/lib/data/types";
import { cn, fmt } from "@/lib/utils";
import { Change, CurveProgress, StatusBadge, TokenAvatar } from "./token-bits";

type Tab = "trending" | "new" | "graduating" | "graduated" | "picks";
type Sort = "trending" | "newest" | "volume" | "gainers" | "losers";

const TABS: { value: Tab; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "new", label: "New" },
  { value: "graduating", label: "Graduating" },
  { value: "graduated", label: "Graduated" },
  { value: "picks", label: "Community Picks" },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "volume", label: "Highest volume" },
  { value: "gainers", label: "Biggest gainers" },
  { value: "losers", label: "Biggest losers" },
];

const MCAP = {
  any: { label: "Any", test: () => true },
  lt25: { label: "Under $25K", test: (t: Token) => t.marketCapUsd < 25_000 },
  "25to100": { label: "$25K – $100K", test: (t: Token) => t.marketCapUsd >= 25_000 && t.marketCapUsd < 100_000 },
  gt100: { label: "Over $100K", test: (t: Token) => t.marketCapUsd >= 100_000 },
} as const;

const VOLUME = {
  any: { label: "Any", test: () => true },
  gt10: { label: "Over $10K", test: (t: Token) => t.volume24hUsd >= 10_000 },
  gt50: { label: "Over $50K", test: (t: Token) => t.volume24hUsd >= 50_000 },
} as const;

const AGE = {
  any: { label: "Any", test: () => true },
  lt1h: { label: "Under 1 hour", test: (t: Token) => t.ageMinutes < 60 },
  lt24h: { label: "Under 24 hours", test: (t: Token) => t.ageMinutes < 60 * 24 },
  lt7d: { label: "Under 7 days", test: (t: Token) => t.ageMinutes < 60 * 24 * 7 },
  gt7d: { label: "Over 7 days", test: (t: Token) => t.ageMinutes >= 60 * 24 * 7 },
} as const;

const PROGRESS = {
  any: { label: "Any", test: () => true },
  early: { label: "0 – 25%", test: (t: Token) => progress(t.curve) < 0.25 },
  mid: { label: "25 – 80%", test: (t: Token) => progress(t.curve) >= 0.25 && progress(t.curve) < 0.8 },
  late: { label: "80 – 99%", test: (t: Token) => progress(t.curve) >= 0.8 && t.status !== "graduated" },
  done: { label: "Complete", test: (t: Token) => t.status === "graduated" },
} as const;

type FilterState = {
  mcap: keyof typeof MCAP;
  volume: keyof typeof VOLUME;
  age: keyof typeof AGE;
  progress: keyof typeof PROGRESS;
  category: TokenCategory | "all";
};

const DEFAULT_FILTERS: FilterState = { mcap: "any", volume: "any", age: "any", progress: "any", category: "all" };

/** Trending score: volume relative to market cap, boosted for recency and momentum. */
function trendScore(t: Token) {
  const turnover = t.volume24hUsd / Math.max(1, t.marketCapUsd);
  const recency = 1 / Math.log10(10 + t.ageMinutes / 60);
  return turnover * recency * (1 + Math.max(0, t.change24h) / 200) * Math.log10(10 + t.volume24hUsd);
}

function Select<K extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: K;
  onChange: (v: K) => void;
  options: { value: K; label: string }[];
}) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs text-fg-3">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as K)}
        className={cn(inputClass, "h-9 cursor-pointer appearance-none bg-[length:12px] pr-8 text-[13px]")}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23626a63' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const entries = <T extends Record<string, { label: string }>>(o: T) =>
  (Object.keys(o) as (keyof T & string)[]).map((k) => ({ value: k, label: o[k]!.label }));

export function TokenExplorer({ tokens, source }: { tokens: Token[]; source: DataSource }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const initialTab = (TABS.find((t) => t.value === params.get("tab"))?.value ?? "trending") as Tab;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<Sort>((SORTS.find((s) => s.value === params.get("sort"))?.value ?? "trending") as Sort);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const deferredQuery = useDeferredValue(query);

  // Keep tab / search / sort in the URL so views can be shared and survive reloads.
  useEffect(() => {
    const sp = new URLSearchParams();
    if (tab !== "trending") sp.set("tab", tab);
    if (deferredQuery.trim()) sp.set("q", deferredQuery.trim());
    if (sort !== "trending") sp.set("sort", sort);
    const next = sp.toString();
    if (next !== params.toString()) router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [tab, deferredQuery, sort, pathname, router, params]);

  // "/" focuses search, like most data tools.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        e.preventDefault();
        document.getElementById("token-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeFilterCount = (Object.keys(filters) as (keyof FilterState)[]).filter(
    (k) => filters[k] !== DEFAULT_FILTERS[k],
  ).length;

  const tabCounts = useMemo(
    () => ({
      trending: tokens.length,
      new: tokens.filter((t) => t.ageMinutes < 60 * 24).length,
      graduating: tokens.filter((t) => t.status === "graduating").length,
      graduated: tokens.filter((t) => t.status === "graduated").length,
      picks: tokens.filter((t) => t.communityPick).length,
    }),
    [tokens],
  );

  const rows = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase().replace(/^\$/, "");
    let list = tokens.filter((t) => {
      if (tab === "new" && t.ageMinutes >= 60 * 24) return false;
      if (tab === "graduating" && t.status !== "graduating") return false;
      if (tab === "graduated" && t.status !== "graduated") return false;
      if (tab === "picks" && !t.communityPick) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.ticker.toLowerCase().includes(q) && !t.address.toLowerCase().includes(q))
        return false;
      if (filters.category !== "all" && t.category !== filters.category) return false;
      return (
        MCAP[filters.mcap].test(t) &&
        VOLUME[filters.volume].test(t) &&
        AGE[filters.age].test(t) &&
        PROGRESS[filters.progress].test(t)
      );
    });
    const by: Record<Sort, (a: Token, b: Token) => number> = {
      trending: (a, b) => trendScore(b) - trendScore(a),
      newest: (a, b) => a.ageMinutes - b.ageMinutes,
      volume: (a, b) => b.volume24hUsd - a.volume24hUsd,
      gainers: (a, b) => b.change24h - a.change24h,
      losers: (a, b) => a.change24h - b.change24h,
    };
    list = [...list].sort(by[sort]);
    return list;
  }, [tokens, tab, deferredQuery, filters, sort]);

  const set = <K extends keyof FilterState>(k: K) => (v: FilterState[K]) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <Tabs
        label="Token lists"
        idPrefix="explore"
        value={tab}
        onChange={setTab}
        items={TABS.map((t) => ({ ...t, count: tabCounts[t.value] }))}
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-3" aria-hidden />
          <input
            id="token-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ticker or address"
            aria-label="Search tokens"
            autoComplete="off"
            className={cn(inputClass, "h-9 pr-10 pl-9 text-[13px]")}
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 sm:block">
            <Kbd>/</Kbd>
          </span>
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className={cn(inputClass, "h-9 w-full cursor-pointer text-[13px] sm:w-44")}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <Button
            variant={showFilters || activeFilterCount ? "secondary" : "outline"}
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
            className="shrink-0"
          >
            <SlidersHorizontal />
            Filters
            {activeFilterCount > 0 && (
              <span className="grid size-4.5 place-items-center rounded-full bg-accent font-mono text-[10px] text-accent-fg">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div id="filter-panel" className="mt-3 rounded-lg border border-line bg-bg-2 p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Select id="f-mcap" label="Market cap" value={filters.mcap} onChange={set("mcap")} options={entries(MCAP)} />
            <Select id="f-vol" label="24h volume" value={filters.volume} onChange={set("volume")} options={entries(VOLUME)} />
            <Select id="f-age" label="Age" value={filters.age} onChange={set("age")} options={entries(AGE)} />
            <Select
              id="f-progress"
              label="Curve progress"
              value={filters.progress}
              onChange={set("progress")}
              options={entries(PROGRESS)}
            />
            <Select
              id="f-cat"
              label="Category"
              value={filters.category}
              onChange={set("category")}
              options={[
                { value: "all" as const, label: "All categories" },
                ...(Object.keys(CATEGORY_LABEL) as TokenCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
              ]}
            />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs text-fg-3">
              {activeFilterCount ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active` : "No filters applied"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)} disabled={!activeFilterCount}>
              <X />
              Reset
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-fg-3">
        <span aria-live="polite">
          {rows.length} {rows.length === 1 ? "token" : "tokens"}
        </span>
        <SourceBadge source={source} />
      </div>

      <div className="mt-2 overflow-hidden rounded-lg border border-line bg-bg-2">
        {rows.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title="No tokens match"
            description="Try a different search, or clear filters to see every token in this list."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setQuery("");
                  setFilters(DEFAULT_FILTERS);
                }}
              >
                Clear search and filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-xs text-fg-3">
                  <th scope="col" className="w-10 py-2.5 pl-4 font-normal">
                    #
                  </th>
                  <th scope="col" className="py-2.5 font-normal">
                    Token
                  </th>
                  <SortHeader label="Price" />
                  <SortHeader label="Market cap" />
                  <SortHeader
                    label="24h volume"
                    active={sort === "volume"}
                    dir="desc"
                    onClick={() => setSort(sort === "volume" ? "trending" : "volume")}
                  />
                  <SortHeader
                    label="24h"
                    active={sort === "gainers" || sort === "losers"}
                    dir={sort === "losers" ? "asc" : "desc"}
                    onClick={() => setSort(sort === "gainers" ? "losers" : "gainers")}
                  />
                  <SortHeader label="Holders" />
                  <th scope="col" className="w-44 py-2.5 pl-6 font-normal">
                    Bonding curve
                  </th>
                  <th scope="col" className="py-2.5 pr-4 pl-4 font-normal">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t, i) => (
                  <tr
                    key={t.address}
                    onClick={() => router.push(`/token/${t.address}`)}
                    className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-surface"
                  >
                    <td className="py-3 pl-4 font-mono text-xs text-fg-3 tabular">{i + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <TokenAvatar name={t.name} ticker={t.ticker} hue={t.hue} size={30} />
                        <div className="min-w-0">
                          <Link
                            href={`/token/${t.address}`}
                            className="block truncate font-medium text-fg hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-fg-3">
                            <span className="font-mono">${t.ticker}</span>
                            <span aria-hidden>·</span>
                            <span>{fmt.age(t.ageMinutes)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pl-4 text-right font-mono text-fg tabular">{fmt.price(t.priceUsd)}</td>
                    <td className="py-3 pl-4 text-right font-mono text-fg tabular">{fmt.usdCompact(t.marketCapUsd)}</td>
                    <td className="py-3 pl-4 text-right font-mono text-fg-2 tabular">{fmt.usdCompact(t.volume24hUsd)}</td>
                    <td className="py-3 pl-4 text-right">
                      <Change value={t.change24h} className="justify-end text-[13px]" />
                    </td>
                    <td className="py-3 pl-4 text-right font-mono text-fg-2 tabular">{fmt.int(t.holders)}</td>
                    <td className="py-3 pl-6">
                      <CurveProgress value={progress(t.curve)} graduated={t.status === "graduated"} />
                    </td>
                    <td className="py-3 pr-4 pl-4">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active?: boolean;
  dir?: "asc" | "desc";
  onClick?: () => void;
}) {
  const ariaSort = active ? (dir === "asc" ? "ascending" : "descending") : undefined;
  return (
    <th scope="col" aria-sort={ariaSort} className="py-2.5 pl-4 text-right font-normal">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={cn("inline-flex items-center gap-1 hover:text-fg", active && "text-fg")}
        >
          {label}
          {active && (dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
        </button>
      ) : (
        label
      )}
    </th>
  );
}
