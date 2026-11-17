import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Vote } from "lucide-react";
import Link from "next/link";
import { CommunityBanner, UpdateItem } from "@/components/community/bits";
import { CurveProgress, StatusBadge, TokenAvatar } from "@/components/token/token-bits";
import { ButtonLink } from "@/components/ui/button";
import { SourceBadge } from "@/components/ui/data-source";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { progress } from "@/lib/curve";
import { getCommunities, getToken } from "@/lib/data/provider";
import { fmt } from "@/lib/utils";

export const metadata: Metadata = { title: "Community" };

export default function CommunityPage() {
  const { data: communities, source } = getCommunities();
  const withTokens = communities
    .map((c) => ({ c, t: getToken(c.tokenAddress)?.data }))
    .filter((x): x is { c: (typeof communities)[number]; t: NonNullable<typeof x.t> } => Boolean(x.t));
  const featured = withTokens.filter((x) => x.c.featured);
  const feed = communities
    .flatMap((c) => c.updates.map((u) => ({ u, name: c.name, slug: c.slug })))
    .sort((a, b) => a.u.ageMinutes - b.u.ageMinutes);
  const announcements = feed.filter((f) => f.u.kind === "announcement");

  return (
    <div className="container-page pt-10 sm:pt-14">
      <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="text-2xl font-medium tracking-[-0.02em] text-fg sm:text-[28px]">Community</h1>
          <p className="mt-2 text-sm text-fg-2">
            Projects building in public. Profiles, updates and holder data for every community launched on ORBIT.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SourceBadge source={source} />
          <ButtonLink href="/launch" variant="primary">
            Start a community
          </ButtonLink>
        </div>
      </div>

      {/* Featured */}
      <section aria-labelledby="featured" className="mt-10">
        <h2 id="featured" className="eyebrow">
          Featured projects
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map(({ c, t }) => (
            <Link
              key={c.slug}
              href={`/community/${c.slug}`}
              className="group overflow-hidden rounded-lg border border-line bg-bg-2 transition-colors hover:border-line-3"
            >
              <CommunityBanner hue={t.hue} className="h-20" />
              <div className="relative px-4 pb-4">
                <TokenAvatar name={t.name} ticker={t.ticker} hue={t.hue} size={40} className="-mt-5 ring-4 ring-bg-2" />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-fg">{c.name}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-fg-3 group-hover:text-fg" />
                </div>
                <p className="mt-0.5 truncate text-xs text-fg-2">{c.tagline}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-fg-3">
                    <span className="font-mono text-fg">{fmt.compact(c.members)}</span> members
                  </span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Directory */}
        <section aria-labelledby="all" className="min-w-0">
          <div className="flex items-baseline justify-between">
            <h2 id="all" className="eyebrow">
              All communities
            </h2>
            <span className="font-mono text-xs text-fg-3">{withTokens.length}</span>
          </div>
          <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-bg-2">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-xs text-fg-3">
                  <th scope="col" className="py-2.5 pl-4 font-normal">
                    Community
                  </th>
                  <th scope="col" className="py-2.5 pl-4 text-right font-normal">
                    Members
                  </th>
                  <th scope="col" className="py-2.5 pl-4 text-right font-normal">
                    Active 7d
                  </th>
                  <th scope="col" className="py-2.5 pl-4 text-right font-normal">
                    Holders
                  </th>
                  <th scope="col" className="w-40 py-2.5 pr-4 pl-6 font-normal">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {withTokens.map(({ c, t }) => (
                  <tr key={c.slug} className="border-b border-line last:border-0 hover:bg-surface">
                    <td className="py-3 pl-4">
                      <Link href={`/community/${c.slug}`} className="flex items-center gap-3">
                        <TokenAvatar name={t.name} ticker={t.ticker} hue={t.hue} size={30} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-fg hover:underline">{c.name}</span>
                          <span className="block truncate text-xs text-fg-3">{c.tagline}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pl-4 text-right font-mono text-fg tabular">{fmt.int(c.members)}</td>
                    <td className="py-3 pl-4 text-right font-mono text-fg-2 tabular">{fmt.int(c.activeWallets7d)}</td>
                    <td className="py-3 pl-4 text-right font-mono text-fg-2 tabular">{fmt.int(t.holders)}</td>
                    <td className="py-3 pr-4 pl-6">
                      <CurveProgress value={progress(t.curve)} graduated={t.status === "graduated"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="eyebrow mt-12">Community activity</h2>
          <div className="mt-4 divide-y divide-line rounded-lg border border-line bg-bg-2">
            {feed.slice(0, 8).map(({ u, name, slug }) => (
              <Link key={u.id} href={`/community/${slug}`} className="block px-4 py-4 transition-colors hover:bg-surface">
                <UpdateItem update={u} community={name} />
              </Link>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <Panel>
            <PanelHeader title="Launch announcements" action={<SourceBadge source={source} />} />
            <ul className="divide-y divide-line">
              {announcements.map(({ u, name, slug }) => (
                <li key={u.id}>
                  <Link href={`/community/${slug}`} className="block px-4 py-3 hover:bg-surface">
                    <div className="text-xs text-fg-3">
                      {name} · {fmt.age(u.ageMinutes)} ago
                    </div>
                    <div className="mt-0.5 text-[13px] text-fg">{u.title}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <PanelHeader
              title={
                <span className="flex items-center gap-2">
                  <Vote className="size-4 text-fg-2" /> Governance
                </span>
              }
            />
            <div className="p-4 text-[13px] leading-relaxed text-fg-2">
              On-chain proposals and token-weighted voting are planned. They are not live, and ORBIT does not display
              governance results until votes are recorded on-chain.
              <Link href="/docs#governance" className="mt-3 flex items-center gap-1 text-xs text-fg hover:underline">
                Read the design <ArrowRight className="size-3" />
              </Link>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
