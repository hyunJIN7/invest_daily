import { NextRequest, NextResponse } from "next/server";

const TWELVE_DATA_KEY = process.env.TWELVE_DATA_KEY;

// 화면에서 쓰는 key -> Twelve Data 심볼
// SPX/IXIC/DJI(지수 원본)는 무료 플랜에서 막혀 있어서
// 같은 지수를 추종하는 ETF로 대체함 (SPY=S&P500, QQQ=나스닥100, DIA=다우존스)
const SYMBOL_MAP: Record<string, string> = {
  sp500: "SPY",
  nasdaq: "QQQ",
  dow: "DIA",
  wti: "USO",
  gold: "GLD",
};

export async function GET() {
  const symbols = Object.values(SYMBOL_MAP).join(",");
  const url = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${TWELVE_DATA_KEY}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const raw = await res.json();

    // Twelve Data 응답은 {SPY: {...}, QQQ: {...}, DIA: {...}} 형태로 옴.
    // 프론트에서 바로 쓰기 편하게 우리 내부 key(sp500/nasdaq/dow)로 다시 매핑해서 내려줌.
    const result: Record<string, any> = {};
    for (const [ourKey, symbol] of Object.entries(SYMBOL_MAP)) {
      const item = raw[symbol];
      if (item && item.status !== "error") {
        result[ourKey] = item;
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "twelvedata fetch failed" }, { status: 500 });
  }
}