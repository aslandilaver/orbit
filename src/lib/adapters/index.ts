import { meteoraDbcLaunchAdapter, meteoraGraduationAdapter } from "./meteora";
import { token2022FixedAdapter } from "./token2022-fixed";
import { curveTradeAdapter, jupiterTradeAdapter } from "./trade";
import type { LaunchAdapter } from "./types";

export const launchAdapters: Record<"curve" | "fixed", LaunchAdapter> = {
  curve: meteoraDbcLaunchAdapter,
  fixed: token2022FixedAdapter,
};

export { curveTradeAdapter, jupiterTradeAdapter, meteoraGraduationAdapter };

/** Pick the trade route for a token; the first available adapter wins. */
export function resolveTradeAdapter(token: { address: string; isDemo: boolean; status: string }) {
  const order = token.status === "graduated" ? [jupiterTradeAdapter, curveTradeAdapter] : [curveTradeAdapter];
  for (const a of order) {
    const av = a.availability(token);
    if (av.available) return { adapter: a, availability: av };
  }
  const primary = order[0]!;
  return { adapter: primary, availability: primary.availability(token) };
}
