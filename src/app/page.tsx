import { ArrowRight, ArrowUpRight, Eye, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { OrbitVisual } from "@/components/brand/orbit-visual";
import { CurveProgress, StatusBadge, TokenAvatar } from "@/components/token/token-bits";
import { TokenCard } from "@/components/token/token-card";
import { ButtonLink } from "@/components/ui/button";
import { SourceBadge } from "@/components/ui/data-source";
import { FadeIn } from "@/components/ui/fade-in";
import { SectionHeader } from "@/components/ui/primitives";
import { progress } from "@/lib/curve";
import { DEMO_PARAMS } from "@/lib/data/demo";
import { getCommunities, getEcosystemStats, getToken, getTokens } from "@/lib/data/provider";
import { fmt } from "@/lib/utils";

const STEPS = [
  {
    n: "01",
    title: "Create",
    body: "Launch your token with customizable parameters: supply, allocations, curve shape and graduation threshold.",
    points: ["Validated tokenomics that add up to 100%", "Mint authority revoked at launch", "No freeze authority"],
  },
  {
    n: "02",
    title: "Unite",
    body: "Bring your community together and grow organically, with a public profile, updates, and holder data.",
    points: ["Community profile and announcements", "Transparent holder distribution", "Risk flags visible to everyone"],
  },
  {
    n: "03",
    title: "Graduate",
    body: "Progress from launch to a deeper liquidity ecosystem once the curve reaches its published threshold.",
    points: ["Threshold set and shown at launch", "Progress tracked in SOL, not hype", "Migration via a Meteora adapter"],
  },
];

export default function HomePage() {
  const stats = getEcosystemStats();
  const tokens = getTokens();
  const trending = [...tokens.data]
    .filter((t) => t.status !== "graduated")
    .sort((a, b) => b.volume24hUsd - a.volume24hUsd)
    .slice(0, 6);
  const communities = getCommunities().data.filter((c) => c.featured);

  return (
    <>
      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="grid-backdrop pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_40%,black,transparent)]"
        />
        <div className="container-page relative grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <FadeIn>
            <div className="eyebrow flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-accent" />
              The Solana Community Launchpad
            </div>
            <h1 className="mt-6 max-w-[14ch] text-[40px] leading-[1.04] font-medium tracking-[-0.035em] text-balance text-fg sm:text-[52px] lg:text-[58px]">
              Where Communities Become Ecosystems.
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-fg-2">
              Launch your token, bring your community together, and build something that lasts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/launch" variant="primary" size="lg">
                Launch a Token
                <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/explore" variant="outline" size="lg">
                Explore Projects
              </ButtonLink>
            </div>
            <ul className="mt-12 grid max-w-lg gap-3 text-[13px] text-fg-2 sm:grid-cols-3 sm:gap-5">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-fg-3" />
                Every transaction approved in your wallet
              </li>
              <li className="flex items-start gap-2">
                <Eye className="mt-0.5 size-3.5 shrink-0 text-fg-3" />
                Mint and freeze authority checks
              </li>
              <li className="flex items-start gap-2">
                <Users className="mt-0.5 size-3.5 shrink-0 text-fg-3" />
                Published graduation thresholds
              </li>
            </ul>
          </FadeIn>
          <FadeIn delay={0.1} className="relative mx-auto w-full max-w-[520px]">
            <OrbitVisual className="h-auto w-full" />
          </FadeIn>
        </div>
      </section>

      {/* ─── A. Live ecosystem ──────────────────────────────── */}
      <section className="container-page pt-16 sm:pt-20" aria-labelledby="eco-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="eco-title" className="eyebrow">
            Ecosystem
          </h2>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-fg-3 sm:inline">No indexer connected — showing bundled sample data</span>
            <SourceBadge source={stats.source} />
          </div>
        </div>
        <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-bg-2 lg:grid-cols-4">
          {[
            { label: "Tokens launched", value: fmt.int(stats.data.launched) },
            { label: "Ecosystem volume (24h)", value: fmt.usdCompact(stats.data.volume24hUsd) },
            { label: "Active communities", value: fmt.int(stats.data.activeCommunities) },
            { label: "Graduated projects", value: fmt.int(stats.data.graduated) },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`px-5 py-6 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
            >
              <dt className="text-xs text-fg-3">{s.label}</dt>
              <dd className="mt-2 font-mono text-2xl tracking-tight text-fg tabular sm:text-[28px]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ─── B. Trending ────────────────────────────────────── */}
      <section className="container-page pt-20 sm:pt-24" aria-labelledby="trending-title">
        <SectionHeader
          eyebrow="Trending"
          title={<span id="trending-title">Projects gaining momentum</span>}
          description="Ranked by 24h volume among tokens still on their bonding curve."
          action={
            <div className="flex items-center gap-3">
              <SourceBadge source={tokens.source} />
              <ButtonLink href="/explore" variant="ghost" size="sm">
                View all <ArrowRight />
              </ButtonLink>
            </div>
          }
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((t) => (
            <TokenCard key={t.address} token={t} />
          ))}
        </div>
      </section>

      {/* ─── C. How it works ────────────────────────────────── */}
      <section className="container-page pt-20 sm:pt-28" aria-labelledby="how-title">
        <SectionHeader
          eyebrow="How ORBIT works"
          title={<span id="how-title">Three stages. Every one of them visible.</span>}
          description="A token's path from launch to graduation is public, measured in SOL, and governed by parameters set before the first trade."
        />
        <ol className="mt-10 grid overflow-hidden rounded-lg border border-line md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n} className={`bg-bg-2 p-6 sm:p-7 ${i > 0 ? "border-t border-line md:border-t-0 md:border-l" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-accent">{s.n}</span>
                <span className="h-px flex-1 bg-line-2" aria-hidden />
              </div>
              <h3 className="mt-6 text-lg font-medium text-fg">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-fg-2">{s.body}</p>
              <ul className="mt-6 flex flex-col gap-2">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[13px] text-fg-2">
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-fg-3" />
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── D. Featured communities ────────────────────────── */}
      <section className="container-page pt-20 sm:pt-28" aria-labelledby="communities-title">
        <SectionHeader
          eyebrow="Featured communities"
          title={<span id="communities-title">Built in public, by holders</span>}
          action={
            <ButtonLink href="/community" variant="ghost" size="sm">
              All communities <ArrowRight />
            </ButtonLink>
          }
        />
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {communities.map((c) => {
            const token = getToken(c.tokenAddress)?.data;
            if (!token) return null;
            const latest = c.updates[0];
            return (
              <Link
                key={c.slug}
                href={`/community/${c.slug}`}
                className="group flex flex-col rounded-lg border border-line bg-bg-2 p-5 transition-colors hover:border-line-3"
              >
                <div className="flex items-start gap-3.5">
                  <TokenAvatar name={token.name} ticker={token.ticker} hue={token.hue} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-fg">{c.name}</span>
                      <span className="font-mono text-xs text-fg-3">${token.ticker}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-fg-2">{c.tagline}</p>
                  </div>
                  <ArrowUpRight className="size-4 text-fg-3 transition-colors group-hover:text-fg" />
                </div>
                <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-fg-2">{c.about}</p>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-xs">
                  <div>
                    <div className="text-fg-3">Members</div>
                    <div className="mt-0.5 font-mono text-fg tabular">{fmt.compact(c.members)}</div>
                  </div>
                  <div>
                    <div className="text-fg-3">Holders</div>
                    <div className="mt-0.5 font-mono text-fg tabular">{fmt.compact(token.holders)}</div>
                  </div>
                  <div>
                    <div className="text-fg-3">Stage</div>
                    <div className="mt-1">
                      <StatusBadge status={token.status} />
                    </div>
                  </div>
                </div>
                <CurveProgress className="mt-4" value={progress(token.curve)} graduated={token.status === "graduated"} />
                {latest && (
                  <div className="mt-4 truncate text-xs text-fg-3">
                    Latest: <span className="text-fg-2">{latest.title}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-fg-3">
          Communities and figures above are demo data. Demo prices assume 1 SOL = ${DEMO_PARAMS.solUsd}.
        </p>
      </section>

      {/* ─── E. Final CTA ───────────────────────────────────── */}
      <section className="container-page pt-20 sm:pt-28">
        <div className="relative overflow-hidden rounded-lg border border-line bg-bg-2 px-6 py-14 sm:px-12 sm:py-16">
          <svg
            aria-hidden
            viewBox="0 0 400 400"
            className="pointer-events-none absolute top-1/2 -right-64 h-[520px] w-[520px] -translate-y-1/2 opacity-40 sm:-right-24 sm:opacity-60 lg:-right-10"
          >
            {[60, 110, 160, 198].map((r) => (
              <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="var(--color-line-2)" />
            ))}
            <circle cx="200" cy="200" r="5" fill="var(--color-accent)" />
            <circle cx="313" cy="87" r="3.5" fill="var(--color-fg-2)" />
          </svg>
          <div className="relative max-w-md">
            <h2 className="text-[28px] leading-tight font-medium tracking-[-0.025em] text-fg sm:text-[34px]">
              Your community. Your orbit.
            </h2>
            <p className="mt-3 text-[15px] text-fg-2">
              Set your parameters, review every cost, and approve the launch from your own wallet.
            </p>
            <ButtonLink href="/launch" variant="primary" size="lg" className="mt-8">
              Start a Launch
              <ArrowRight />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
