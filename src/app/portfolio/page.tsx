import type { Metadata } from "next";
import { PortfolioView } from "@/components/portfolio/portfolio-view";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <div className="mb-8 max-w-xl">
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-fg sm:text-[28px]">Portfolio</h1>
        <p className="mt-2 text-sm text-fg-2">Your wallet, read live from the chain.</p>
      </div>
      <PortfolioView />
    </div>
  );
}
