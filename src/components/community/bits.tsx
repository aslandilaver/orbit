import { Megaphone, Milestone, Newspaper } from "lucide-react";
import type { CommunityUpdate } from "@/lib/data/types";
import { cn, fmt } from "@/lib/utils";

const KIND = {
  announcement: { label: "Announcement", Icon: Megaphone, cls: "text-accent" },
  milestone: { label: "Milestone", Icon: Milestone, cls: "text-up" },
  update: { label: "Update", Icon: Newspaper, cls: "text-fg-2" },
} as const;

export function UpdateItem({ update, community, className }: { update: CommunityUpdate; community?: string; className?: string }) {
  const k = KIND[update.kind];
  return (
    <article className={cn("flex gap-3", className)}>
      <div className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-sm border border-line-2 bg-surface", k.cls)}>
        <k.Icon className="size-3.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-fg-3">
          <span className={k.cls}>{k.label}</span>
          {community && (
            <>
              <span aria-hidden>·</span>
              <span className="text-fg-2">{community}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <time>{fmt.age(update.ageMinutes)} ago</time>
        </div>
        <h3 className="mt-1 text-[14px] font-medium text-fg">{update.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-2">{update.body}</p>
      </div>
    </article>
  );
}

/** Decorative banner generated from the token hue: concentric arcs, no stock imagery. */
export function CommunityBanner({ hue, className }: { hue: number; className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: `linear-gradient(120deg, hsl(${hue} 18% 11%), hsl(${hue} 14% 7%) 60%, #0b0d0c)` }}
      aria-hidden
    >
      <svg viewBox="0 0 800 200" preserveAspectRatio="xMaxYMid slice" className="absolute inset-0 size-full">
        {[60, 110, 160, 210, 260, 310].map((r, i) => (
          <circle key={r} cx="680" cy="160" r={r} fill="none" stroke={`hsl(${hue} 30% 60%)`} strokeOpacity={0.14 - i * 0.015} />
        ))}
        <circle cx="680" cy="160" r="4" fill={`hsl(${hue} 50% 70%)`} fillOpacity="0.8" />
      </svg>
      <div className="grid-backdrop absolute inset-0 opacity-60" />
    </div>
  );
}
