import { NextRequest, NextResponse } from "next/server";

const KRX_API_KEY = process.env.KRX_API_KEY;

// 화면 key -> 공공데이터포털이 쓰는 지수명
const IDX_NM: Record<string, string> = {
  kospi: "코스피",
  kosdaq: "코스닥",
};

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// 지수 하나(코스피 or 코스닥)에 대해 최근 10일치 범위로 조회 후, 가장 최근 날짜 데이터를 반환
async function fetchIndex(idxNm: string) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 10);

  const params = new URLSearchParams({
    serviceKey: KRX_API_KEY || "",
    resultType: "json",
    numOfRows: "10",
    beginBasDt: formatDate(start),
    endBasDt: formatDate(end),
    idxNm,
  });

  const url = `http://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  const items = data?.response?.body?.items?.item;
  if (!items) return null;

  const list = Array.isArray(items) ? items : [items];
  // basDt(기준일자) 기준 내림차순 정렬해서 제일 최신 것 사용
  list.sort((a: any, b: any) => (a.basDt > b.basDt ? -1 : 1));
  return list[0] || null;
}

export async function GET() {
  const result: Record<string, any> = {};

  for (const [ourKey, idxNm] of Object.entries(IDX_NM)) {
    try {
      const item = await fetchIndex(idxNm);
      if (item) result[ourKey] = item;
    } catch (e) {
      // 이 지수는 실패, 다음 걸로 넘어감
    }
  }

  return NextResponse.json(result);
}