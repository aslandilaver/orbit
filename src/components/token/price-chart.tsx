"use client";

import { CandlestickSeries, ColorType, createChart, CrosshairMode, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { SourceBadge } from "@/components/ui/data-source";
import { Skeleton } from "@/components/ui/primitives";
import type { Candle, DataSource } from "@/lib/data/types";
import { fmt } from "@/lib/utils";

export function PriceChart({ candles, source }: { candles: Candle[]; source: DataSource }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<Candle | null>(null);
  const last = candles[candles.length - 1];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#626a63",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: { vertLines: { color: "#161a17" }, horzLines: { color: "#161a17" } },
      rightPriceScale: { borderColor: "#1f2520", scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { borderColor: "#1f2520", timeVisible: true, secondsVisible: false },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#39423a", labelBackgroundColor: "#232924" },
        horzLine: { color: "#39423a", labelBackgroundColor: "#232924" },
      },
      localization: { priceFormatter: (p: number) => fmt.price(p) },
      handleScale: { axisPressedMouseMove: true },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#7fd6a0",
      downColor: "#ef8270",
      borderVisible: false,
      wickUpColor: "#7fd6a0",
      wickDownColor: "#ef8270",
      priceFormat: { type: "custom", formatter: (p: number) => fmt.price(p), minMove: 1e-12 },
    });
    series.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    chart.timeScale().fitContent();
    chart.subscribeCrosshairMove((param) => {
      const d = param.seriesData.get(series) as Candle | undefined;
      setHover(d && "open" in d ? d : null);
    });
    setReady(true);
    return () => chart.remove();
  }, [candles]);

  const shown = hover ?? last;

  return (
    <div className="rounded-lg border border-line bg-bg-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-[13px] font-medium text-fg">Price</h3>
          <span className="rounded-xs border border-line-2 px-1.5 font-mono text-2xs text-fg-3">15m</span>
        </div>
        {shown && (
          <div className="hidden gap-3 font-mono text-2xs text-fg-3 tabular sm:flex">
            <span>O {fmt.price(shown.open)}</span>
            <span>H {fmt.price(shown.high)}</span>
            <span>L {fmt.price(shown.low)}</span>
            <span className={shown.close >= shown.open ? "text-up" : "text-down"}>C {fmt.price(shown.close)}</span>
          </div>
        )}
        <SourceBadge source={source} />
      </div>
      <div className="relative h-[300px] sm:h-[360px]">
        {!ready && <Skeleton className="absolute inset-4" />}
        <div ref={ref} className="absolute inset-0" aria-label="Candlestick price chart" role="img" />
      </div>
      {source === "demo" && (
        <p className="border-t border-line px-4 py-2.5 text-xs text-fg-3">
          Synthetic candles generated for demonstration. This is not trading history for any real asset.
        </p>
      )}
    </div>
  );
}
