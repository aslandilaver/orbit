import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "/explore", label: "Explore" },
      { href: "/launch", label: "Launch a token" },
      { href: "/community", label: "Communities" },
      { href: "/portfolio", label: "Portfolio" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs#bonding-curve", label: "Bonding curve" },
      { href: "/docs#graduation", label: "Graduation" },
      { href: "/docs#integrations", label: "Integration status" },
    ],
  },
  {
    title: "Safety",
    links: [
      { href: "/docs#security", label: "Wallet security" },
      { href: "/docs#risk", label: "Risk disclosure" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-[13px] text-fg-2">Launch Together. Grow Beyond.</p>
          <p className="mt-6 text-xs leading-relaxed text-fg-3">
            Tokens listed on ORBIT are created by independent users. A listing is not an endorsement, audit, or
            investment advice. Digital assets are volatile and you can lose everything you put in.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <div className="eyebrow">{c.title}</div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-fg-2 transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex h-12 items-center justify-between text-xs text-fg-3">
          <span>© 2026 ORBIT</span>
          <span className="font-mono">Built on Solana</span>
        </div>
      </div>
    </footer>
  );
}
