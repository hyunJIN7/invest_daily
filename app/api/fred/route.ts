import { NextResponse } from "next/server";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

// US 10Y 국채금리, US 기준금리(연방기금 목표금리 상단)
const SERIES = {
  us10y: "DGS10",
  usbase: "DFEDTARU",
};

async function fetchSeries(seriesId: string, apiKey: string) {
  const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
  const res = await fetch(url, { next: { revalidate: 3600 } }); // 1시간 캐시
  if (!res.ok) throw new Error(`FRED API 오류 (${seriesId}): ${res.status}`);
  const data = await res.json();
  const obs = data.observations?.[0];
  if (!obs || obs.value === ".") return null; // "." 은 FRED에서 결측치 표시
  return { value: parseFloat(obs.value), date: obs.date };
}

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FRED_API_KEY 미설정" }, { status: 500 });
  }

  try {
    const [us10y, usbase] = await Promise.all([
      fetchSeries(SERIES.us10y, apiKey),
      fetchSeries(SERIES.usbase, apiKey),
    ]);

    return NextResponse.json({ us10y, usbase });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "FRED 데이터 조회 실패" }, { status: 500 });
  }
}