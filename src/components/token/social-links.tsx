import { ArrowUpRight, AtSign, Globe, MessageCircle, Send } from "lucide-react";
import type { TokenLinks } from "@/lib/data/types";

const ITEMS = [
  { key: "website", label: "Website", Icon: Globe },
  { key: "x", label: "X", Icon: AtSign },
  { key: "telegram", label: "Telegram", Icon: Send },
  { key: "discord", label: "Discord", Icon: MessageCircle },
] as const;

/** External project links. Always open with noopener and never render non-https URLs. */
export function SocialLinks({ links, demo }: { links: TokenLinks; demo?: boolean }) {
  const present = ITEMS.filter((i) => {
    const v = links[i.key];
    return v && v.startsWith("https://");
  });
  if (!present.length) return <span className="text-xs text-fg-3">No links provided</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {present.map(({ key, label, Icon }) => (
        <li key={key}>
          <a
            href={links[key]}
            target="_blank"
            rel="noopener noreferrer nofollow"
            title={demo ? "Demo placeholder link" : links[key]}
            className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-line-2 px-2.5 text-xs text-fg-2 transition-colors hover:border-line-3 hover:text-fg"
          >
            <Icon className="size-3.5" />
            {label}
            <ArrowUpRight className="size-3 text-fg-3" />
          </a>
        </li>
      ))}
    </ul>
  );
}
