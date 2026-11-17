import type { Metadata } from "next";
import { ChevronLeft, FlaskConical, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OnchainTokenView } from "@/components/token/onchain-view";
import { GraduationPanel, RiskPanel, TokenomicsBreakdown } from "@/components/token/panels";
import { PriceChart } from "@/components/token/price-chart";
import { SocialLinks } from "@/components/token/social-links";
import { Change, StatusBadge, TokenAvatar } from "@/components/token/token-bits";
import { TokenActivity } from "@/components/token/token-sections";
import { TradePanel } from "@/components/token/trade-panel";
import { ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { getToken, getTokenMarket, isDemoAddress } from "@/lib/data/provider";
import { CATEGORY_LABEL } from "@/lib/data/types";
import { assessRisk } from "@/lib/risk";
import { parsePublicKey } from "@/lib/solana/inspect";
import { fmt } from "@/lib/utils";

type Props = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const t = getToken(address)?.data;
  return { title: t ? `${t.name} ($${t.ticker})` : `Token ${fmt.address(address)}` };
}

export default async function TokenPage({ params }: Props) {
  const { address } = await params;
  const found = getToken(address);

  if (!found) {
    // Not in the dataset: if it's a valid Solana address, read it from the chain.
    if (!isDemoAddress(address) && parsePublicKey(address)) return <OnchainTokenView address={address} />;
    notFound();
  }

  const token = found.data;
  const market = getTokenMarket(token);
  const flags = assessRisk({
    ...token.risk,
    holders: token.holders,
    ageMinutes: token.ageMinutes,
    hasLinks: Object.values(token.links).some(Boolean),
  });

  return (
    <div className="container-page pt-6 pb-24 lg:pb-0">
      <Link href="/explore" className="inline-flex items-center gap-1 text-xs text-fg-3 hover:text-fg">
        <ChevronLeft className="size-3.5" />
        Explore
      </Link>

      {token.isDemo && (
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-warn/20 bg-warn-dim px-3.5 py-2.5 text-xs text-warn">
          <FlaskConical className="mt-px size-3.5 shrink-0" />
          <span>
            Demo token. It does not exist on-chain, and its prices, holders and trades are generated sample data. Nothing
            on this page can be traded.
          </span>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:gap-x-6">
        {/* ─── Left column, top ────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <section aria-labelledby="token-name">
            <div className="flex items-start gap-4">
              <TokenAvatar name={token.name} ticker={token.ticker} hue={token.hue} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h1 id="token-name" className="text-xl font-medium tracking-[-0.015em] text-fg sm:text-2xl">
                    {token.name}
                  </h1>
                  <span className="font-mono text-sm text-fg-2">${token.ticker}</span>
                  <StatusBadge status={token.status} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-3">
                  <span>{CATEGORY_LABEL[token.category]}</span>
                  <span aria-hidden>·</span>
                  <span>Launched {fmt.age(token.ageMinutes)} ago</span>
                  <span aria-hidden>·</span>
                  <span className="font-mono">{token.address}</span>
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="font-mono text-xl text-fg tabular">{fmt.price(token.priceUsd)}</div>
                <Change value={token.change24h} className="mt-0.5 text-[13px]" />
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-fg-2">{token.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <SocialLinks links={token.links} demo={token.isDemo} />
              {token.communitySlug && (
                <ButtonLink href={`/community/${token.communitySlug}`} size="sm" variant="ghost">
                  <Users />
                  Community
                </ButtonLink>
              )}
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
            {[
              { l: "Market cap", v: fmt.usdCompact(token.marketCapUsd) },
              { l: token.status === "graduated" ? "Pool liquidity" : "Curve liquidity", v: fmt.usdCompact(token.liquidityUsd) },
              { l: "24h volume", v: fmt.usdCompact(token.volume24hUsd) },
              { l: "Holders", v: fmt.int(token.holders) },
              { l: "Token age", v: fmt.age(token.ageMinutes) },
              { l: "Bonding curve", v: `${((token.curve.raisedSol / token.curve.targetSol) * 100).toFixed(1)}%` },
              { l: "Graduation", v: token.status === "graduated" ? "Graduated" : "Not yet" },
              { l: "24h change", v: fmt.pct(token.change24h) },
            ].map((s) => (
              <div key={s.l} className="bg-bg-2 px-4 py-3">
                <dt className="text-xs text-fg-3">{s.l}</dt>
                <dd className="mt-1 font-mono text-[14px] text-fg tabular">{s.v}</dd>
              </div>
            ))}
          </dl>

          <PriceChart candles={market.candles} source={market.source} />

        </div>

        {/* ─── Right column: trade panel. On mobile it follows the chart. ─── */}
        <aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Trade">
          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <TradePanel token={token} />
            <RiskPanel flags={flags} source={market.source} />
          </div>
        </aside>

        {/* ─── Left column, bottom ─────────────────────── */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-2">
          <GraduationPanel token={token} history={market.graduation} />

          <TokenActivity token={token} trades={market.trades} holders={market.holders} source={market.source} />

          <Panel>
            <PanelHeader title="Tokenomics" description={`${fmt.compact(token.curve.totalSupply)} total supply · fixed`} />
            <TokenomicsBreakdown className="p-4" tokenomics={token.tokenomics} supply={token.curve.totalSupply} />
          </Panel>
        </div>
      </div>

      {/* Mobile quick-trade bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-fg-3">${token.ticker}</div>
            <div className="font-mono text-sm text-fg tabular">{fmt.price(token.priceUsd)}</div>
          </div>
          <a
            href="#trade"
            className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-[13px] font-medium text-accent-fg"
          >
            Trade
          </a>
        </div>
      </div>
    </div>
  );
}
