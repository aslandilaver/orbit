import type { Metadata } from "next";
import { Suspense } from "react";
import { TokenExplorer } from "@/components/token/explorer";
import { Skeleton } from "@/components/ui/primitives";
import { getTokens } from "@/lib/data/provider";

export const metadata: Metadata = { title: "Explore" };

function ExplorerSkeleton() {
  return (
    <div aria-busy aria-label="Loading tokens">
      <Skeleton className="h-10 w-full max-w-lg" />
      <Skeleton className="mt-4 h-9 w-full" />
      <div className="mt-6 flex flex-col gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { data, source } = getTokens();
  return (
    <div className="container-page pt-10 sm:pt-14">
      <div className="mb-8 max-w-xl">
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-fg sm:text-[28px]">Explore</h1>
        <p className="mt-2 text-sm text-fg-2">
          Every token launched on ORBIT, from first trade to graduation. Listing is not an endorsement — check the risk
          panel on each token before you trade.
        </p>
      </div>
      <Suspense fallback={<ExplorerSkeleton />}>
        <TokenExplorer tokens={data} source={source} />
      </Suspense>
    </div>
  );
}
