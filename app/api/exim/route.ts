import { NextRequest, NextResponse } from "next/server";

// URL에 붙는 ?type=exchange 같은 값에 따라 어떤 EXIM API를 부를지 결정
const ENDPOINT: Record<string, string> = {
  exchange: "exchangeJSON",      // 현재환율
  loan: "interestJSON",          // 대출금리
  international: "internationalJSON", // 국제금리
};

// 서비스별로 인증키가 따로 발급되므로 타입별로 다른 환경변수를 참조
const KEY_ENV: Record<string, string | undefined> = {
  exchange: process.env.EXIM_EXCHANGE_KEY,
  loan: process.env.EXIM_LOAN_KEY,
  international: process.env.EXIM_INTL_KEY,
};

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// 국제금리 응답은 배열이 아니라 {sofr_list, estr_list, ...} 형태의 객체라서 평탄화 필요
const INTL_LIST_KEYS = [
  "sofr_list",
  "estr_list",
  "euribor_list",
  "tona_list",
  "tibor_list",
  "swapRfr_list",
  "libor_list",
  "swap_list",
  "cirr_list",
  "new_cirr_list",
];

function flattenInternational(obj: any): any[] {
  if (!obj || typeof obj !== "object") return [];
  let combined: any[] = [];
  for (const key of INTL_LIST_KEYS) {
    if (Array.isArray(obj[key])) {
      combined = combined.concat(obj[key]);
    }
  }
  // 이름/값이 없는 항목은 화면에 표시할 수 없으니 제외
return combined.filter((item) => item.sfln_intrc_nm && item.int_r !== null && item.int_r !== "0");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "exchange";
  const endpoint = ENDPOINT[type];

  if (!endpoint) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const authkey = KEY_ENV[type];
  const dataCode = type === "exchange" ? "AP01" : type === "loan" ? "AP02" : "AP03";

  // 주말/공휴일엔 데이터가 없어서 빈 배열이 옴 -> 최대 7일 전까지 거슬러 올라가며 재시도
  let cursor = new Date();
  for (let i = 0; i < 7; i++) {
    const searchdate = formatDate(cursor);
    const url = `https://oapi.koreaexim.go.kr/site/program/financial/${endpoint}?authkey=${authkey}&searchdate=${searchdate}&data=${dataCode}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (type === "international") {
        const flat = flattenInternational(data);
        if (flat.length > 0) {
          return NextResponse.json(flat);
        }
      } else if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (e) {
      // 이 날짜는 실패, 하루 전으로 계속 재시도
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // 7일 다 뒤져도 없으면 빈 배열 반환
  return NextResponse.json([]);
}