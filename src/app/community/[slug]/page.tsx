import type { Metadata } from "next";
import { ArrowRight, ChevronLeft, FlaskConical, Inbox, Vote } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityBanner, UpdateItem } from "@/components/community/bits";
import { GraduationPanel } from "@/components/token/panels";
import { SocialLinks } from "@/components/token/social-links";
import { Change, StatusBadge, TokenAvatar } from "@/components/token/token-bits";
import { ButtonLink } from "@/components/ui/button";
import { SourceBadge } from "@/components/ui/data-source";
import { EmptyState, Panel, PanelHeader, Row } from "@/components/ui/primitives";
import { getCommunities, getCommunity, getToken, getTokenMarket } from "@/lib/data/provider";
import { cn, fmt } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCommunities().data.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCommunity(slug)?.data;
  return { title: c ? `${c.name} community` : "Community" };
}

export default async function CommunityProfile({ params }: Props) {
  const { slug } = await params;
  const found = getCommunity(slug);
  if (!found) notFound();
  const c = found.data;
  const token = getToken(c.tokenAddress)?.data;
  if (!token) notFound();
  const market = getTokenMarket(token);
  const holdersExCurve = market.holders.filter((h) => h.kind !== "curve");
  const top10 = holdersExCurve.slice(0, 10).reduce((s, h) => s + h.pct, 0);
  const buys = market.trades.filter((t) => t.side === "buy").length;

  return (
    <div>
      <CommunityBanner hue={token.hue} className="h-36 border-b border-line sm:h-48" />
      <div className="container-page">
        <Link href="/community" className="mt-4 inline-flex items-center gap-1 text-xs text-fg-3 hover:text-fg">
          <ChevronLeft className="size-3.5" /> Communities
        </Link>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <TokenAvatar name={token.name} ticker={token.ticker} hue={token.hue} size={72} className="-mt-16 ring-4 ring-bg sm:-mt-20" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-medium tracking-[-0.02em] text-fg">{c.name}</h1>
                <StatusBadge status={token.status} />
              </div>
              <p className="mt-0.5 text-sm text-fg-2">{c.tagline}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href={`/token/${token.address}`} variant="primary">
              Trade ${token.ticker} <ArrowRight />
            </ButtonLink>
          </div>
        </div>

        {found.source === "demo" && (
          <div className="mt-5 flex items-start gap-2.5 rounded-md border border-warn/20 bg-warn-dim px-3.5 py-2.5 text-xs text-warn">
            <FlaskConical className="mt-px size-3.5 shrink-0" />
            Demo community. Members, updates and holder figures are sample data.
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-5">
          {[
            { l: "Members", v: fmt.int(c.members) },
            { l: "Holders", v: fmt.int(token.holders) },
            { l: "Active wallets (7d)", v: fmt.int(c.activeWallets7d) },
            { l: "Market cap", v: fmt.usdCompact(token.marketCapUsd) },
            { l: "24h", v: <Change value={token.change24h} /> },
          ].map((s) => (
            <div key={s.l} className="bg-bg-2 px-4 py-3 last:col-span-2 sm:last:col-span-1">
              <dt className="text-xs text-fg-3">{s.l}</dt>
              <dd className="mt-1 font-mono text-[15px] text-fg tabular">{s.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Panel>
              <PanelHeader title="About" />
              <div className="p-4">
                <p className="text-[14px] leading-relaxed text-fg-2">{c.about}</p>
                <div className="mt-4">
                  <SocialLinks links={c.links} demo={found.source === "demo"} />
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Project updates" description="Posted by the project team" action={<SourceBadge source={found.source} />} />
              {c.updates.length ? (
                <div className="divide-y divide-line">
                  {c.updates.map((u) => (
                    <UpdateItem key={u.id} update={u} className="px-4 py-4" />
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Inbox />} title="No updates yet" description="This project hasn't posted an update." />
              )}
            </Panel>

            <GraduationPanel token={token} history={market.graduation} />

            <Panel>
              <PanelHeader
                title={
                  <span className="flex items-center gap-2">
                    <Vote className="size-4 text-fg-2" /> Governance
                  </span>
                }
                description="Proposals and voting"
              />
              <EmptyState
                title="No proposals"
                description="Governance is not enabled for this community. When it is, proposals and vote tallies will be read from the chain — never entered by hand."
                action={
                  <Link href="/docs#governance" className="text-xs text-fg-2 hover:text-fg hover:underline">
                    How governance will work
                  </Link>
                }
              />
            </Panel>
          </div>

          <aside className="flex flex-col gap-4">
            <Panel>
              <PanelHeader title="Holder statistics" action={<SourceBadge source={market.source} />} />
              <div className="px-4 py-3">
                <Row label="Holders" value={fmt.int(token.holders)} />
                <Row label="Top 10 (ex. curve/pool)" value={`${top10.toFixed(1)}%`} />
                <Row label="Largest holder" value={`${token.risk.topHolderPct.toFixed(1)}%`} />
                <Row label="Creator allocation" value={`${token.tokenomics.creator}%`} />
                <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                  {market.holders.slice(0, 10).map((h, i) => (
                    <div
                      key={i}
                      className={cn("border-r border-bg-2", h.kind === "curve" ? "bg-accent" : i % 2 ? "bg-fg-3" : "bg-fg-2")}
                      style={{ width: `${h.pct}%` }}
                    />
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Recent activity" description={`${buys} buys / ${market.trades.length - buys} sells in recent trades`} />
              <ul className="divide-y divide-line">
                {market.trades.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                    <span className={cn("w-8 text-xs font-medium", t.side === "buy" ? "text-up" : "text-down")}>
                      {t.side === "buy" ? "Buy" : "Sell"}
                    </span>
                    <span className="flex-1 font-mono text-xs text-fg-2">{fmt.address(t.wallet)}</span>
                    <span className="font-mono text-fg tabular">{t.sol.toFixed(2)} SOL</span>
                    <span className="w-8 text-right font-mono text-xs text-fg-3">{fmt.age(t.ageMinutes)}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <PanelHeader title="Token" />
              <Link href={`/token/${token.address}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
                <TokenAvatar name={token.name} ticker={token.ticker} hue={token.hue} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-fg">${token.ticker}</div>
                  <div className="font-mono text-xs text-fg-3">{fmt.price(token.priceUsd)}</div>
                </div>
                <ArrowRight className="size-4 text-fg-3" />
              </Link>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}
