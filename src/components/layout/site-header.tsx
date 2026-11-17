"use client";

import * as D from "@radix-ui/react-dialog";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { CLUSTER, CLUSTER_LABEL, IS_MAINNET } from "@/config/public-env";
import { cn } from "@/lib/utils";
import { WalletButton } from "./wallet-button";

export const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/launch", label: "Launch" },
  { href: "/community", label: "Community" },
  { href: "/docs", label: "Docs" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/explore" && pathname.startsWith("/token/"));
}

function ClusterPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-xs border border-line-2 px-2 font-mono text-2xs text-fg-2 uppercase",
        className,
      )}
      title={`Connected to Solana ${CLUSTER_LABEL[CLUSTER]}`}
    >
      <span className={cn("size-1.5 rounded-full", IS_MAINNET ? "bg-up" : "bg-warn")} />
      {CLUSTER_LABEL[CLUSTER]}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the mobile menu on navigation (state adjusted during render, no effect needed).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <div className="container-page flex h-14 items-center gap-6">
        <Link href="/" className="shrink-0 rounded-sm" aria-label="ORBIT home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 justify-center md:flex">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 items-center rounded-sm px-3 text-[13px] transition-colors",
                      active ? "bg-surface text-fg" : "text-fg-2 hover:text-fg",
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ClusterPill className="hidden lg:inline-flex" />
          <div className="hidden sm:block">
            <WalletButton />
          </div>

          <D.Root open={open} onOpenChange={setOpen}>
            <D.Trigger
              className="grid size-9 place-items-center rounded-md border border-line-2 text-fg-2 hover:text-fg md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </D.Trigger>
            <D.Portal>
              <D.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-[fade-in_150ms_ease-out] md:hidden" />
              <D.Content className="fixed inset-x-0 top-0 z-50 border-b border-line-2 bg-bg-2 data-[state=open]:animate-[fade-in_150ms_ease-out] md:hidden">
                <D.Title className="sr-only">Navigation</D.Title>
                <D.Description className="sr-only">Site navigation and wallet</D.Description>
                <div className="container-page flex h-14 items-center justify-between">
                  <Logo />
                  <D.Close
                    className="grid size-9 place-items-center rounded-md border border-line-2 text-fg-2 hover:text-fg"
                    aria-label="Close menu"
                  >
                    <X className="size-4" />
                  </D.Close>
                </div>
                <nav aria-label="Mobile" className="container-page pb-4">
                  <ul className="flex flex-col border-t border-line">
                    {[...NAV, { href: "/portfolio", label: "Portfolio" }].map((n) => {
                      const active = isActive(pathname, n.href);
                      return (
                        <li key={n.href} className="border-b border-line">
                          <Link
                            href={n.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex h-12 items-center justify-between text-[15px]",
                              active ? "text-fg" : "text-fg-2",
                            )}
                          >
                            {n.label}
                            {active && <span className="size-1.5 rounded-full bg-accent" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-4 flex flex-col gap-3">
                    <WalletButton block />
                    <div className="flex items-center justify-between text-xs text-fg-3">
                      <ClusterPill />
                      <Link href="/docs#security" className="inline-flex items-center gap-1 hover:text-fg">
                        Security <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </nav>
              </D.Content>
            </D.Portal>
          </D.Root>
        </div>
      </div>
    </header>
  );
}
