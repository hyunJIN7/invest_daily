"use client";
import { useEffect, useRef } from "react";

export default function TradingViewHeatmap({ dataSource = "SPX500" }: { dataSource?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.current.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource,
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "kr",
      symbolUrl: "",
      colorTheme: "dark",
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "100%",
    });
    container.current.appendChild(script);
  }, [dataSource]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: "100%", width: "100%" }}
    />
  );
}