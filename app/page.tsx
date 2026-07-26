"use client";
import React, { useState, useMemo, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Treemap } from "recharts";

// ---------- 색 팔레트 ----------
const COL = {
  bg: "#0A0E14",
  surface: "#131822",
  surface2: "#1B222E",
  border: "#232A38",
  text: "#E8ECF3",
  muted: "#8A93A6",
  up: "#2FD180",
  down: "#FF6161",
  accent: "#F5B942",
};

// ---------- 더미 스파크라인 ----------
const spark = (base, vol, seed = 1) =>
  Array.from({ length: 20 }, (_, i) => ({
    v: base + Math.sin(i / 2.3 + seed) * vol + Math.cos(i * seed) * vol * 0.3,
  }));

const indices = [
  { key: "kospi", label: "코스피", base: 3214.52, vol: 30, chg: "+0.84%", up: true, seed: 1 },
  { key: "kosdaq", label: "코스닥", base: 812.11, vol: 10, chg: "-0.32%", up: false, seed: 2 },
  { key: "sp500", label: "S&P500 (SPY)", base: 6092.4, vol: 40, chg: "+0.41%", up: true, seed: 3 },
  { key: "nasdaq", label: "나스닥100 (QQQ)", base: 19842.7, vol: 120, chg: "+0.62%", up: true, seed: 4 },
  { key: "dow", label: "다우존스 (DIA)", base: 43120.9, vol: 90, chg: "-0.18%", up: false, seed: 5 },
];

const commodities = [
  { key: "wti", label: "WTI 유가 (USO)", base: 68.42, vol: 1.2, chg: "+1.12%", up: true, seed: 8, prefix: "$" },
  { key: "gold", label: "금 (GLD)", base: 2614.8, vol: 15, chg: "+0.35%", up: true, seed: 9, prefix: "$" },
  { key: "btc", label: "비트코인", base: 96420, vol: 1800, chg: "+2.14%", up: true, seed: 13, prefix: "$" },
];

const rates = [
  { key: "us10y", label: "美 10Y 금리", base: 4.28, vol: 0.08, chg: "-0.03%p", up: false, seed: 10, suffix: "%" },
  { key: "usbase", label: "美 기준금리", base: 4.5, vol: 0.02, chg: "0.00%p", up: true, seed: 11, suffix: "%" },
  { key: "krbase", label: "韓 기준금리", base: 2.75, vol: 0.02, chg: "0.00%p", up: true, seed: 12, suffix: "%" },
];

function formatBasDt(basDt) {
  if (!basDt || basDt.length !== 8) return "";
  return `${basDt.slice(2, 4)}.${basDt.slice(4, 6)}.${basDt.slice(6, 8)}`;
}

function formatBasDt2(isoDate: string) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${y.slice(2)}.${m}.${d}`;
}

function formatEcosDate(yyyymmdd: string) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return "";
  return `${yyyymmdd.slice(2, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
}

const newsDigest = [
  {
    tag: "AI/테크",
    market: "미국",
    title: "메타, AI 컴퓨팅 판매 기반 클라우드 사업 진출 시사",
    source: "Reuters",
    time: "58분 전",
    url: "https://www.reuters.com",
  },
  {
    tag: "美 증시",
    market: "미국",
    title: "반도체 차익실현 매물에 주요 지수 하락 전환",
    source: "Bloomberg",
    time: "1시간 전",
    url: "https://www.bloomberg.com",
  },
  {
    tag: "통화정책",
    market: "미국",
    title: "연준 의장, 정책 체계 전환 가능성 시사",
    source: "CNBC",
    time: "1시간 전",
    url: "https://www.cnbc.com",
  },
  {
    tag: "국내증시",
    market: "국내",
    title: "코스피, 외국인 순매수에 상승 마감",
    source: "한국경제",
    time: "3시간 전",
    url: "https://www.hankyung.com",
  },
  {
    tag: "환율",
    market: "국내",
    title: "원/달러 환율 1,390원대 등락, 수출입 업계 촉각",
    source: "연합인포맥스",
    time: "4시간 전",
    url: "https://news.einfomax.co.kr",
  },
  {
    tag: "산업",
    market: "국내",
    title: "반도체 업황 우려에 코스닥 하락 마감",
    source: "매일경제",
    time: "5시간 전",
    url: "https://www.mk.co.kr",
  },
];

// ---------- 히트맵 더미 데이터 (마켓별) ----------
const heatmaps = {
  나스닥: [
    { name: "NVDA", size: 320, change: -1.25 },
    { name: "AAPL", size: 260, change: 1.74 },
    { name: "MSFT", size: 250, change: 3.02 },
    { name: "TSM", size: 150, change: -6.98 },
    { name: "AVGO", size: 130, change: -2.33 },
    { name: "GOOGL", size: 180, change: 1.07 },
    { name: "META", size: 140, change: -6.05 },
    { name: "AMZN", size: 170, change: 1.41 },
    { name: "TSLA", size: 120, change: 1.32 },
    { name: "AMD", size: 90, change: -6.95 },
    { name: "INTC", size: 60, change: -9.03 },
    { name: "MU", size: 55, change: -10.57 },
  ],
  코스피: [
    { name: "삼성전자", size: 340, change: -5.84 },
    { name: "SK하이닉스", size: 220, change: -3.4 },
    { name: "삼성바이오", size: 90, change: -3.49 },
    { name: "LG에너지솔루션", size: 85, change: -3.87 },
    { name: "현대차", size: 80, change: -1.52 },
    { name: "기아", size: 70, change: 2.34 },
    { name: "삼성전기", size: 55, change: 0.96 },
    { name: "KB금융", size: 60, change: -0.31 },
    { name: "POSCO홀딩스", size: 50, change: -1.1 },
    { name: "NAVER", size: 65, change: 0.4 },
  ],
  코스닥: [
    { name: "SK스퀘어", size: 150, change: 3.54 },
    { name: "에코프로", size: 110, change: -2.1 },
    { name: "HD현대중공업", size: 90, change: 3.09 },
    { name: "두산에너빌", size: 70, change: 1.96 },
    { name: "한화에어로", size: 85, change: 9.65 },
    { name: "알테오젠", size: 60, change: -1.8 },
    { name: "리가켐바이오", size: 55, change: -2.9 },
    { name: "펄어비스", size: 45, change: 0.8 },
    { name: "루닛", size: 40, change: -3.2 },
    { name: "엔켐", size: 35, change: 1.5 },
  ],
};

function colorForChange(c) {
  const clamped = Math.max(-10, Math.min(10, c));
  const t = Math.min(1, Math.abs(clamped) / 8);
  const from = clamped >= 0 ? [26, 36, 30] : [38, 26, 26];
  const to = clamped >= 0 ? [47, 209, 128] : [255, 97, 97];
  const mix = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return "rgb(" + mix.join(",") + ")";
}

function HeatCell(props) {
  const { x, y, width, height, name, change } = props;
  if (width <= 0 || height <= 0 || typeof change !== "number") return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: colorForChange(change), stroke: COL.bg, strokeWidth: 2 }} />
      {width > 42 && height > 22 && (
        <text x={x + 6} y={y + 16} fontSize={11} fontWeight={600} fill="#fff">
          {name}
        </text>
      )}
      {width > 42 && height > 36 && (
        <text x={x + 6} y={y + 31} fontSize={10} fill="rgba(255,255,255,0.85)">
          {change > 0 ? "+" : ""}
          {change.toFixed(2)}%
        </text>
      )}
    </g>
  );
}

function HeatmapSection() {
  const [tab, setTab] = useState("나스닥");
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium" style={{ color: COL.muted }}>
          시장 히트맵
        </div>
        <div className="flex gap-1">
          {Object.keys(heatmaps).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="text-xs px-2.5 py-1 rounded-md"
              style={{
                background: tab === k ? COL.accent : COL.surface,
                color: tab === k ? "#0A0E14" : COL.muted,
                border: `1px solid ${tab === k ? COL.accent : COL.border}`,
                fontWeight: tab === k ? 700 : 500,
              }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${COL.border}`, height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={heatmaps[tab]} dataKey="size" stroke={COL.bg} content={<HeatCell />} isAnimationActive={false} />
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------- Fear & Greed 게이지 (전일대비 포함) ----------
function FearGreedGauge({ value = 62 }) {
  const [display, setDisplay] = useState(50);
  useEffect(() => {
    const t = setTimeout(() => setDisplay(value), 200);
    return () => clearTimeout(t);
  }, [value]);

  const angle = -90 + (display / 100) * 180;
  const label =
    display < 25 ? "극도의 공포" : display < 45 ? "공포" : display < 55 ? "중립" : display < 75 ? "탐욕" : "극도의 탐욕";

  const r = 90;
  const cx = 110;
  const cy = 110;
  const arcPoints = useMemo(() => {
    const segs = 60;
    return Array.from({ length: segs + 1 }, (_, i) => {
      const a = Math.PI - (i / segs) * Math.PI;
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    });
  }, []);

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="140" viewBox="0 0 220 140">
        <defs>
          <linearGradient id="fgArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff5c5c" />
            <stop offset="50%" stopColor="#f5b942" />
            <stop offset="100%" stopColor="#2fd180" />
          </linearGradient>
        </defs>
        <polyline
          points={arcPoints.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="url(#fgArc)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r + 18}
          stroke={COL.text}
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `rotate(${angle}deg)`,
            transition: "transform 1.1s cubic-bezier(.34,1.56,.64,1)",
          }}
        />
        <circle cx={cx} cy={cy} r="5" fill={COL.text} />
      </svg>
      <div className="-mt-2 text-3xl font-mono font-semibold tabular-nums" style={{ color: COL.accent }}>
        {display}
      </div>
      <div className="text-sm mt-1" style={{ color: COL.muted }}>
        {label}
      </div>
    </div>
  );
}

// ---------- 종목/지수 상세 차트 모달 ----------
const RANGES = ["1일", "5일", "1개월", "1년", "5년", "최대"];
const RANGE_POINTS = { "1일": 24, "5일": 5, "1개월": 22, "1년": 12, "5년": 5, "최대": 10 };

function genSeries(base, vol, seed, range) {
  const n = RANGE_POINTS[range];
  const mult = range === "1일" ? 0.3 : range === "5일" ? 0.6 : range === "1개월" ? 1 : range === "1년" ? 2.2 : range === "5년" ? 4 : 5.5;
  return Array.from({ length: n }, (_, i) => ({
    idx: i,
    v: Number((base + Math.sin(i / 2.1 + seed) * vol * mult + Math.cos(i * 0.7 + seed) * vol * mult * 0.4).toFixed(2)),
  }));
}

function DetailModal({ item, onClose }) {
  const [range, setRange] = useState("1개월");
  if (!item) return null;
  const data = genSeries(item.base, item.vol, item.seed, range);
  const last = data[data.length - 1].v;
  const first = data[0].v;
  const trendUp = last >= first;
  const lineColor = trendUp ? COL.up : COL.down;
  const fmt = (n) => (item.prefix || "") + n.toLocaleString(undefined, { maximumFractionDigits: 2 }) + (item.suffix || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5"
        style={{ background: COL.surface, border: `1px solid ${COL.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-base font-semibold">{item.label}</div>
            <div className="font-mono text-2xl font-semibold tabular-nums mt-0.5">{fmt(last)}</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ background: COL.surface2, color: COL.muted }}
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 mb-3 overflow-x-auto">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="text-xs px-2.5 py-1 rounded-md shrink-0"
              style={{
                background: range === r ? COL.accent : COL.surface2,
                color: range === r ? "#0A0E14" : COL.muted,
                fontWeight: range === r ? 700 : 500,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="idx" hide />
              <YAxis domain={["auto", "auto"]} hide />
              <Tooltip
                contentStyle={{ background: COL.surface2, border: `1px solid ${COL.border}`, borderRadius: 8, fontSize: 12 }}
                labelFormatter={() => ""}
                formatter={(v) => [fmt(v), item.label]}
              />
              <Area type="monotone" dataKey="v" stroke={lineColor} strokeWidth={2} fill="url(#detailFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function NewsModal({ news, onClose }) {
  if (!news) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5"
        style={{ background: COL.surface, border: `1px solid ${COL.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <span
            className="inline-block text-[11px] px-2 py-0.5 rounded-md font-medium"
            style={{ background: "rgba(245,185,66,0.12)", color: COL.accent }}
          >
            {news.tag}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ background: COL.surface2, color: COL.muted }}
          >
            ✕
          </button>
        </div>
        <div className="font-semibold text-base leading-snug mb-3">{news.title}</div>
        <div className="text-xs mb-4" style={{ color: COL.muted }}>
          {news.source} · {news.time}
        </div>
        <a
          href={news.url}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-sm font-medium py-2.5 rounded-xl"
          style={{ background: COL.accent, color: "#0A0E14" }}
        >
          원문 보기
        </a>
      </div>
    </div>
  );
}

function MiniCard({ item, onClick }) {
  const color = item.up ? COL.up : COL.down;
  const data = spark(item.base, item.vol, item.seed);
  const fmt = (item.prefix || "") + item.base.toLocaleString(undefined, { maximumFractionDigits: 2 }) + (item.suffix || "");
  return (
    <button
      onClick={onClick}
      className="min-w-[148px] rounded-xl px-4 py-3 shrink-0 text-left active:scale-[0.97] transition-transform"
      style={{ background: COL.surface, border: `1px solid ${COL.border}` }}
    >
      <div className="text-xs mb-1" style={{ color: COL.muted }}>
        {item.label}
      </div>
      <div className="font-mono text-lg font-semibold tabular-nums">{fmt}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs font-mono tabular-nums" style={{ color }}>
          {item.chg}
        </span>
        <div className="w-14 h-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </button>
  );
}

const researchReports = [
  { firm: "한국투자증권", title: "2026년 하반기 반도체 업황 전망", date: "26.07.01", url: "https://consensus.hankyung.com" },
  { firm: "삼성증권", title: "美 연준 정책 전환 시나리오별 시장 영향", date: "26.06.30", url: "https://consensus.hankyung.com" },
  { firm: "미래에셋증권", title: "코스피 3분기 밸류에이션 점검", date: "26.06.29", url: "https://consensus.hankyung.com" },
];

function YieldCurveChart({ data }: { data: any[] }) {
  const chartData = data.map((d: any) => ({
    name: d.sfln_intrc_nm.replace("수은채 유통수익률 ", ""),
    rate: parseFloat(d.int_r),
  }));
  return (
    <div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="yieldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COL.accent} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COL.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: COL.muted }} interval={4} />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ background: COL.surface2, border: `1px solid ${COL.border}`, borderRadius: 8, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="rate" stroke={COL.accent} strokeWidth={2} fill="url(#yieldFill)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] mt-1" style={{ color: COL.muted }}>
        수출입은행이 발행한 채권(수은채)의 만기별 시장 유통수익률. 만기가 길수록 금리가 높은 우상향 곡선이 정상 상태.
      </div>
    </div>
  );
}

function IntlRateSection({ data }: { data: any[] }) {
  const currencies = Array.from(new Set(data.map((d: any) => d.cur_fund))) as string[];
  const [tab, setTab] = useState(currencies[0] || "USD");
  const filtered = data.filter((d: any) => d.cur_fund === tab);

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {currencies.map((c) => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className="text-xs px-2.5 py-1 rounded-md"
            style={{
              background: tab === c ? COL.accent : COL.surface,
              color: tab === c ? "#0A0E14" : COL.muted,
              border: `1px solid ${tab === c ? COL.accent : COL.border}`,
              fontWeight: tab === c ? 700 : 500,
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {filtered.map((n: any, i: number) => (
          <div
            key={i}
            className="flex justify-between text-sm rounded-lg px-3 py-2"
            style={{ background: COL.surface, border: `1px solid ${COL.border}` }}
          >
            <span style={{ color: COL.muted }}>{n.sfln_intrc_nm}</span>
            <span className="font-mono">{n.int_r}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchSection() {
  return (
    <div className="mb-6">
      <div className="mb-2 text-sm font-medium" style={{ color: COL.muted }}>
        증권사 리서치 리포트
      </div>
      <div className="flex flex-col gap-2.5">
        {researchReports.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: COL.surface, border: `1px solid ${COL.border}` }}
          >
            <div>
              <div className="text-xs mb-1" style={{ color: COL.accent }}>
                {r.firm}
              </div>
              <div className="font-semibold text-sm leading-snug">{r.title}</div>
              <div className="text-xs mt-1" style={{ color: COL.muted }}>
                {r.date}
              </div>
            </div>
            <span style={{ color: COL.muted }}>›</span>
          </a>
        ))}
      </div>
      <div className="text-xs mt-2" style={{ color: COL.muted }}>
        국내 증권사 공개 리포트 기준 (한경 컨센서스). 해외 IB(JP모건 등) 리포트는 고객 전용이라 연동 불가.
      </div>
    </div>
  );
}

export default function Dashboard() {
  const now = "26.07.02 08:11";
  const [selected, setSelected] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [newsTab, setNewsTab] = useState("전체");
  const filteredNews = newsDigest.filter((n) => newsTab === "전체" || n.market === newsTab);

const [exchangeData, setExchangeData] = useState<any[]>([]);
const [loanData, setLoanData] = useState<any[]>([]);
const [intlData, setIntlData] = useState<any[]>([]);
const [twelveData, setTwelveData] = useState<Record<string, any>>({});
const [krxData, setKrxData] = useState<Record<string, any>>({});
const [btcData, setBtcData] = useState<any>(null);
const [fredData, setFredData] = useState<Record<string, any>>({});
const [ecosData, setEcosData] = useState<any>(null);

useEffect(() => {
  fetch("/api/exim?type=exchange")
    .then((r) => r.json())
    .then((d) => setExchangeData(Array.isArray(d) ? d : []));
  fetch("/api/exim?type=loan")
    .then((r) => r.json())
    .then((d) => setLoanData(Array.isArray(d) ? d : []));
  fetch("/api/exim?type=international")
    .then((r) => r.json())
    .then((d) => setIntlData(Array.isArray(d) ? d : []));
  fetch("/api/twelvedata")
    .then((r) => r.json())
    .then((d) => setTwelveData(d || {}));
  fetch("/api/krx")
    .then((r) => r.json())
    .then((d) => setKrxData(d || {}));
  fetch("/api/coingecko")
    .then((r) => r.json())
    .then((d) => setBtcData(d?.bitcoin || null));
  fetch("/api/fred")
  .then((r) => r.json())
  .then((d) => setFredData(d || {}));
  fetch("/api/ecos")
  .then((r) => r.json())
  .then((d) => setEcosData(d?.krbase || null));
}, []);

const liveIndices = indices.map((it) => {
  // 해외 지수 (Twelve Data, ETF 프록시)
  const tw = twelveData[it.key];
  if (tw) {
    const price = parseFloat(tw.close);
    const changePct = parseFloat(tw.percent_change);
    return {
      ...it,
      base: price,
      chg: (changePct >= 0 ? "+" : "") + changePct.toFixed(2) + "%",
      up: changePct >= 0,
    };
  }

  // 국내 지수 (KRX, 공공데이터포털) — 필드명이 clpr(종가)/fltRt(등락률)로 다름
  const kr = krxData[it.key];
  if (kr) {
    const price = parseFloat(kr.clpr);
    const changePct = parseFloat(kr.fltRt);
    return {
      ...it,
      base: price,
      chg: (changePct >= 0 ? "+" : "") + changePct.toFixed(2) + "%",
      up: changePct >= 0,
    };
  }

  return it; // 둘 다 없으면 더미 그대로
});

const liveCommodities = commodities.map((it) => {
  // 비트코인 (CoinGecko)
  if (it.key === "btc" && btcData) {
    const price = btcData.usd;
    const changePct = btcData.usd_24h_change;
    return {
      ...it,
      base: price,
      chg: (changePct >= 0 ? "+" : "") + changePct.toFixed(2) + "%",
      up: changePct >= 0,
    };
  }

  // WTI, 금 (Twelve Data, ETF 프록시 — 지수 카드랑 같은 twelveData 재사용)
  const tw = twelveData[it.key];
  if (tw) {
    const price = parseFloat(tw.close);
    const changePct = parseFloat(tw.percent_change);
    return {
      ...it,
      base: price,
      chg: (changePct >= 0 ? "+" : "") + changePct.toFixed(2) + "%",
      up: changePct >= 0,
    };
  }

  return it;
});

const liveRates = rates.map((it) => {
  if (it.key === "krbase") {
    if (ecosData) {
      return {
        ...it,
        base: ecosData.value,
        chg: `${formatEcosDate(ecosData.date)} 기준`,
        up: true,
      };
    }
    return it; // 데이터 없으면 더미 그대로
  }

  const f = fredData[it.key];
  if (f) {
    return {
      ...it,
      base: f.value,
      chg: `${formatBasDt2(f.date)} 기준`,
      up: true,
    };
  }
  return it;
});


  return (
    <div className="min-h-screen w-full" style={{ background: COL.bg, color: COL.text }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-lg font-semibold tracking-tight">InvestDaily</div>
            <div className="text-xs mt-0.5" style={{ color: COL.muted }}>
              최근 업데이트 {now}
            </div>
          </div>
          <div
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: COL.surface, border: `1px solid ${COL.border}`, color: COL.muted }}
          >
            진행중
          </div>
        </div>

        {/* 지수 */}
        <div className="mb-1 text-sm font-medium" style={{ color: COL.muted }}>
          국내·미국 지수 <span style={{ color: COL.accent }}>· 탭하면 상세 차트</span>
        </div>
        {krxData.kospi && (
          <div className="text-[11px] mb-2" style={{ color: COL.muted }}>
            코스피·코스닥은 {formatBasDt(krxData.kospi.basDt)} 종가 기준 (전일 데이터)
          </div>
        )}
        <div className="flex gap-2.5 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
          {liveIndices.map((it) => (
            <MiniCard key={it.key} item={it} onClick={() => setSelected(it)} />
          ))}
        </div>

		{/* 원자재 */}
      <div className="mb-1 text-sm font-medium" style={{ color: COL.muted }}>
        원자재
      </div>
      <div className="text-[11px] mb-2" style={{ color: COL.muted }}>
        WTI·금은 무료 플랜 제한으로 추종 ETF(USO/GLD) 가격으로 대체 표시
      </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
          {liveCommodities.map((it) => (
            <MiniCard key={it.key} item={it} onClick={() => setSelected(it)} />
          ))}
        </div>

    {/* 금리 */}
    <div className="mb-2 text-sm font-medium" style={{ color: COL.muted }}>
      금리
    </div>
    {fredData.us10y && (
      <div className="text-[11px] mb-2" style={{ color: COL.muted }}>
        美 금리는 FRED 발표 기준 {formatBasDt2(fredData.us10y.date)} 데이터 (실시간 아님, 연준 발표 시차 있음)
      </div>
    )}
    <div className="flex gap-2.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
      {liveRates.map((it) => (
        <MiniCard key={it.key} item={it} onClick={() => setSelected(it)} />
      ))}
    </div>

		{/* 수출입은행 환율/금리 실데이터 */}
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium" style={{ color: COL.muted }}>
            환율 (수출입은행)
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[...exchangeData]
              .filter((c: any) => c.cur_unit !== "KRW")
              .sort((a: any, b: any) => {
                const order = ["USD", "JPY(100)", "CNH"];
                const ai = order.indexOf(a.cur_unit);
                const bi = order.indexOf(b.cur_unit);
                if (ai === -1 && bi === -1) return 0;
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
              })
              .map((c: any) => (
                <div
                  key={c.cur_unit}
                  className="min-w-[110px] rounded-xl px-3 py-2 shrink-0"
                  style={{ background: COL.surface, border: `1px solid ${COL.border}` }}
                >
                  <div className="text-xs" style={{ color: COL.muted }}>
                    {c.cur_nm} ({c.cur_unit})
                  </div>
                  <div className="font-mono text-sm font-semibold">{c.deal_bas_r}</div>
                </div>
              ))}
          </div>

          <div className="mb-2 mt-4 text-sm font-medium" style={{ color: COL.muted }}>
            대출금리 (수은채 유통수익률 곡선)
          </div>
          {loanData.length > 0 && <YieldCurveChart data={loanData} />}

          <div className="mb-2 mt-4 text-sm font-medium" style={{ color: COL.muted }}>
            국제금리
          </div>
          <IntlRateSection data={intlData} />
        </div>
	
        {/* 히트맵 */}
        <HeatmapSection />

        {/* 리서치 리포트 */}
        <ResearchSection />

        {/* Fear & Greed */}
        <div
          className="rounded-2xl py-5 mb-6 flex flex-col items-center"
          style={{ background: COL.surface, border: `1px solid ${COL.border}` }}
        >
          <div className="text-sm font-medium mb-1" style={{ color: COL.muted }}>
            Fear &amp; Greed Index
          </div>
          <FearGreedGauge value={62} />
        </div>

        {/* AI 뉴스 요약 */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium" style={{ color: COL.muted }}>
            경제 뉴스 헤드라인
          </div>
          <div className="flex gap-1">
            {["전체", "국내", "미국"].map((t) => (
              <button
                key={t}
                onClick={() => setNewsTab(t)}
                className="text-xs px-2.5 py-1 rounded-md"
                style={{
                  background: newsTab === t ? COL.accent : COL.surface,
                  color: newsTab === t ? "#0A0E14" : COL.muted,
                  border: `1px solid ${newsTab === t ? COL.accent : COL.border}`,
                  fontWeight: newsTab === t ? 700 : 500,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {filteredNews.map((n, i) => (
            <button
              key={i}
              onClick={() => setSelectedNews(n)}
              className="rounded-xl p-4 text-left active:scale-[0.98] transition-transform"
              style={{ background: COL.surface, border: `1px solid ${COL.border}` }}
            >
              <span
                className="inline-block text-[11px] px-2 py-0.5 rounded-md mb-2 font-medium"
                style={{ background: "rgba(245,185,66,0.12)", color: COL.accent }}
              >
                {n.tag}
              </span>
              <div className="font-semibold text-sm leading-snug mb-1.5">{n.title}</div>
              <div className="text-xs" style={{ color: COL.muted }}>
                {n.source} · {n.time}
              </div>
            </button>
          ))}
        </div>
      </div>

      <DetailModal item={selected} onClose={() => setSelected(null)} />
      <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
