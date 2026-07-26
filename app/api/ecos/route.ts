import { NextResponse } from "next/server";

// 한국은행 기준금리: 통계표코드 722Y001, 항목코드 0101000
const STAT_CODE = "722Y001";
const ITEM_CODE = "0101000";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const apiKey = process.env.ECOS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ECOS_API_KEY 미설정" }, { status: 500 });
  }

  // 기준금리는 금통위 결정 시에만 바뀌므로, 최근 1년 범위로 조회해서 마지막 값을 씀
  const end = todayStr();
  const start = `${Number(end.slice(0, 4)) - 1}${end.slice(4)}`;

  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/10/${STAT_CODE}/D/${start}/${end}/${ITEM_CODE}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // 1시간 캐시
    if (!res.ok) throw new Error(`ECOS API 오류: ${res.status}`);
    const data = await res.json();

    // 에러 응답 처리 (인증키 오류, 데이터 없음 등은 StatisticSearch가 아니라 RESULT 필드로 옴)
    if (data.RESULT) {
      return NextResponse.json({ error: data.RESULT.MESSAGE || "ECOS 조회 실패" }, { status: 500 });
    }

    const rows = data?.StatisticSearch?.row;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ krbase: null });
    }

    // 정렬 보장 안 되므로 TIME 기준으로 가장 최근 값 선택
    const latest = [...rows].sort((a, b) => a.TIME.localeCompare(b.TIME)).pop();

    return NextResponse.json({
      krbase: {
        value: parseFloat(latest.DATA_VALUE),
        date: latest.TIME, // YYYYMMDD 형식
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "ECOS 데이터 조회 실패" }, { status: 500 });
  }
}