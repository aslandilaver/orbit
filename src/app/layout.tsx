import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SolanaProvider } from "@/components/providers/solana-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ORBIT — Solana Community Launchpad", template: "%s · ORBIT" },
  description: "Launch your token, bring your community together, and build something that lasts.",
};

export const viewport: Viewport = {
  themeColor: "#0b0d0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-dvh flex-col overflow-x-hidden">
        <a
          href="#main"
          className="sr-only z-50 rounded-sm bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <SolanaProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </SolanaProvider>
      </body>
    </html>
  );
}
