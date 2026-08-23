import { useState, useRef, useCallback, useEffect } from "react";

const ADMIN_PIN = "4254";
const VIEWER_PIN = "2026";
const VERSION = "v1.5.21";

// ✅ 테마 팔레트 - 다크(원본)/라이트(베이지) 두 가지
const DARK = {
  bg: "#0a0f1e", card: "#111827", cardBorder: "#1e293b",
  section: "#0f172a", sectionBorder: "#1e293b",
  text: "#e2e8f0", textSub: "#94a3b8", textMuted: "#64748b",
  border: "#334155", inputBg: "#0f172a",
  btnSubBg: "#1e293b", btnSubText: "#94a3b8", btnSubBorder: "#334155",
  btnDangerBg: "#2d1f1f", btnDangerText: "#ef4444", btnDangerBorder: "#7f1d1d",
  overlay: "rgba(0,0,0,0.75)",
  logoGrad: "linear-gradient(90deg,#60a5fa,#a78bfa)",
  btnGrad: "linear-gradient(135deg,#3b82f6,#6366f1)",
  dropBg: "#0f172a", dropBorder: "#1e293b", dropOnBg: "#0f1f3a", dropOnBorder: "#3b82f6",
  adminTagBg: "#1e3a5f", adminTagText: "#60a5fa", adminTagBorder: "#3b82f6",
  loginTagBg: "#1e293b", loginTagText: "#94a3b8",
  insight: "#0f172a", insightText: "#64748b",
  tableHead: "#0f172a", tableRowEven: "#111827", tableRowOdd: "#0f172a",
  tableText: "#e2e8f0", tableTextSub: "#64748b",
  msgMine: "#1e3a5f", msgMineBorder: "#3b82f6",
  msgOther: "#111827", msgOtherBorder: "#1e293b",
  msgText: "#e2e8f0", msgTextMuted: "#64748b",
  diaryBg: "#0a0f1e",
};
const LIGHT = {
  bg: "#f5f0eb", card: "#faf7f3", cardBorder: "#d6cfc4",
  section: "#ede8e0", sectionBorder: "#d6cfc4",
  text: "#1a1a2e", textSub: "#374151", textMuted: "#4b5563",
  border: "#d6cfc4", inputBg: "#ffffff",
  btnSubBg: "#ede8e0", btnSubText: "#374151", btnSubBorder: "#d6cfc4",
  btnDangerBg: "#fee2e2", btnDangerText: "#dc2626", btnDangerBorder: "#fca5a5",
  overlay: "rgba(0,0,0,0.55)",
  logoGrad: "linear-gradient(90deg,#2563eb,#7c3aed)",
  btnGrad: "linear-gradient(135deg,#2563eb,#7c3aed)",
  dropBg: "#ede8e0", dropBorder: "#c8bfb4", dropOnBg: "#eff6ff", dropOnBorder: "#2563eb",
  adminTagBg: "#dbeafe", adminTagText: "#1d4ed8", adminTagBorder: "#93c5fd",
  loginTagBg: "#ede8e0", loginTagText: "#374151",
  insight: "#ede8e0", insightText: "#4b5563",
  tableHead: "#ede8e0", tableRowEven: "#faf7f3", tableRowOdd: "#f5f0eb",
  tableText: "#1a1a2e", tableTextSub: "#374151",
  msgMine: "#dbeafe", msgMineBorder: "#93c5fd",
  msgOther: "#f5f0eb", msgOtherBorder: "#d6cfc4",
  msgText: "#1a1a2e", msgTextMuted: "#374151",
  diaryBg: "#f5f0eb",
};

function compressImage(file, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.9).split(",")[1]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const COLORS = [
  "#3b82f6", // 1위 - 파랑
  "#ef4444", // 2위 - 빨강
  "#22c55e", // 3위 - 초록
  "#f59e0b", // 4위 - 주황
  "#a78bfa", // 5위 - 보라
  "#ec4899", // 6위 - 핑크
  "#06b6d4", // 7위 - 시안
  "#84cc16", // 8위 - 연두
  "#f97316", // 9위 - 오렌지
  "#8b5cf6", // 10위 - 진보라
  "#0e7490","#b91c1c","#15803d","#b45309","#6d28d9",
  "#be185d","#0891b2","#4d7c0f","#c2410c","#1d4ed8",
  "#fcd34d","#86efac","#fca5a5","#c4b5fd","#fdba74",
  "#f9a8d4","#bef264","#c084fc","#60a5fa","#a3e635",
];

function DonutChart({ data, title, centerText, labelName, labelPct, labelAvg, T }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const R = 42, r = 24, cx = 50, cy = 50;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const start = cumulative; cumulative += pct;
    const a1 = start * 2 * Math.PI - Math.PI / 2;
    const a2 = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1o = cx + R * Math.cos(a1), y1o = cy + R * Math.sin(a1);
    const x2o = cx + R * Math.cos(a2), y2o = cy + R * Math.sin(a2);
    const x1i = cx + r * Math.cos(a1), y1i = cy + r * Math.sin(a1);
    const x2i = cx + r * Math.cos(a2), y2i = cy + r * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    const path = `M${x1o},${y1o} A${R},${R} 0 ${large},1 ${x2o},${y2o} L${x2i},${y2i} A${r},${r} 0 ${large},0 ${x1i},${y1i} Z`;
    return { ...d, path, color: COLORS[i % COLORS.length], pct: Math.round(pct * 1000) / 10 };
  });
  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: 12, marginBottom: 12 }}>
      {title && <div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 10 }}>{title}</div>}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <svg viewBox="0 0 100 100" style={{ width: 80, height: 80, flexShrink: 0 }}>
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
          {centerText && (<>
            <text x="50" y="47" textAnchor="middle" fill={T.text} fontSize="6" fontWeight="700">{centerText.line1}</text>
            <text x="50" y="56" textAnchor="middle" fill={T.textSub} fontSize="5">{centerText.line2}</text>
          </>)}
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 5, paddingBottom: 4, borderBottom: `1px solid ${T.cardBorder}` }}>
            <span style={{ flex: 2, fontSize: 10, color: T.textSub }}>{labelName || "종목명"}</span>
            <span style={{ flex: 1, fontSize: 10, color: T.textSub, textAlign: "center" }}>{labelPct || "비중"}</span>
            <span style={{ flex: 1, fontSize: 10, color: T.textSub, textAlign: "right" }}>{labelAvg || "평단"}</span>
          </div>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 2, minWidth: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ color: T.text, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.ticker}{s.tickerCode && s.isOverseas ? <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 400, marginLeft: 2 }}>{s.tickerCode}</span> : null}</span>
              </div>
              <span style={{ flex: 1, color: s.color, fontWeight: 700, textAlign: "center", fontSize: 11, whiteSpace: "nowrap" }}>{Number(s.pct).toFixed(1)}%</span>
              <span style={{ flex: 1, color: T.textSub, textAlign: "right", fontSize: 11, whiteSpace: "nowrap" }}>{s.avgPrice?.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PortfolioChart({ data, isAdmin, showWealth, onEdit, onChart, T }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const R = 40, r = 22, cx = 50, cy = 50;
  const slices = sorted.map((d, i) => {
    const pct = d.value / total;
    const start = cumulative; cumulative += pct;
    const a1 = start * 2 * Math.PI - Math.PI / 2;
    const a2 = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1o = cx + R * Math.cos(a1), y1o = cy + R * Math.sin(a1);
    const x2o = cx + R * Math.cos(a2), y2o = cy + R * Math.sin(a2);
    const x1i = cx + r * Math.cos(a1), y1i = cy + r * Math.sin(a1);
    const x2i = cx + r * Math.cos(a2), y2i = cy + r * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    const path = `M${x1o},${y1o} A${R},${R} 0 ${large},1 ${x2o},${y2o} L${x2i},${y2i} A${r},${r} 0 ${large},0 ${x1i},${y1i} Z`;
    const ret = d.isOverseas ? (d.returnRate ?? null) : (d.avgBuy ? ((d.current - d.avgBuy) / d.avgBuy * 100) : null);
    return { ...d, path, color: COLORS[i % COLORS.length], pct: Math.round(pct * 1000) / 10, ret };
  });

  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "12px 8px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub }}>📊 현재 포트폴리오</div>
        {data?.some?.(s => s.approximateData) && (
          <span style={{ fontSize: 10, background: T.section, border: `1px solid ${T.sectionBorder}`, color: "#f59e0b", borderRadius: 6, padding: "2px 7px" }}>
            ⚠️ 수량 미확인 · 금액 기준 표시
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <svg viewBox="0 0 100 100" style={{ width: "38%", maxWidth: 150, minWidth: 100, flexShrink: 0 }}>
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
          <text x="50" y="48" textAnchor="middle" fill={T.textSub} fontSize="7">포트폴리오</text>
          <text x="50" y="58" textAnchor="middle" fill={T.text} fontSize="7" fontWeight="700">{slices.length}종목</text>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          {(() => {
            const MAX = 29;
            const shown = slices.slice(0, MAX);
            const rest = slices.slice(MAX);
            const restValue = rest.reduce((sum, r) => sum + r.value, 0);
            const restPct = total > 0 ? Math.round(restValue / total * 1000) / 10 : 0;
            const all = [...shown, ...(rest.length > 0 ? [{ ticker: `기타 ${rest.length}종목`, pct: restPct, color: T.textMuted, isEtc: true }] : [])];
            const half = Math.ceil(all.length / 2);
            const col1 = all.slice(0, half), col2 = all.slice(half);
            const ColItem = ({ s }) => (
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: s.isEtc ? T.textMuted : T.text, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{s.ticker}{s.tickerCode && s.isOverseas ? <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 400, marginLeft: 2 }}>{s.tickerCode}</span> : null}</span>
                <span style={{ fontSize: 10, color: s.isEtc ? T.textMuted : T.textSub, fontWeight: 700, flexShrink: 0, marginLeft: 2 }}>{Number(s.pct).toFixed(1)}%</span>
              </div>
            );
            return (
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>{col1.map((s, i) => <ColItem key={i} s={s} />)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>{col2.map((s, i) => <ColItem key={i} s={s} />)}</div>
              </div>
            );
          })()}
        </div>
      </div>
      <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.cardBorder}` }}>
        <div style={{ display: "grid", gridTemplateColumns: showWealth ? "1.4fr 0.6fr 0.6fr 1fr 1.1fr" : "1.8fr 0.7fr 0.7fr 1.4fr", background: T.tableHead, padding: "7px 8px", gap: 4 }}>
          <span style={{ fontSize: 10, color: T.textSub }}>종목명</span>
          <span style={{ fontSize: 10, color: T.textSub, textAlign: "center" }}>비중</span>
          <span style={{ fontSize: 10, color: T.textSub, textAlign: "center" }}>수익률</span>
          <span style={{ fontSize: 10, color: T.textSub, textAlign: "right" }}>평단/현재가</span>
          {showWealth && <span style={{ fontSize: 10, color: "#22c55e", textAlign: "right" }}>수량/보유금액</span>}
        </div>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: showWealth ? "1.4fr 0.6fr 0.6fr 1fr 1.1fr" : "1.8fr 0.7fr 0.7fr 1.4fr", padding: "8px 8px", gap: 4, alignItems: "center", borderTop: `1px solid ${T.cardBorder}`, background: i % 2 === 0 ? T.tableRowEven : T.tableRowOdd }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span onClick={() => !s.isCash && onChart && onChart(s)}
                style={{ color: s.isCash ? "#f59e0b" : T.text, fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: (!s.isCash && onChart) ? "pointer" : "default", textDecoration: (!s.isCash && onChart) ? "underline dotted" : "none" }}>
                {s.ticker}{s.tickerCode && s.isOverseas ? <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 400, marginLeft: 3 }}>{s.tickerCode}</span> : null}
              </span>
              {isAdmin && onEdit && !s.isCash && (
                <button onClick={() => onEdit(s)} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 11, cursor: "pointer", padding: "2px 3px", flexShrink: 0, lineHeight: 1 }}>✏️</button>
              )}
            </div>
            <span style={{ color: T.text, fontWeight: 700, fontSize: 12, textAlign: "center" }}>{Number(s.pct).toFixed(1)}%</span>
            <span style={{ fontSize: 12, textAlign: "center", fontWeight: 700, color: s.isCash ? T.textMuted : s.ret === null ? T.textMuted : s.ret >= 0 ? "#ef4444" : "#3b82f6" }}>
              {s.isCash ? "-" : s.ret !== null ? (s.ret >= 0 ? "+" : "") + s.ret.toFixed(1) + "%" : "-"}
            </span>
            <div style={{ textAlign: "right" }}>
              {s.isCash ? (
                isAdmin
                  ? <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>{s.current?.toLocaleString()}원</div>
                  : <div style={{ fontSize: 11, color: T.textMuted }}>비공개</div>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{s.avgBuy?.toLocaleString()}원</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.current?.toLocaleString()}원</div>
                </>
              )}
            </div>
            {showWealth && (
              <div style={{ textAlign: "right" }}>
                {s.isCash ? (
                  isAdmin
                    ? <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{s.value?.toLocaleString()}원</div>
                    : <div style={{ fontSize: 11, color: T.textMuted }}>예수금 {Number(s.pct).toFixed(1)}%</div>
                ) : s.approximateData ? (
                  <><div style={{ fontSize: 10, color: "#f59e0b" }}>금액기준</div><div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{s.value?.toLocaleString()}원</div></>
                ) : (
                  <><div style={{ fontSize: 11, color: "#22c55e" }}>{s.qty?.toLocaleString()}주</div><div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>{s.value?.toLocaleString()}원</div></>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== 맵차트(트리맵) 헬퍼 함수들 =====
// Squarified treemap 알고리즘 (Bruls/Huizing/van Wijk) - 타일 면적이 실제 값 비율과 정확히 일치하도록 배치
function worstAspectRatio(row, shortSide) {
  const s = row.reduce((sum, it) => sum + it.area, 0);
  if (s <= 0) return Infinity;
  const areas = row.map(it => it.area);
  const rmax = Math.max(...areas);
  const rmin = Math.min(...areas);
  const w2 = shortSide * shortSide;
  const s2 = s * s;
  return Math.max((w2 * rmax) / s2, s2 / (w2 * rmin));
}

function squarify(items, x, y, w, h) {
  if (!items.length) return [];
  if (items.length === 1) return [{ ...items[0], x, y, w, h }];

  const shortSide = Math.min(w, h);

  let i = 1;
  let bestRow = items.slice(0, 1);
  let bestWorst = worstAspectRatio(bestRow, shortSide);
  while (i < items.length) {
    const row = items.slice(0, i + 1);
    const worst = worstAspectRatio(row, shortSide);
    if (worst <= bestWorst) { bestRow = row; bestWorst = worst; i++; }
    else break;
  }

  const rowArea = bestRow.reduce((s, it) => s + it.area, 0);
  const isWide = w >= h;
  let result = [];
  if (isWide) {
    const rowW = rowArea / h;
    let cy = y;
    bestRow.forEach(it => {
      const itH = rowArea > 0 ? h * (it.area / rowArea) : 0;
      result.push({ ...it, x, y: cy, w: rowW, h: itH });
      cy += itH;
    });
    const rest = items.slice(bestRow.length);
    if (rest.length) result = result.concat(squarify(rest, x + rowW, y, w - rowW, h));
  } else {
    const rowH = rowArea / w;
    let cx = x;
    bestRow.forEach(it => {
      const itW = rowArea > 0 ? w * (it.area / rowArea) : 0;
      result.push({ ...it, x: cx, y, w: itW, h: rowH });
      cx += itW;
    });
    const rest = items.slice(bestRow.length);
    if (rest.length) result = result.concat(squarify(rest, x, y + rowH, w, h - rowH));
  }
  return result;
}

// 등락률 → 색상 (한국 상하한가 ±30% 기준 클램프, 진한 빨강=급등 / 진한 파랑=급락)
function pctToColor(pct) {
  const p = Math.max(-30, Math.min(30, pct || 0));
  const t = Math.abs(p) / 30; // 0~1
  const hue = p >= 0 ? 0 : 217; // 빨강 / 파랑 (기존 앱의 #ef4444, #3b82f6 계열과 통일)
  const sat = 25 + t * 65;
  const light = 82 - t * 47;
  return `hsl(${hue}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%)`;
}

// 시총 비중 기반 "기타" 묶음 처리 - 임계치 미만 종목은 하나의 타일로 합치고, 가중평균 등락률로 색상 결정
// ✅ v1.5.11: 임계치를 1.5% → 0.4%로 낮춤 (기존 대비 최소 타일 크기를 약 1/4로 축소, 개별 종목 표시를 훨씬 늘림)
function buildTreemapItems(mapList, etcThresholdPct = 0.4) {
  if (!mapList || !mapList.length) return { items: [], total: 0 };
  const withCap = mapList.filter(s => s.marketCap && s.marketCap > 0);
  const total = withCap.reduce((s, it) => s + it.marketCap, 0);
  if (!total) return { items: [], total: 0 };

  const threshold = total * (etcThresholdPct / 100);
  const big = withCap.filter(s => s.marketCap >= threshold).sort((a, b) => b.marketCap - a.marketCap);
  const small = withCap.filter(s => s.marketCap < threshold);

  const items = big.map(s => ({ name: s.name, marketCap: s.marketCap, pctNum: s.pctNum ?? 0, isEtc: false }));

  if (small.length) {
    const smallTotal = small.reduce((s, it) => s + it.marketCap, 0);
    const weightedPct = smallTotal > 0
      ? small.reduce((s, it) => s + (it.pctNum ?? 0) * it.marketCap, 0) / smallTotal
      : 0;
    items.push({ name: `기타 ${small.length}종목`, marketCap: smallTotal, pctNum: weightedPct, isEtc: true });
  }

  return { items, total };
}

// ✅ v1.5.13: 업종별 그룹 묶기 (2단계 맵차트용). sectorMap이 없거나 매칭 안 되는 종목은 '미분류'로 처리.
function buildSectorGroups(mapList, sectorMap) {
  const valid = (mapList || []).filter(s => s.marketCap && s.marketCap > 0);
  const bySector = {};
  valid.forEach(s => {
    const sector = (sectorMap && sectorMap[s.name]) || '미분류';
    if (!bySector[sector]) bySector[sector] = [];
    bySector[sector].push(s);
  });
  return Object.entries(bySector)
    .map(([sector, stocks]) => ({ sector, stocks, marketCap: stocks.reduce((sum, s) => sum + s.marketCap, 0) }))
    .sort((a, b) => b.marketCap - a.marketCap);
}

export default function App() {
  // ✅ 다크/라이트 모드
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("jb_dark_mode") !== "false");
  const T = darkMode ? DARK : LIGHT;
  const toggleDarkMode = () => { const n = !darkMode; setDarkMode(n); localStorage.setItem("jb_dark_mode", String(n)); };

  // 세션ID
  const [mySessionId] = useState(() => {
    let id = localStorage.getItem("jb_session_id");
    if (!id) { id = "user_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("jb_session_id", id); }
    return id;
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [viewerPinInput, setViewerPinInput] = useState("");
  const [viewerPinError, setViewerPinError] = useState("");
  const [images, setImages] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [chartModal, setChartModal] = useState(null); // { ticker, tickerCode, isOverseas }
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [showTrades, setShowTrades] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState('day');
  const [chartRange, setChartRange] = useState('3mo'); // 기간 선택
  const [chartTooltip, setChartTooltip] = useState(null); // { x, y, candle }
  // ✅ v1.5.19: 개별 거래(매수/매도 1건) 수정·삭제용 - OCR 오인식(예: 19주→1주) 발견 시 직접 교정할 수 있도록
  const [tradeEditModal, setTradeEditModal] = useState(null); // { trade, ticker }
  const [teDate, setTeDate] = useState("");
  const [teType, setTeType] = useState("매수");
  const [tePrice, setTePrice] = useState("");
  const [teQty, setTeQty] = useState("");
  const [memos, setMemos] = useState({});
  const [memoEditing, setMemoEditing] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  const [portfolios, setPortfolios] = useState({});
  const [activeAccount, setActiveAccount] = useState("all");
  const [portfolioLoading, setPortfolioLoading] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [uploadingAccount, setUploadingAccount] = useState(null);
  const [merging, setMerging] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [treemapMarket, setTreemapMarket] = useState('kospi'); // 맵차트 코스피/코스닥 토글
  const [showSectorView, setShowSectorView] = useState(false); // 업종별 2단계 맵차트 토글
  const [sectorMap, setSectorMap] = useState(null); // { 종목명: 업종명 } - 최초 토글 시에만 지연 로딩
  const [sectorMapLoading, setSectorMapLoading] = useState(false);
  const [concentrationData, setConcentrationData] = useState(null); // [{date, ratio}] - 삼성전자+SK하이닉스 / 코스피 전체 시총 비율(6개월)
  const [concentrationLoading, setConcentrationLoading] = useState(false);
  const [concentrationError, setConcentrationError] = useState(null);
  const [concentrationTooltip, setConcentrationTooltip] = useState(null); // { date, ratio }
  const [performance, setPerformance] = useState({}); // 날짜별 성과 데이터
  const [perfSaving, setPerfSaving] = useState(false);
  const [perfRange, setPerfRange] = useState('mine');
  const [perfDetailModal, setPerfDetailModal] = useState(false);
  const [indexChartData, setIndexChartData] = useState({}); // { range: { kospi: [...], kosdaq: [...] } }
  const [indexChartLoading, setIndexChartLoading] = useState(false);
  const [perfTooltip, setPerfTooltip] = useState(null); // { date, myVal, kospi, kosdaq }
  const [historySubTab, setHistorySubTab] = useState("buy");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showWealth, setShowWealth] = useState(false);
  // 구루의 의견들 — 전문가별 롱/숏/시장 전망 기록
  const [gurus, setGurus] = useState([]);
  const [guruModal, setGuruModal] = useState(null); // null | 'new' | 편집할 entry 객체
  const [guruForm, setGuruForm] = useState({ date:"", guru:"", target:"", position:"long", source:"", sourceUrl:"", summary:"", verdict:"pending", memo:"" });
  const [guruFilter, setGuruFilter] = useState("all");
  const [editStockModal, setEditStockModal] = useState(null);
  const [portfolioEditMode, setPortfolioEditMode] = useState(false);
  const [editStockQty, setEditStockQty] = useState("");
  const [editStockAvg, setEditStockAvg] = useState("");
  const [editStockName, setEditStockName] = useState("");
  const [accounts, setAccounts] = useState([
    { id: "main", name: "삼성증권 본계좌" },
    { id: "pension", name: "삼성증권 연금저축" },
    { id: "irp", name: "삼성증권 퇴직연금IRP" },
    { id: "dc", name: "삼성증권 퇴직연금DC" },
    { id: "hana", name: "하나증권" },
    { id: "ksfc", name: "한국증권금융" },
    { id: "kb_isa", name: "KB ISA" },
  ]);
  const [addAccModal, setAddAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [manualModal, setManualModal] = useState(null);
  const [manualTicker, setManualTicker] = useState("");
  const [manualMode, setManualMode] = useState("stock"); // "stock" | "cash"
  const [manualCashAmount, setManualCashAmount] = useState("");
  const [manualTickerCode, setManualTickerCode] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [manualAvg, setManualAvg] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [mainText, setMainText] = useState({ emoji: "🐜", title: "존버일기장", subtitle: "존버는 승리한다.\n왜냐하면 승리하기 때문이다.", html: null });
  const [editingMain, setEditingMain] = useState(false);
  const [editDraft, setEditDraft] = useState({});
  const richEditorRef = useRef(null);
  // 일기장
  const [diaryPosts, setDiaryPosts] = useState([]);
  const [diaryText, setDiaryText] = useState("");
  const [diaryNickname, setDiaryNickname] = useState("");
  const [diaryPassword, setDiaryPassword] = useState("");
  const [diarySecret, setDiarySecret] = useState(false);
  const [diaryLinkUrl, setDiaryLinkUrl] = useState("");
  const [diaryReplyTo, setDiaryReplyTo] = useState(null);
  const [diaryEditModal, setDiaryEditModal] = useState(null);
  const [diaryEditText, setDiaryEditText] = useState("");
  const [diaryEditPw, setDiaryEditPw] = useState("");
  const [diaryDeleteModal, setDiaryDeleteModal] = useState(null);
  const [diaryDeletePw, setDiaryDeletePw] = useState("");
  const [linkPreviews, setLinkPreviews] = useState({});
  const [previewDraft, setPreviewDraft] = useState(null);
  const fileRef = useRef(null);
  const portfolioRef = useRef(null);

  // 버전 체크
  useEffect(() => {
    const stored = localStorage.getItem("tradememo_version");
    fetch("/api/version", { cache: "no-store" }).then(r => r.json()).then(d => {
      const sv = d.version;
      if (sv && sv !== "dev") {
        if (stored && stored !== sv) { localStorage.setItem("tradememo_version", sv); window.location.reload(true); }
        else localStorage.setItem("tradememo_version", sv);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // 저장된 PIN으로 데이터 로드 (없으면 조회 PIN으로 시도)
    const storedPin = sessionStorage.getItem("jb_pin") || "";
    const loadPin = storedPin || "2026";
    fetch("/api/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: loadPin })
    }).then(r => r.json()).then(d => {
      if (d.error === "Unauthorized") return;
      // 저장된 PIN이 있으면 자동 로그인 상태 복원
      if (storedPin === "4254") { setIsAdmin(true); setIsViewer(true); }
      else if (storedPin === "2026") setIsViewer(true);
      if (d.records) setAllRecords(d.records);
      if (d.portfolios) {
        let portfoliosToSet = d.portfolios;
        if (d.livePrices) {
          portfoliosToSet = Object.fromEntries(Object.entries(d.portfolios).map(([accId, p]) => [accId, {
            ...p, stocks: (p.stocks || []).map(s => {
              const lp = d.livePrices[s.ticker];
              if (!lp || s.approximateData) return s;
              if (s.isOverseas) {
                const krwPrice = typeof lp === 'object' ? lp.krw : lp;
                if (!krwPrice) return s;
                return { ...s, currentValue: Math.round(krwPrice * s.quantity) };
              }
              return { ...s, currentPrice: lp, currentValue: Math.round(lp * s.quantity) };
            })
          }]));
        }
        setPortfolios(portfoliosToSet);
      }
      if (d.accounts && d.accounts.length > 0) setAccounts(d.accounts);
      if (d.mainText) setMainText(d.mainText);
      if (d.livePrices) setLivePrices(d.livePrices);
      if (d.priceUpdatedAt) setLastUpdated(d.priceUpdatedAt);
      if (d.memos) setMemos(d.memos);
      if (d.performance) setPerformance(d.performance);
      if (d.gurus) setGurus(d.gurus);
    }).catch(() => {});
    // 5분마다 Redis에서 최신 가격 자동 로드 (다른 사람이 갱신해도 반영)
    const priceRefreshInterval = setInterval(() => {
      const pin = sessionStorage.getItem("jb_pin") || "2026";
      fetch("/api/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      }).then(r => r.json()).then(d => {
        if (d.error || !d.livePrices) return;
        setLivePrices(d.livePrices);
        if (d.priceUpdatedAt) setLastUpdated(d.priceUpdatedAt);
        // 포트폴리오도 최신 가격으로 업데이트
        setPortfolios(prev => {
          if (!prev || Object.keys(prev).length === 0) return prev;
          return Object.fromEntries(Object.entries(prev).map(([accId, p]) => [accId, {
            ...p, stocks: (p.stocks || []).map(s => {
              const lp = d.livePrices[s.ticker];
              if (!lp || s.approximateData) return s;
              if (s.isOverseas) {
                const krwPrice = typeof lp === 'object' ? lp.krw : lp;
                if (!krwPrice) return s;
                return { ...s, currentValue: Math.round(krwPrice * s.quantity) };
              }
              return { ...s, currentPrice: lp, currentValue: Math.round(lp * s.quantity) };
            })
          }]));
        });
      }).catch(() => {});
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(priceRefreshInterval);
  }, []);

  useEffect(() => {
    loadMarketData();
    loadConcentrationHistory(); // 6개월치라 자주 안 바뀜 - 5분 간격 갱신 대상에서는 제외, 최초 1회만
    const marketInterval = setInterval(loadMarketData, 5 * 60 * 1000);

    fetch("/api/diary-load").then(r => r.json()).then(d => {
      if (d.posts) {
        setDiaryPosts(d.posts);
        d.posts.forEach(p => { if (p.linkUrl) fetchLinkPreview(p.linkUrl, p.id); });
      }
    }).catch(() => {});
    return () => clearInterval(marketInterval);
  }, []);

  useEffect(() => {
    if (editingMain && richEditorRef.current) {
      const def = `<div style="text-align:center"><span style="font-size:40px">${editDraft.emoji||"🐜"}</span><br/><span style="font-size:22px;font-weight:900;color:${T.text}">${editDraft.title||"존버일기장"}</span><br/><br/><span style="font-size:18px;font-weight:700;color:#f59e0b">${(editDraft.subtitle||"").replace(/\n/g,"<br/>")}</span></div>`;
      richEditorRef.current.innerHTML = editDraft.html || def;
    }
  }, [editingMain]);

  function checkViewerPin() {
    if (viewerPinInput === VIEWER_PIN) {
      sessionStorage.setItem("jb_pin", viewerPinInput);
      setIsViewer(true); setViewerPinInput(""); setViewerPinError("");
      setActiveTab("home"); if (!marketData) loadMarketData(); if (!concentrationData) loadConcentrationHistory(); loadIndexChart(perfRange);
    } else { setViewerPinError("코드가 틀렸습니다."); setViewerPinInput(""); }
  }
  function checkPin() {
    if (pinInput === ADMIN_PIN) {
      sessionStorage.setItem("jb_pin", pinInput);
      setIsAdmin(true); setIsViewer(true); setShowPin(false); setPinInput(""); setPinError("");
      setActiveTab("home"); if (!marketData) loadMarketData(); if (!concentrationData) loadConcentrationHistory(); loadIndexChart(perfRange);
    } else { setPinError("PIN이 틀렸습니다."); setPinInput(""); }
  }

  async function fetchLinkPreview(url, postId) {
    try {
      const res = await fetch("/api/link-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (postId) setLinkPreviews(prev => ({ ...prev, [postId]: data }));
      else setPreviewDraft(data);
    } catch {}
  }

  async function savePerformance() {
    if (perfSaving) return;
    setPerfSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 전체 포트폴리오 총평가액 계산
      let totalValue = 0;
      const accountValues = {};
      Object.entries(portfolios).forEach(([accId, p]) => {
        const accValue = (p.stocks || []).reduce((sum, s) => {
          if (s.isCash) {
            // 예수금: currentPrice가 곧 금액
            return sum + (s.currentPrice || 0);
          }
          if (s.isOverseas) {
            // 해외주식: livePrices는 원화환산가 * quantity, 없으면 currentValue
            const krwPrice = livePrices[s.ticker];
            return sum + (krwPrice ? Math.round(krwPrice * (s.quantity || 0)) : (s.currentValue || 0));
          }
          // 국내주식: 현재가 * 수량
          const price = livePrices[s.ticker] || s.currentPrice || s.avgBuyPrice || 0;
          return sum + price * (s.quantity || 0);
        }, 0);
        accountValues[accId] = Math.round(accValue);
        totalValue += accValue;
      });
      totalValue = Math.round(totalValue);

      // 오늘 날짜 제외한 가장 최근 이전 날짜 데이터
      const sortedDates = Object.keys(performance).sort();
      const prevDates = sortedDates.filter(d => d < today);
      const lastDate = prevDates[prevDates.length - 1] || null;
      const lastData = lastDate ? performance[lastDate] : null;

      // 일간 수익률 계산
      const prevTotalValue = lastData?.totalValue || totalValue;
      const dailyReturn = prevTotalValue > 0
        ? (totalValue - prevTotalValue) / prevTotalValue * 100
        : 0;

      // 누적 지수 계산 (TWR 방식)
      const prevIndex = lastData?.cumulativeIndex || 100;
      const cumulativeIndex = parseFloat((prevIndex * (1 + dailyReturn / 100)).toFixed(4));

      // 코스피/코스닥 현재값
      const kospi = marketData?.indices?.kospi?.price || null;
      const kosdaq = marketData?.indices?.kosdaq?.price || null;

      // 코스피/코스닥 누적 지수
      const prevKospiIndex = lastData?.kospiIndex || 100;
      const prevKosdaqIndex = lastData?.kosdaqIndex || 100;
      const prevKospi = lastData?.kospi || kospi;
      const prevKosdaq = lastData?.kosdaq || kosdaq;

      const kospiDailyReturn = (prevKospi && kospi)
        ? (kospi - prevKospi) / prevKospi * 100 : 0;
      const kosdaqDailyReturn = (prevKosdaq && kosdaq)
        ? (kosdaq - prevKosdaq) / prevKosdaq * 100 : 0;

      const kospiIndex = parseFloat((prevKospiIndex * (1 + kospiDailyReturn / 100)).toFixed(4));
      const kosdaqIndex = parseFloat((prevKosdaqIndex * (1 + kosdaqDailyReturn / 100)).toFixed(4));

      // 계좌별 누적 지수
      const accountsPerf = {};
      Object.entries(accountValues).forEach(([accId, value]) => {
        const prevAccData = lastData?.accounts?.[accId];
        const prevAccValue = prevAccData?.value || value;
        const accDaily = prevAccValue > 0 ? (value - prevAccValue) / prevAccValue * 100 : 0;
        const prevAccIndex = prevAccData?.cumulativeIndex || 100;
        accountsPerf[accId] = {
          value,
          // 일간(전일 대비) 등락률 — 예전엔 계산만 하고 저장을 안 해서, 화면에는 계좌 추적 시작 이후
          // 누적 수익률(cumulativeIndex-100)만 표시되고 있었음. "일간" 박스 바로 아래라 오해하기 쉬웠던 부분.
          dailyReturn: parseFloat(accDaily.toFixed(4)),
          cumulativeIndex: parseFloat((prevAccIndex * (1 + accDaily / 100)).toFixed(4)),
        };
      });

      const todayData = {
        totalValue: Math.round(totalValue),
        dailyReturn: parseFloat(dailyReturn.toFixed(4)),
        cumulativeIndex,
        kospi, kosdaq,
        kospiIndex,
        kosdaqIndex,
        accounts: accountsPerf,
        savedAt: new Date().toISOString(),
      };

      const newPerformance = { ...performance, [today]: todayData };
      setPerformance(newPerformance);

      // Redis 저장
      const pin = sessionStorage.getItem('jb_pin') || '';
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, records: allRecords, portfolios, accounts, mainText, memos, performance: newPerformance }),
      });
      alert(`📊 ${today} 성과 기록 완료!
누적수익률: ${(cumulativeIndex - 100).toFixed(2)}%
코스피 대비: ${(cumulativeIndex - kospiIndex).toFixed(2)}%p`);
    } catch (e) {
      alert('성과 기록 실패: ' + e.message);
    }
    setPerfSaving(false);
  }

  async function deletePerformance(date) {
    if (!window.confirm(`${date} 성과 기록을 삭제할까요?`)) return;
    const newPerf = { ...performance };
    delete newPerf[date];
    setPerformance(newPerf);
    const pin = sessionStorage.getItem('jb_pin') || '';
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, records: allRecords, portfolios, accounts, mainText, memos, performance: newPerf }),
    });
  }

  async function loadIndexChart(range) {
    // '내 기록(mine)'은 별도 API 레인지가 아니라, '전체' 데이터를 받아서 화면에서
    // 첫 성과기록일 기준으로 잘라 쓰는 방식이므로 실제 조회/캐시 키는 항상 'all'로 통일
    const apiRange = range === 'mine' ? 'all' : range;
    setIndexChartLoading(true);
    try {
      // stockprice.js의 indexChart 타입 사용
      // ^KS11, ^KQ11은 원화 지수 - 환율 변환 없이 원본값 반환
      // 전체: 항상 1년치 조회 (성과 기록 날짜와 무관하게 코스피/코스닥 흐름 확인)
      const firstPerfDate = null;
      const [ksRes, kqRes] = await Promise.all([
        fetch('/api/stockprice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'indexChart', symbol: '^KS11', range: apiRange, firstPerfDate })
        }),
        fetch('/api/stockprice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'indexChart', symbol: '^KQ11', range: apiRange, firstPerfDate })
        }),
      ]);
      const [ksData, kqData] = await Promise.all([ksRes.json(), kqRes.json()]);
      setIndexChartData(prev => ({
        ...prev,
        [apiRange]: { kospi: ksData.data || [], kosdaq: kqData.data || [] }
      }));
    } catch(e) { console.error('indexChart 로드 실패:', e); }
    setIndexChartLoading(false);
  }

  async function loadMarketData() {
    setMarketLoading(true);
    try {
      const r = await fetch('/api/stockprice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'market' }) });
      const d = await r.json();
      setMarketData(d);
    } catch {}
    setMarketLoading(false);
  }

  // ✅ v1.5.18: 삼성전자+SK하이닉스 시총 / 코스피 전체 시총 비율의 6개월 히스토리 차트용
  async function loadConcentrationHistory() {
    setConcentrationLoading(true);
    setConcentrationError(null);
    try {
      const r = await fetch('/api/stockprice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'concentrationHistory', range: '6mo' }) });
      const d = await r.json();
      setConcentrationData(d.data || []);
      if (d.error) setConcentrationError(d.error);
    } catch (e) {
      setConcentrationData([]);
      setConcentrationError(e.message);
    }
    setConcentrationLoading(false);
  }

  // ✅ v1.5.13: 업종별 맵차트용 - 최초 "업종별 보기" 토글 시에만 1회 호출 (서버에서 1시간 캐시)
  async function loadSectorMap() {
    if (sectorMap || sectorMapLoading) return;
    setSectorMapLoading(true);
    try {
      const r = await fetch('/api/stockprice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'sectorMap' }) });
      const d = await r.json();
      setSectorMap(d.sectorMap || {});
    } catch {
      setSectorMap({});
    }
    setSectorMapLoading(false);
  }

  async function openChart(stock) {
    setChartModal(stock);
    setChartTimeframe('day');
    setChartRange('3mo');
    setShowTrades(true);
    setChartTooltip(null);
    setMemoEditing(false);
    setMemoDraft(memos[stock.ticker] || '');
    await loadChartData(stock, 'day', '3mo');
  }

  async function loadChartData(stock, timeframe, range) {
    setChartLoading(true);
    setChartData([]);
    setChartTooltip(null);
    try {
      const res = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: stock.ticker,
          tickerCode: stock.tickerCode || null,
          timeframe,
          range: range || chartRange,
          isOverseas: stock.isOverseas || false,
          currentPrice: livePrices[stock.ticker] || null,
        })
      });
      const data = await res.json();
      if (data.candles && data.candles.length > 0) {
        setChartData(data.candles);
      }
      // chart.js에서 보정 비율 반환 시 avgBuy도 보정
      if (data.scale && data.scale !== 1 && chartModal?.avgBuy) {
        setChartModal(prev => prev ? { ...prev, avgBuy: Math.round(prev.avgBuy * data.scale) } : prev);
      }
    } catch (e) {
      console.error('차트 로드 실패:', e);
    }
    setChartLoading(false);
  }

  async function saveMemo(ticker, text) {
    const newMemos = { ...memos, [ticker]: text };
    setMemos(newMemos);
    setMemoEditing(false);
    const pin = sessionStorage.getItem('jb_pin') || '';
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, records: allRecords, portfolios, accounts, mainText, memos: newMemos })
    });
  }

  async function addDiaryPost() {
    if (!diaryText.trim() && !diaryLinkUrl.trim()) return;
    const post = {
      text: diaryText.trim(), nickname: isAdmin ? "주인장" : (diaryNickname.trim() || "익명"),
      isAdmin, isSecret: diarySecret, password: isAdmin ? null : (diaryPassword || null),
      replyTo: diaryReplyTo?.id || null,
      replyPreview: diaryReplyTo ? `${diaryReplyTo.nickname}: ${diaryReplyTo.text.slice(0,40)}${diaryReplyTo.text.length>40?"...":""}` : null,
      linkUrl: diaryLinkUrl.trim() || null, sessionId: isAdmin ? "admin" : mySessionId,
    };
    const res = await fetch("/api/diary-save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add", post }) });
    const d = await res.json();
    if (d.posts) { setDiaryPosts(d.posts); const np = d.posts[0]; if (np?.linkUrl) fetchLinkPreview(np.linkUrl, np.id); }
    setDiaryText(""); setDiaryLinkUrl(""); setDiarySecret(false); setDiaryReplyTo(null); setDiaryPassword(""); setPreviewDraft(null);
  }
  async function editDiaryPost() {
    const post = diaryEditModal; if (!post) return;
    if (!isAdmin && post.password && diaryEditPw !== post.password) { alert("비밀번호가 틀렸어요."); return; }
    const res = await fetch("/api/diary-save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "edit", post: { id: post.id, text: diaryEditText } }) });
    const d = await res.json(); if (d.posts) setDiaryPosts(d.posts);
    setDiaryEditModal(null); setDiaryEditText(""); setDiaryEditPw("");
  }
  async function deleteDiaryPost() {
    const post = diaryDeleteModal; if (!post) return;
    if (!isAdmin && post.password && diaryDeletePw !== post.password) { alert("비밀번호가 틀렸어요."); return; }
    const res = await fetch("/api/diary-save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", post: { id: post.id } }) });
    const d = await res.json(); if (d.posts) setDiaryPosts(d.posts);
    setDiaryDeleteModal(null); setDiaryDeletePw("");
  }

  async function saveMainText(htmlContent) {
    const final = { ...editDraft, html: htmlContent || null };
    setMainText(final); setEditingMain(false);
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: sessionStorage.getItem('jb_pin')||"", records: allRecords, portfolios, accounts, mainText: final }) });
  }

  async function addAccount() {
    const name = newAccName.trim(); if (!name) return alert("계좌명을 입력해주세요.");
    const id = "acc_" + Date.now();
    const newAccounts = [...accounts, { id, name }];
    setAccounts(newAccounts); setNewAccName(""); setAddAccModal(false);
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: sessionStorage.getItem('jb_pin')||"", records: allRecords, portfolios, accounts: newAccounts, mainText }) });
  }
  async function deleteAccount(accountId) {
    const acc = accounts.find(a => a.id === accountId);
    if (!window.confirm(`⚠️ "${acc?.name}" 계좌를 완전히 삭제할까요?\n\n계좌와 포트폴리오 내역이 모두 삭제됩니다.`)) return;
    const newAccounts = accounts.filter(a => a.id !== accountId);
    const newPortfolios = { ...portfolios }; delete newPortfolios[accountId];
    setAccounts(newAccounts); setPortfolios(newPortfolios);
    const pin = sessionStorage.getItem('jb_pin') || '';
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, records: allRecords, portfolios: newPortfolios, accounts: newAccounts, mainText }) });
  }

  async function saveEditStock() {
    const { accountId, stock } = editStockModal;
    const qty = parseInt(editStockQty), avg = parseInt(editStockAvg.replace(/,/g, ""));
    const newName = editStockName.trim();
    if (isNaN(qty) || isNaN(avg)) return alert("수량과 평단가를 올바르게 입력해주세요.");
    if (!newName) return alert("종목명을 입력해주세요.");
    const existing = portfolios[accountId]; if (!existing) return;
    // 종목명을 고쳤다면(OCR 오인식 교정 등) ticker 자체를 바꿔치기. 가격 캐시(livePrices)는 새 이름으로
    // 아직 안 채워져 있을 수 있어서, 새 이름 → 기존 이름 → 직전 현재가 순으로 폴백해서 평가금액을 계산한다.
    const updatedStocks = existing.stocks.map(s => s.ticker === stock.ticker
      ? { ...s, ticker: newName, quantity: qty, avgBuyPrice: avg, currentValue: Math.round((livePrices[newName] || livePrices[s.ticker] || s.currentPrice || avg) * qty) }
      : s);
    const totalValue = updatedStocks.reduce((sum, s) => sum + (s.currentValue || 0), 0);
    const newPortfolios = { ...portfolios, [accountId]: { ...existing, stocks: updatedStocks, totalValue } };
    setPortfolios(newPortfolios); setEditStockModal(null); setEditStockQty(""); setEditStockAvg(""); setEditStockName("");
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: sessionStorage.getItem('jb_pin')||"", records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
    alert(`✅ ${newName} 수정 완료!`);
  }
  async function deleteStock(accountId, ticker) {
    if (!window.confirm(`"${ticker}" 종목을 삭제할까요?`)) return;
    const existing = portfolios[accountId]; if (!existing) return;
    const updatedStocks = existing.stocks.filter(s => s.ticker !== ticker);
    const totalValue = updatedStocks.reduce((sum, s) => sum + (s.currentValue || 0), 0);
    const newPortfolios = { ...portfolios, [accountId]: { ...existing, stocks: updatedStocks, totalValue } };
    setPortfolios(newPortfolios);
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: sessionStorage.getItem('jb_pin')||"", records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
  }
  // ✅ v1.5.19: 개별 거래 1건 수정/삭제 - AI 인식 오류(예: 수량 오독)를 사용자가 직접 교정.
  // allRecords[].result.stocks[].trades[] 안의 해당 trade 객체를 참조 동일성(===)으로 찾아 교체/제거한다.
  // (tradesByDate는 flatMap/filter로만 구성되어 trade 객체 자체는 원본과 동일 참조이므로 안전하게 비교 가능)
  function openTradeEdit(trade, ticker) {
    setTradeEditModal({ trade, ticker });
    setTeDate(trade.date || "");
    setTeType(trade.type === "매도" ? "매도" : "매수");
    setTePrice(String(trade.price ?? ""));
    setTeQty(String(trade.quantity ?? ""));
  }
  async function saveTradeEdit() {
    const { trade, ticker } = tradeEditModal;
    const price = parseInt(String(tePrice).replace(/,/g, ""), 10);
    const qty = parseInt(teQty, 10);
    if (!teDate || isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0) return alert("날짜/가격/수량을 올바르게 입력해주세요.");
    const updatedTrade = { date: teDate, type: teType, price, quantity: qty, total: price * qty };
    // ✅ v1.5.21: trade는 화면에 보이는 "그날 매수/매도 합산" 항목. _rawTrades에 합쳐지기 전 원본
    // 개별 체결(분할 체결 등)들이 들어있으면, 그 원본들을 전부 지우고 새 합산값 1건으로 교체한다.
    // (원본이 1건뿐이었으면 그 1건만 교체 - 기존과 동일하게 동작)
    const rawSet = new Set(trade._rawTrades && trade._rawTrades.length ? trade._rawTrades : [trade]);
    const newRecords = allRecords.map(r => {
      if (!r.result?.stocks) return r;
      const newStocks = r.result.stocks.map(s => {
        if (s.ticker !== ticker) return s;
        const kept = (s.trades || []).filter(t => !rawSet.has(t));
        return { ...s, trades: [...kept, updatedTrade] };
      });
      return { ...r, result: { ...r.result, stocks: newStocks } };
    });
    const pin = sessionStorage.getItem('jb_pin') || '';
    const res = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, records: newRecords, portfolios, accounts, mainText }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) return alert("저장 실패: " + (data.error || `HTTP ${res.status}`));
    setAllRecords(newRecords); setTradeEditModal(null); setChartTooltip(null);
    alert("✅ 거래 기록 수정 완료!");
  }
  async function deleteTradeEntry(trade, ticker) {
    const rawCount = trade._rawTrades && trade._rawTrades.length ? trade._rawTrades.length : 1;
    if (!window.confirm(`${ticker} ${trade.date} ${trade.type} ${trade.quantity}주(체결 ${rawCount}건 합산) 거래 기록을 삭제할까요?\n(포트폴리오 보유수량/평단가는 별도 데이터라 자동으로는 바뀌지 않아요. 필요하면 "종목 수정"에서 직접 맞춰주세요.)`)) return;
    const rawSet = new Set(trade._rawTrades && trade._rawTrades.length ? trade._rawTrades : [trade]);
    const newRecords = allRecords.map(r => {
      if (!r.result?.stocks) return r;
      const newStocks = r.result.stocks.map(s => {
        if (s.ticker !== ticker) return s;
        return { ...s, trades: (s.trades || []).filter(t => !rawSet.has(t)) };
      });
      return { ...r, result: { ...r.result, stocks: newStocks } };
    });
    const pin = sessionStorage.getItem('jb_pin') || '';
    const res = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, records: newRecords, portfolios, accounts, mainText }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) return alert("삭제 실패: " + (data.error || `HTTP ${res.status}`));
    setAllRecords(newRecords); setTradeEditModal(null); setChartTooltip(null);
    alert("🗑️ 거래 기록 삭제 완료!");
  }
  // 구루의 의견 저장/삭제 — save.js가 필드별로 독립 저장하므로 gurus만 보내도 안전함
  async function saveGuruOpinion() {
    if (!guruForm.date || !guruForm.guru.trim() || !guruForm.target.trim()) {
      return alert("날짜 · 구루명 · 대상은 필수예요.");
    }
    const isEdit = guruModal && guruModal !== 'new';
    const entry = {
      id: isEdit ? guruModal.id : ('guru_' + Date.now()),
      date: guruForm.date,
      guru: guruForm.guru.trim(),
      target: guruForm.target.trim(),
      position: guruForm.position,
      source: guruForm.source.trim(),
      sourceUrl: guruForm.sourceUrl.trim(),
      summary: guruForm.summary.trim(),
      verdict: guruForm.verdict,
      memo: guruForm.memo.trim(),
      createdAt: isEdit ? (guruModal.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };
    const newGurus = isEdit ? gurus.map(g => g.id === entry.id ? entry : g) : [...gurus, entry];
    setGurus(newGurus);
    setGuruModal(null);
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: sessionStorage.getItem('jb_pin')||"", gurus: newGurus }) });
  }
  async function deleteGuruOpinion(id) {
    if (!window.confirm("이 의견 기록을 삭제할까요?")) return;
    const newGurus = gurus.filter(g => g.id !== id);
    setGurus(newGurus);
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: sessionStorage.getItem('jb_pin')||"", gurus: newGurus }) });
  }
  async function saveManualStock() {
    const pin = sessionStorage.getItem('jb_pin') || '';
    // 예수금 모드
    if (manualMode === "cash") {
      const amount = parseInt(manualCashAmount.replace(/,/g, ""));
      if (!amount || amount <= 0) return alert("예수금 금액을 입력해주세요.");
      const existing = portfolios[manualModal.accountId] || { stocks: [], totalValue: 0 };
      const filtered = (existing.stocks || []).filter(s => !s.isCash);
      const cashStock = { ticker: "예수금", isCash: true, quantity: 1, avgBuyPrice: amount, currentPrice: amount, currentValue: amount };
      const newStocks = [...filtered, cashStock];
      const totalValue = newStocks.reduce((sum, s) => sum + (s.currentValue || 0), 0);
      const newPortfolios = { ...portfolios, [manualModal.accountId]: { ...existing, stocks: newStocks, totalValue } };
      setPortfolios(newPortfolios);
      setManualModal(null); setManualCashAmount(""); setManualMode("stock");
      await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
      return;
    }
    const ticker = manualTicker.trim(), qty = parseInt(manualQty), avg = parseInt(manualAvg.replace(/,/g,"")), price = parseInt(manualPrice.replace(/,/g,"")) || avg;
    if (!ticker || !qty || !avg) return alert("종목명, 수량, 평단가를 모두 입력해주세요.");
    const accountId = manualModal.accountId;
    const newStock = { ticker, tickerCode: manualTickerCode.trim() || null, quantity: qty, avgBuyPrice: avg, currentPrice: price, currentValue: price * qty };
    const existing = portfolios[accountId];
    let stocks = existing ? [...(existing.stocks || [])] : [];
    const idx = stocks.findIndex(s => s.ticker === ticker);
    if (idx >= 0) stocks[idx] = newStock; else stocks.push(newStock);
    const totalValue = stocks.reduce((s, st) => s + st.currentValue, 0);
    const newPortfolios = { ...portfolios, [accountId]: { stocks, totalValue } };
    setPortfolios(newPortfolios);
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: sessionStorage.getItem('jb_pin')||"", records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
    setManualTicker(""); setManualTickerCode(""); setManualQty(""); setManualAvg(""); setManualPrice(""); setManualModal(null);
    alert(`✅ ${ticker} 저장 완료!`);
  }
  async function analyzePortfolio(file, accountId) {
    setPortfolioLoading(accountId);
    try {
      const base64 = await compressImage(file, 800);
      const res = await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: base64 }) });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      const existing = portfolios[accountId];
      let allStocks = [...(data.stocks || [])];
      if (existing?.stocks?.length > 0) {
        const newTickers = new Set(data.stocks.map(s => s.ticker));
        allStocks = [...existing.stocks.filter(s => !newTickers.has(s.ticker)), ...data.stocks];
      }
      allStocks = allStocks.map(s => {
        if (s.approximateData) return { ...s, currentValue: s.currentPrice };
        if (s.isOverseas) return { ...s, currentValue: Math.round(s.currentValue || 0) }; // 해외주식: 원화 평가금액 그대로 사용, 소수점 제거
        return { ...s, currentValue: Math.round(s.currentPrice * s.quantity) }; // 국내: 소수점 제거
      });
      const totalValue = Math.round(allStocks.reduce((sum, s) => sum + (s.currentValue || 0), 0));
      const isApproximate = data.stocks?.some(s => s.approximateData === true);
      const merged = { stocks: allStocks, totalValue, approximateData: isApproximate };
      const newPortfolios = { ...portfolios, [accountId]: merged };
      setPortfolios(newPortfolios);
      await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: sessionStorage.getItem('jb_pin')||"", records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
      alert(existing?.stocks ? `✅ 추가 완료! 총 ${merged.stocks.length}종목` : `✅ 저장 완료! ${merged.stocks.length}종목`);
    } catch(e) { alert("오류: " + e.message); }
    setPortfolioLoading(null);
  }
  async function fetchLivePrices(stocks) {
    if (!stocks || stocks.length === 0) return;
    setPriceLoading(true);
    try {
      const tickers = stocks.map(s => s.ticker);
      const res = await fetch("/api/stockprice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickers, stocks }) });
      const data = await res.json();
      if (data.prices) {
        const processed = {};
        Object.entries(data.prices).forEach(([name, val]) => { processed[name] = (val && typeof val === "object" && val.isOverseas) ? val.krw : val; });
        setLivePrices(processed);
        const now = new Date().toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
        setLastUpdated(now);
        fetch("/api/save-prices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ livePrices: processed, priceUpdatedAt: now }) }).catch(() => {});
      }
    } catch(e) { console.error(e); }
    setPriceLoading(false);
  }
  const addFiles = useCallback(async (files) => {
    if (!isAdmin) return;
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    const items = valid.map(f => ({ id: Date.now() + Math.random(), preview: URL.createObjectURL(f), file: f, result: null, loading: false, error: null }));
    setImages(prev => [...prev, ...items]);
    for (const item of items) {
      setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: true } : i));
      try {
        // ✅ v1.5.19: 매매내역 표(특히 2자리 이상 수량 숫자)가 800px 압축 과정에서 흐려져서
        // AI가 "19"를 "1"로 잘못 읽는 등의 오인식이 발생 → 해상도를 높여 숫자 인식 정확도 개선
        const base64 = await compressImage(item.file, 1400);
        const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: base64 }) });
        const result = await res.json(); if (result.error) throw new Error(result.error);
        setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: false, result } : i));
      } catch(e) { setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: false, error: e.message } : i)); }
    }
  }, [isAdmin]);
  async function saveResults() {
    const valid = images.filter(i => i.result).map(i => i.result); if (!valid.length) return;
    setMerging(true);
    try {
      // ✅ v1.5.14 버그 수정 ①: "오늘 날짜"로 저장된 기존 레코드를 통째로 교체하던 방식 때문에,
      // 같은 날 두 번째(별도) 업로드를 하면 첫 번째 업로드분이 통째로 사라지는 버그가 있었음
      // (allRecords.filter(r => r.date !== today)가 오늘자 기존 기록을 지워버리고 새 배치로만 교체함).
      // → 기존에 저장돼 있던 전체 매매기록도 항상 병합 대상에 포함시켜서, 몇 번을 나눠 올리든 누적되도록 함.
      const existingStocks = allRecords.flatMap(r => r.result?.stocks || []);
      const toMerge = existingStocks.length ? [{ stocks: existingStocks }, ...valid] : valid;
      const mergeRes = await fetch("/api/merge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results: toMerge }) });
      const merged = await mergeRes.json();
      if (merged.error) throw new Error(merged.error);

      const today = new Date().toISOString().split("T")[0];
      // ✅ 이제부터 allRecords는 업로드 날짜별로 쪼개지 않고, 누적된 전체 기록을 레코드 1개로 관리함
      const updated = [{ date: today, result: merged }];

      // ✅ v1.5.14 버그 수정 ②: 이 저장 요청에만 pin이 빠져 있어서, 서버가 401로 거부해도(=실제로는 저장 안 됨)
      // 응답을 확인하지 않고 무조건 "저장 완료" 알림을 띄우고 있었음. pin 추가 + 응답 검증 추가.
      const pin = sessionStorage.getItem('jb_pin') || '';
      const saveRes = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, records: updated, portfolios, accounts, mainText }) });
      const saveData = await saveRes.json();
      if (!saveRes.ok || saveData.error) throw new Error(saveData.error || `저장 실패 (${saveRes.status})`);

      setAllRecords(updated); setImages([]); alert("✅ 저장 완료!");
    } catch(e) { alert("저장 실패: " + e.message); }
    setMerging(false);
  }
  async function clearRecords() {
    if (!window.confirm("매수/매도 기록을 삭제할까요?")) return;
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: [], portfolios, accounts, mainText }) });
    setAllRecords([]);
  }
  async function clearPortfolio(accountId) {
    const accountName = accounts.find(a => a.id === accountId)?.name || "포트폴리오";
    if (!window.confirm(`🗑️ "${accountName}" 포트폴리오 내역을 초기화할까요?\n\n계좌는 유지되고 종목 내역만 삭제됩니다.`)) return;
    const newPortfolios = { ...portfolios }; delete newPortfolios[accountId];
    const pin = sessionStorage.getItem('jb_pin') || '';
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
    setPortfolios(newPortfolios);
  }
  async function clearAll() {
    if (!window.confirm("매수/매도 기록과 포트폴리오를 모두 삭제할까요?")) return;
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: [], portfolios: {}, accounts, mainText }) });
    setAllRecords([]); setPortfolios({}); setLivePrices({});
  }

  const allTradesFlat = allRecords.flatMap(r => r.result?.stocks || []).flatMap(s => s.trades || []);
  const tradeDates = [...new Set(allTradesFlat.map(t => t.date))].sort();
  const minDate = tradeDates[0] || ""; const maxDate = tradeDates[tradeDates.length - 1] || "";
  const isInRange = (date) => { if (!startDate && !endDate) return true; if (startDate && endDate) return date >= startDate && date <= endDate; if (startDate) return date >= startDate; return date <= endDate; };
  const allStocks = allRecords.flatMap(r => r.result?.stocks || []);
  const mergedStocks = Object.values(allStocks.reduce((acc, s) => {
    const filteredTrades = s.trades.filter(t => isInRange(t.date)); if (filteredTrades.length === 0) return acc;
    if (!acc[s.ticker]) acc[s.ticker] = { ...s, trades: [...filteredTrades] };
    else acc[s.ticker].trades = [...acc[s.ticker].trades, ...filteredTrades];
    const buyTrades = acc[s.ticker].trades.filter(t => t.type === "매수");
    const sellTrades = acc[s.ticker].trades.filter(t => t.type === "매도");
    const tBuyQty = buyTrades.reduce((sum, t) => sum + t.quantity, 0);
    const tBuyAmt = buyTrades.reduce((sum, t) => sum + t.price * t.quantity, 0);
    const tSellQty = sellTrades.reduce((sum, t) => sum + t.quantity, 0);
    acc[s.ticker].avgBuyPrice = tBuyQty ? Math.round(tBuyAmt / tBuyQty) : 0;
    acc[s.ticker].totalInvested = buyTrades.reduce((sum, t) => sum + t.total, 0);
    acc[s.ticker].totalSold = sellTrades.reduce((sum, t) => sum + t.total, 0);
    acc[s.ticker].currentHolding = tBuyQty - tSellQty;
    return acc;
  }, {}));
  const buyStocks = mergedStocks.filter(s => s.trades.some(t => t.type === "매수")).sort((a, b) => (b.totalInvested||0)-(a.totalInvested||0));
  const sellStocks = mergedStocks.filter(s => s.trades.some(t => t.type === "매도")).sort((a, b) => (b.totalSold||0)-(a.totalSold||0));
  const buyPieData = buyStocks.map(s => ({ ticker: s.ticker, value: s.totalInvested||0, avgPrice: s.avgBuyPrice }));
  const sellPieData = sellStocks.map(s => ({ ticker: s.ticker, value: s.totalSold||0, avgPrice: Math.round((s.trades.filter(t=>t.type==="매도").reduce((a,t)=>a+t.price*t.quantity,0))/(s.trades.filter(t=>t.type==="매도").reduce((a,t)=>a+t.quantity,0)||1)) }));
  const displayStocks = historySubTab === "buy" ? buyStocks : sellStocks;

  function shareText() {
    const lines = ["📊 존버일기장 매매기록\n"];
    mergedStocks.forEach(s => {
      lines.push(`▶ ${s.ticker} | 평균 ${s.avgBuyPrice?.toLocaleString()}원`);
      s.trades.forEach(t => lines.push(`  ${t.date} ${t.type} ${t.price?.toLocaleString()}원`));
    });
    lines.push("\n#주식 #존버일기장 #포트폴리오");
    return lines.join("\n");
  }

  const displayPortfolio = (() => {
    if (activeAccount === "all") {
      const allPortfolios = Object.values(portfolios);
      if (allPortfolios.length === 0) return null;
      // ✅ 버그 수정: 예수금은 모든 계좌가 티커명이 똑같이 "예수금"이라, 아래 종목 병합 로직(같은 티커면
      // 수량/평가금액은 더하고 평단가는 가중평균)을 그대로 타면 서로 다른 계좌의 예수금이 "같은 종목"처럼
      // 합산돼버려서 금액이 부풀려짐(두 계좌 예수금이 같은 금액이면 평단가는 그대로인데 평가금액만 배로 늘어남).
      // → 예수금은 종목 병합 대상에서 완전히 제외하고, 전체 계좌 예수금 합계를 별도로 한 줄로만 더함.
      const allNormalStocks = allPortfolios.flatMap(p => (p.stocks||[]).filter(s => !s.approximateData && !s.isCash));
      const merged = Object.values(allNormalStocks.reduce((acc, s) => {
        if (s.isOverseas) {
          const krwValue = livePrices[s.ticker] ? Math.round(livePrices[s.ticker] * s.quantity) : Math.round(s.currentValue || 0);
          if (!acc[s.ticker]) acc[s.ticker] = { ...s, currentValue: krwValue };
          else { acc[s.ticker].quantity += s.quantity; acc[s.ticker].currentValue += krwValue; }
          return acc;
        }
        const cur = livePrices[s.ticker] || s.currentPrice;
        if (!acc[s.ticker]) { acc[s.ticker] = { ...s, quantity: s.quantity, currentValue: cur * s.quantity }; }
        else {
          const pq = acc[s.ticker].quantity;
          acc[s.ticker].quantity += s.quantity; acc[s.ticker].currentValue += cur * s.quantity;
          acc[s.ticker].avgBuyPrice = Math.round((acc[s.ticker].avgBuyPrice * pq + s.avgBuyPrice * s.quantity) / acc[s.ticker].quantity);
        }
        return acc;
      }, {}));
      const cashTotal = allPortfolios.flatMap(p => (p.stocks||[]).filter(s => !s.approximateData && s.isCash))
        .reduce((sum, s) => sum + (s.currentValue || s.currentPrice || 0), 0);
      const finalStocks = cashTotal > 0
        ? [...merged, { ticker: "예수금", isCash: true, quantity: 1, avgBuyPrice: cashTotal, currentPrice: cashTotal, currentValue: cashTotal }]
        : merged;
      const normalTotal = finalStocks.reduce((s, d) => s + (d.currentValue||0), 0);
      const approxTotal = allPortfolios.filter(p => p.approximateData).reduce((s, p) => s + (p.totalValue||0), 0);
      return { stocks: finalStocks, totalValue: normalTotal + approxTotal, approxTotal };
    }
    const p = portfolios[activeAccount]; if (!p) return null;
    if (p.approximateData) return p;
    const stocks = (p.stocks||[]).map(s => {
      if (s.approximateData || s.isCash) return s;
      if (s.isOverseas) {
        const krwPrice = livePrices[s.ticker]; // 이미 krw 원화값
        return { ...s, currentValue: krwPrice ? Math.round(krwPrice * s.quantity) : Math.round(s.currentValue || 0) };
      }
      const cur = livePrices[s.ticker] || s.currentPrice;
      return { ...s, currentValue: Math.round(cur * s.quantity) };
    });
    return { ...p, stocks, totalValue: stocks.reduce((sum, s) => sum + s.currentValue, 0) };
  })();

  const allDone = images.length > 0 && images.every(i => !i.loading);

  // 스타일 객체 (T 변수 사용)
  const S = {
    page: { minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: "16px 6px 60px", maxWidth: 720, margin: "0 auto" },
    header: { textAlign: "center", marginBottom: 20 },
    logoRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
    logoText: { fontSize: 22, fontWeight: 700, background: T.logoGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    verBadge: { background: T.section, color: T.textMuted, border: `1px solid ${T.sectionBorder}`, borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 600 },
    loginTag: { background: T.loginTagBg, color: T.loginTagText, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" },
    adminTag: { background: T.adminTagBg, color: T.adminTagText, border: `1px solid ${T.adminTagBorder}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" },
    sub: { color: T.textMuted, fontSize: 13, margin: 0 },
    overlay: { position: "fixed", inset: 0, background: T.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modal: { background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: 24, width: 260, textAlign: "center" },
    pinInput: { width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 20, padding: "10px", textAlign: "center", outline: "none", boxSizing: "border-box", letterSpacing: 8 },
    drop: { border: `2px dashed ${T.dropBorder}`, borderRadius: 14, padding: "24px 16px", textAlign: "center", cursor: "pointer", marginBottom: 12, background: T.dropBg },
    dropOn: { borderColor: T.dropOnBorder, background: T.dropOnBg },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8, marginBottom: 12 },
    card: { background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 10, overflow: "hidden" },
    thumb: { width: "100%", height: 100, objectFit: "cover", display: "block" },
    xBtn: { position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 9 },
    stockCard: { background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 8 },
    insight: { marginTop: 8, padding: "6px 10px", background: T.insight, borderRadius: 6, fontSize: 11, color: T.insightText, borderLeft: "2px solid #6366f1" },
    btnMain: { background: T.btnGrad, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    btnSub: { background: T.btnSubBg, color: T.btnSubText, border: `1px solid ${T.btnSubBorder}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, cursor: "pointer" },
    btnDanger: { background: T.btnDangerBg, color: T.btnDangerText, border: `1px solid ${T.btnDangerBorder}`, borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  };

  return (
    <div style={S.page}>
      {/* PIN 모달 */}
      {/* ========== 성과 상세보기 모달 ========== */}
      {perfDetailModal && (
        <div style={{ position:"fixed", inset:0, background:T.overlay, zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:720, maxHeight:"85vh", overflowY:"auto", padding:"0 0 24px" }}>
            {/* 헤더 */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 12px", borderBottom:`1px solid ${T.cardBorder}`, position:"sticky", top:0, background:T.card, zIndex:1 }}>
              <div style={{ fontSize:16, fontWeight:800, color:T.text }}>📋 성과 기록 내역</div>
              <button onClick={() => setPerfDetailModal(false)}
                style={{ background:"none", border:"none", color:T.textMuted, fontSize:22, cursor:"pointer" }}>✕</button>
            </div>

            <div style={{ padding:"12px 20px" }}>
              {Object.keys(performance).length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px", color:T.textMuted }}>기록된 성과가 없어요</div>
              ) : (
                Object.keys(performance).sort().reverse().map(date => {
                  const p = performance[date];
                  // 일일 수익률 표시 (누적 아님)
                  const myRet = p.dailyReturn !== undefined ? parseFloat(p.dailyReturn).toFixed(2) : (p.cumulativeIndex - 100).toFixed(2);
                  const kospiDailyRet = (p.kospi && p.kospiIndex && performance) ? (() => {
                    const dates = Object.keys(performance).sort();
                    const idx = dates.indexOf(date);
                    const prevDate = idx > 0 ? dates[idx-1] : null;
                    const prevKospi = prevDate ? performance[prevDate].kospi : p.kospi;
                    return prevKospi ? ((p.kospi - prevKospi) / prevKospi * 100).toFixed(2) : null;
                  })() : null;
                  const kosdaqDailyRet = (p.kosdaq && p.kosdaqIndex && performance) ? (() => {
                    const dates = Object.keys(performance).sort();
                    const idx = dates.indexOf(date);
                    const prevDate = idx > 0 ? dates[idx-1] : null;
                    const prevKosdaq = prevDate ? performance[prevDate].kosdaq : p.kosdaq;
                    return prevKosdaq ? ((p.kosdaq - prevKosdaq) / prevKosdaq * 100).toFixed(2) : null;
                  })() : null;
                  const myColor = myRet >= 0 ? "#ef4444" : "#3b82f6";
                  return (
                    <div key={date} style={{ background:T.section, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                      {/* 날짜 + 총평가액 + 삭제 버튼 */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{date}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          {isAdmin && <div style={{ fontSize:12, color:T.textMuted }}>{p.totalValue?.toLocaleString()}원</div>}
                          {isAdmin && (
                            <button onClick={() => deletePerformance(date)}
                              style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:6, color:T.textMuted, fontSize:11, padding:"2px 7px", cursor:"pointer" }}>
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                      {/* 수익률 3개 */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom: p.accounts ? 8 : 0 }}>
                        <div style={{ textAlign:"center", background:T.card, borderRadius:6, padding:"6px 4px" }}>
                          <div style={{ fontSize:9, color:T.textMuted }}>내 포트 (일간)</div>
                          <div style={{ fontSize:13, fontWeight:800, color:myColor }}>{myRet >= 0 ? '+' : ''}{myRet}%</div>
                        </div>
                        <div style={{ textAlign:"center", background:T.card, borderRadius:6, padding:"6px 4px" }}>
                          <div style={{ fontSize:9, color:T.textMuted }}>코스피 (일간)</div>
                          <div style={{ fontSize:13, fontWeight:700, color: kospiDailyRet >= 0 ? "#ef4444" : "#3b82f6" }}>
                            {kospiDailyRet !== null ? `${kospiDailyRet >= 0 ? '+' : ''}${kospiDailyRet}%` : '-'}
                          </div>
                          {p.kospi && <div style={{ fontSize:9, color:T.textMuted }}>{p.kospi?.toLocaleString()}</div>}
                        </div>
                        <div style={{ textAlign:"center", background:T.card, borderRadius:6, padding:"6px 4px" }}>
                          <div style={{ fontSize:9, color:T.textMuted }}>코스닥 (일간)</div>
                          <div style={{ fontSize:13, fontWeight:700, color: kosdaqDailyRet >= 0 ? "#ef4444" : "#3b82f6" }}>
                            {kosdaqDailyRet !== null ? `${kosdaqDailyRet >= 0 ? '+' : ''}${kosdaqDailyRet}%` : '-'}
                          </div>
                          {p.kosdaq && <div style={{ fontSize:9, color:T.textMuted }}>{p.kosdaq?.toLocaleString()}</div>}
                        </div>
                      </div>
                      {/* 계좌별 수익률 */}
                      {p.accounts && Object.keys(p.accounts).length > 0 && (
                        <div style={{ borderTop:`1px solid ${T.cardBorder}`, paddingTop:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>계좌별 (일간 · 누적)</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {Object.entries(p.accounts).map(([accId, acc]) => {
                              const accName = accounts.find(a => a.id === accId)?.name || accId;
                              const accCum = (acc.cumulativeIndex - 100).toFixed(2);
                              // dailyReturn은 신규 저장분부터 저장돼 있음. 그 이전 기록들은 저장된 값이 없으므로
                              // 코스피/코스닥 일간(kospiDailyRet)과 같은 방식으로, 날짜순으로 봤을 때 바로 전날
                              // 기록의 같은 계좌 평가액과 비교해서 그 자리에서 계산해 보여준다.
                              let accDailyNum = acc.dailyReturn !== undefined ? parseFloat(acc.dailyReturn) : null;
                              if (accDailyNum === null) {
                                const allDates = Object.keys(performance).sort();
                                const dIdx = allDates.indexOf(date);
                                const prevD = dIdx > 0 ? allDates[dIdx - 1] : null;
                                const prevAccVal = prevD ? performance[prevD]?.accounts?.[accId]?.value : null;
                                if (prevAccVal) accDailyNum = (acc.value - prevAccVal) / prevAccVal * 100;
                              }
                              const accDaily = accDailyNum !== null ? accDailyNum.toFixed(2) : null;
                              return (
                                <div key={accId} style={{ background:T.card, borderRadius:6, padding:"4px 8px", fontSize:10 }}>
                                  <span style={{ color:T.textMuted }}>{accName} </span>
                                  {accDaily !== null && (
                                    <span style={{ fontWeight:700, color: accDaily >= 0 ? "#ef4444" : "#3b82f6" }}>
                                      일간{accDaily >= 0 ? '+' : ''}{accDaily}%
                                    </span>
                                  )}
                                  <span style={{ fontWeight:600, color: accCum >= 0 ? "#ef4444" : "#3b82f6", marginLeft:4 }}>
                                    (누적{accCum >= 0 ? '+' : ''}{accCum}%)
                                  </span>
                                  {isAdmin && <span style={{ color:T.textMuted, fontSize:9, marginLeft:4 }}>{acc.value?.toLocaleString()}원</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== 차트 모달 ========== */}
      {chartModal && (
        <div style={{ position:"fixed", inset:0, background:T.overlay, zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:720, maxHeight:"92vh", overflowY:"auto", padding:"0 0 24px" }}>
            {/* 헤더 */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 12px", borderBottom:`1px solid ${T.cardBorder}`, position:"sticky", top:0, background:T.card, zIndex:1 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:T.text }}>{chartModal.ticker}</div>
                <div style={{ fontSize:11, color:T.textMuted }}>
                  {chartData.length > 0 ? `${chartData[0].date} ~ ${chartData[chartData.length-1].date}` : ''}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                {/* 메모 버튼 - 관리자: 편집 가능 / 조회자: 메모 있을 때만 조회 */}
                {(isAdmin || memos[chartModal.ticker]) && (
                  <button onClick={() => { if(isAdmin) { setMemoEditing(true); setMemoDraft(memos[chartModal.ticker] || ''); } else { setMemoEditing(false); } }}
                    style={{ background:memos[chartModal.ticker] ? (darkMode?"#1a2a1a":"#dcfce7") : T.section, border:`1px solid ${memos[chartModal.ticker]?"#22c55e":T.border}`, borderRadius:8, color:memos[chartModal.ticker]?"#22c55e":T.textMuted, padding:"5px 10px", fontSize:12, cursor:"pointer" }}>
                    📝 {memos[chartModal.ticker] ? "메모보기" : "메모없음"}
                  </button>
                )}
                <button onClick={() => { setChartModal(null); setChartData([]); setChartTooltip(null); setMemoEditing(false); }}
                  style={{ background:"none", border:"none", color:T.textMuted, fontSize:22, cursor:"pointer", lineHeight:1 }}>✕</button>
              </div>
            </div>

            {/* 메모 편집 패널 - 관리자만 */}
            {memoEditing && isAdmin && (
              <div style={{ margin:"12px 20px", background:T.section, border:`1px solid ${T.border}`, borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>📝 종목 메모</div>
                <div style={{ fontSize:11, color:T.textMuted, marginBottom:8 }}>목표가, 매매 계획 등 자유롭게 기록하세요</div>
                <textarea
                  value={memoDraft} onChange={e => setMemoDraft(e.target.value)}
                  placeholder={`예시:
목표가: 350,000원
매도 시점: 2026 하반기
추가 매수: 240,000원 이하`}
                  style={{ width:"100%", minHeight:100, background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:13, padding:"10px", resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }} />
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <button onClick={() => setMemoEditing(false)} style={{ ...S.btnSub, flex:1, fontSize:12, padding:"7px" }}>취소</button>
                  <button onClick={() => saveMemo(chartModal.ticker, memoDraft)} style={{ ...S.btnMain, flex:1, fontSize:12, padding:"7px" }}>저장</button>
                </div>
              </div>
            )}

            {/* 메모 표시 (편집 아닐 때) */}
            {!memoEditing && memos[chartModal.ticker] && (
              <div style={{ margin:"12px 20px 0", background:darkMode?"#1a2a1a":"#f0fdf4", border:`1px solid ${darkMode?"#166534":"#86efac"}`, borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:11, color:"#22c55e", fontWeight:700, marginBottom:4 }}>📝 메모</div>
                <div style={{ fontSize:12, color:T.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{memos[chartModal.ticker]}</div>
                {isAdmin && (
                  <button onClick={() => { setMemoEditing(true); setMemoDraft(memos[chartModal.ticker]); }}
                    style={{ background:"none", border:"none", color:"#22c55e", fontSize:11, cursor:"pointer", marginTop:4 }}>✏️ 수정</button>
                )}
              </div>
            )}

            {/* 봉 종류 탭 */}
            <div style={{ padding:"14px 20px 6px" }}>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                {[{k:'day',l:'일봉'},{k:'week',l:'주봉'},{k:'month',l:'월봉'}].map(tf => (
                  <button key={tf.k} onClick={async () => {
                    const defaultRange = tf.k==='day' ? '3mo' : tf.k==='week' ? '1y' : '1y';
                    setChartTimeframe(tf.k);
                    setChartRange(defaultRange);
                    if (tf.k !== 'day') setShowTrades(false);
                    setChartTooltip(null);
                    await loadChartData(chartModal, tf.k, defaultRange);
                  }}
                    style={{ flex:1, padding:"7px 0", fontSize:12, fontWeight:700, borderRadius:8, cursor:"pointer", border:"1px solid",
                      background: chartTimeframe===tf.k ? (darkMode?"#1e3a5f":"#dbeafe") : T.section,
                      borderColor: chartTimeframe===tf.k ? "#3b82f6" : T.border,
                      color: chartTimeframe===tf.k ? "#3b82f6" : T.textMuted,
                    }}>{tf.l}</button>
                ))}
              </div>

              {/* 기간 선택 버튼 */}
              <div style={{ display:"flex", gap:4, marginBottom:8, overflowX:"auto" }}>
                {(chartTimeframe==='day'
                  ? [{k:'1mo',l:'1개월'},{k:'3mo',l:'3개월'},{k:'6mo',l:'6개월'},{k:'1y',l:'1년'},{k:'3y',l:'3년'},{k:'5y',l:'5년'}]
                  : chartTimeframe==='week'
                  ? [{k:'6mo',l:'6개월'},{k:'1y',l:'1년'},{k:'3y',l:'3년'},{k:'5y',l:'5년'},{k:'10y',l:'10년'}]
                  : [{k:'1y',l:'1년'},{k:'5y',l:'5년'},{k:'10y',l:'10년'}]
                ).map(r => (
                  <button key={r.k} onClick={async () => {
                    setChartRange(r.k);
                    setChartTooltip(null);
                    await loadChartData(chartModal, chartTimeframe, r.k);
                  }}
                    style={{ flexShrink:0, padding:"4px 10px", fontSize:11, fontWeight:600, borderRadius:6, cursor:"pointer", border:"1px solid",
                      background: chartRange===r.k ? (darkMode?"#1a2a1a":"#dcfce7") : T.section,
                      borderColor: chartRange===r.k ? "#22c55e" : T.border,
                      color: chartRange===r.k ? "#22c55e" : T.textMuted,
                    }}>{r.l}</button>
                ))}
              </div>

              {/* 매매기록 버튼 - 일봉에서만 */}
              {chartTimeframe === 'day' && (() => {
                const ticker = chartModal?.ticker;
                const hasTrades = allRecords.flatMap(r => r.result?.stocks||[])
                  .some(s => s.ticker === ticker && s.trades?.length > 0);
                if (!hasTrades) return (
                  <div style={{ width:"100%", padding:"6px 10px", fontSize:11, borderRadius:8, border:`1px solid ${T.border}`, background:T.section, color:T.textMuted, textAlign:"center" }}>
                    📋 매매기록 업데이트 내용이 없습니다
                  </div>
                );
                return (
                  <button onClick={() => setShowTrades(v => !v)}
                    style={{ width:"100%", padding:"6px 0", fontSize:12, fontWeight:700, borderRadius:8, cursor:"pointer", border:"1px solid",
                      background: showTrades ? (darkMode?"#2d1515":"#fee2e2") : T.section,
                      borderColor: showTrades ? "#ef4444" : T.border,
                      color: showTrades ? "#ef4444" : T.textMuted,
                    }}>
                    {showTrades ? "📍 매매기록 숨기기" : "📍 매매기록 보기"}
                    <span style={{ fontSize:10, marginLeft:6, opacity:0.7 }}>매수▲빨강 · 매도▼파랑</span>
                  </button>
                );
              })()}
            </div>

            {/* 차트 영역 */}
            <div style={{ padding:"0 16px" }}>
              {chartLoading && (
                <div style={{ textAlign:"center", padding:"40px", color:T.textMuted }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>📊</div>
                  <div>차트 불러오는 중...</div>
                </div>
              )}
              {!chartLoading && chartData.length === 0 && (
                <div style={{ textAlign:"center", padding:"40px", color:T.textMuted }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>😞</div>
                  <div>차트 데이터를 불러올 수 없어요</div>
                  <div style={{ fontSize:11, marginTop:4 }}>종목코드를 확인해주세요</div>
                </div>
              )}
              {!chartLoading && chartData.length > 0 && (() => {
                // 차트 계산
                const W = Math.min(680, window.innerWidth - 32);
                const H = 220;
                const VH = 60; // 거래량 높이
                const PAD = { l:52, r:10, t:10, b:20 };
                const n = chartData.length;
                const candleW = Math.max(2, Math.floor((W - PAD.l - PAD.r) / n) - 1);
                const spacing = (W - PAD.l - PAD.r) / n;

                // 매매기록에서 해당 종목 거래 추출
                const ticker = chartModal.ticker;
                // ✅ v1.5.21: 같은 날짜에 매수(혹은 매도)가 여러 건(분할 체결 등)이면 예전엔 전부
                // 같은 좌표에 겹쳐 그려져서 구분이 안 됐음. 사용자 요청대로, 개별 체결을 각각 보여주는
                // 대신 "같은 날짜 + 같은 매매구분"은 수량을 합치고 그날의 가중평균 단가로 합쳐서 하루에
                // 1건(매수 1개/매도 1개)으로만 표시. _rawTrades에 합쳐지기 전 원본 거래들을 들고 있어서,
                // 이 합산 항목을 수정/삭제하면 원본 여러 건이 한 번에 교체/삭제되도록 함.
                const rawTradesByDate = {};
                allRecords.flatMap(r => r.result?.stocks || [])
                  .filter(s => s.ticker === ticker)
                  .flatMap(s => s.trades || [])
                  .forEach(t => {
                    if (!rawTradesByDate[t.date]) rawTradesByDate[t.date] = [];
                    rawTradesByDate[t.date].push(t);
                  });
                const tradesByDate = {};
                Object.entries(rawTradesByDate).forEach(([date, raws]) => {
                  const groups = {};
                  raws.forEach(t => { (groups[t.type] = groups[t.type] || []).push(t); });
                  tradesByDate[date] = Object.entries(groups).map(([type, raws2]) => {
                    const qty = raws2.reduce((sum, t) => sum + (t.quantity || 0), 0);
                    const amt = raws2.reduce((sum, t) => sum + (t.price || 0) * (t.quantity || 0), 0);
                    const avgPrice = qty > 0 ? Math.round(amt / qty) : (raws2[0]?.price || 0);
                    return { date, type, price: avgPrice, quantity: qty, total: amt, _rawTrades: raws2 };
                  });
                });

                // 가격 범위
                const highs = chartData.map(c => c.high);
                const lows = chartData.map(c => c.low);
                const maxP = Math.max(...highs);
                const minP = Math.min(...lows);
                const priceRange = maxP - minP || 1;
                const py = p => PAD.t + (H - PAD.t - PAD.b) * (1 - (p - minP) / priceRange);

                // 거래량 범위
                const maxV = Math.max(...chartData.map(c => c.volume)) || 1;
                const vy = v => VH * (1 - v / maxV) + 4;

                // 현재가 (마지막 캔들)
                const lastCandle = chartData[chartData.length - 1];
                const prevCandle = chartData[chartData.length - 2];
                const priceChange = prevCandle ? lastCandle.close - prevCandle.close : 0;
                const pctChange = prevCandle ? (priceChange / prevCandle.close * 100) : 0;
                const priceColor = priceChange >= 0 ? "#ef4444" : "#3b82f6";

                // Y축 레이블
                const yLabels = [];
                const steps = 4;
                for (let i = 0; i <= steps; i++) {
                  const p = minP + priceRange * i / steps;
                  yLabels.push({ p, y: py(p), label: p >= 100000 ? Math.round(p/1000)/10+'만' : Math.round(p).toLocaleString() });
                }

                // 현재가 정보 표시
                return (
                  <div>
                    {/* 현재가 요약 */}
                    <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:10, paddingLeft:PAD.l }}>
                      <span style={{ fontSize:22, fontWeight:900, color:priceColor }}>{lastCandle.close?.toLocaleString()}원</span>
                      <span style={{ fontSize:13, color:priceColor, fontWeight:700 }}>
                        {priceChange >= 0 ? "+" : ""}{priceChange?.toLocaleString()}원 ({pctChange >= 0 ? "+" : ""}{pctChange.toFixed(2)}%)
                      </span>
                    </div>

                    {/* 캔들스틱 차트 SVG */}
                    <div style={{ overflowX:"auto", cursor:"crosshair" }}>
                      <svg width={W} height={H + VH + 30} style={{ display:"block" }}
                        onClick={e => {
                          // 캔들 클릭 시 툴팁 (화살표 클릭은 stopPropagation으로 별도 처리)
                          const rect = e.currentTarget.getBoundingClientRect();
                          const mx = e.clientX - rect.left - PAD.l;
                          const idx = Math.round(mx / spacing);
                          if (idx >= 0 && idx < n) {
                            const candle = chartData[idx];
                            // 이미 같은 캔들 클릭이면 닫기
                            if (chartTooltip && chartTooltip.idx === idx && !chartTooltip.trade) {
                              setChartTooltip(null);
                            } else {
                              setChartTooltip({ idx, x: PAD.l + idx * spacing, candle });
                            }
                          }
                        }}>

                        {/* Y축 그리드 */}
                        {yLabels.map((yl, i) => (
                          <g key={i}>
                            <line x1={PAD.l} y1={yl.y} x2={W-PAD.r} y2={yl.y} stroke={T.cardBorder} strokeWidth="0.5" strokeDasharray="3,3" />
                            <text x={PAD.l-4} y={yl.y+4} textAnchor="end" fontSize="9" fill={T.textMuted}>{yl.label}</text>
                          </g>
                        ))}

                        {/* 캔들스틱 */}
                        {chartData.map((c, i) => {
                          const x = PAD.l + i * spacing;
                          const isUp = c.close >= c.open;
                          const color = isUp ? "#ef4444" : "#3b82f6";
                          const bodyTop = py(Math.max(c.open, c.close));
                          const bodyBot = py(Math.min(c.open, c.close));
                          const bodyH = Math.max(1, bodyBot - bodyTop);
                          const cw = Math.max(1, candleW);
                          return (
                            <g key={i}>
                              {/* 심지 */}
                              <line x1={x} y1={py(c.high)} x2={x} y2={py(c.low)} stroke={color} strokeWidth="1" />
                              {/* 몸통 */}
                              <rect x={x - cw/2} y={bodyTop} width={cw} height={bodyH} fill={color} opacity="0.9" />
                            </g>
                          );
                        })}

                        {/* 매수/매도 원형 버튼 - 일봉 + showTrades 일 때만 */}
                        {showTrades && chartTimeframe === 'day' && chartData.map((c, i) => {
                          const trades = tradesByDate[c.date];
                          if (!trades || trades.length === 0) return null;
                          const x = PAD.l + i * spacing;
                          return trades.map((t, j) => {
                            const isBuy = t.type === '매수';
                            const btnY = isBuy ? py(c.low) + 18 : py(c.high) - 18;
                            const btnColor = isBuy ? "#ef4444" : "#3b82f6";
                            const R = 7; // 원 반지름
                            const isSelected = chartTooltip?.trade === t;
                            return (
                              <g key={`${i}-${j}`} style={{ cursor:"pointer" }}
                                onClick={e => { e.stopPropagation(); setChartTooltip(isSelected ? null : { idx: i, x, candle: c, trade: t }); }}>
                                {/* 원형 배경 */}
                                <circle cx={x} cy={btnY} r={R} fill={btnColor} opacity="0.9" />
                                {/* 선택됐을 때 테두리 */}
                                {isSelected && <circle cx={x} cy={btnY} r={R+2} fill="none" stroke={btnColor} strokeWidth="1.5" opacity="0.6" />}
                                {/* 화살표 아이콘 (위/아래) */}
                                {isBuy
                                  ? <polygon points={`${x},${btnY-3} ${x-3},${btnY+2} ${x+3},${btnY+2}`} fill="white" />
                                  : <polygon points={`${x},${btnY+3} ${x-3},${btnY-2} ${x+3},${btnY-2}`} fill="white" />
                                }
                              </g>
                            );
                          });
                        })}

                        {/* 툴팁 수직선 */}
                        {chartTooltip && (
                          <line x1={chartTooltip.x} y1={PAD.t} x2={chartTooltip.x} y2={H+VH+10}
                            stroke={T.textMuted} strokeWidth="0.8" strokeDasharray="4,2" />
                        )}

                        {/* 평단가 점선 (포트폴리오에서 avgBuy 있을 때만) */}
                        {chartModal?.avgBuy && chartModal.avgBuy > 0 && (() => {
                          const avgY = py(chartModal.avgBuy);
                          const avgLabel = chartModal.avgBuy >= 100000
                            ? `평단 ${Math.round(chartModal.avgBuy/1000)/10}만`
                            : `평단 ${chartModal.avgBuy.toLocaleString()}원`;
                          return (
                            <g>
                              <line x1={PAD.l} y1={avgY} x2={W-PAD.r} y2={avgY}
                                stroke={darkMode ? "#e2e8f0" : "#1a1a2e"} strokeWidth="1" strokeDasharray="5,3" opacity="0.7" />
                              <rect x={PAD.l} y={avgY-9} width={avgLabel.length*5.5} height={16} fill={darkMode?"#1e293b":"#ffffff"} rx="3" opacity="0.85" />
                              <text x={PAD.l+3} y={avgY+3} fontSize="9" fill={darkMode?"#e2e8f0":"#1a1a2e"} fontWeight="600">{avgLabel}</text>
                            </g>
                          );
                        })()}

                        {/* 거래량 */}
                        {chartData.map((c, i) => {
                          const x = PAD.l + i * spacing;
                          const isUp = c.close >= c.open;
                          const vh = VH - vy(c.volume);
                          const cw = Math.max(1, candleW);
                          return (
                            <rect key={i} x={x-cw/2} y={H + vy(c.volume)} width={cw} height={Math.max(1, vh)}
                              fill={isUp ? "#ef4444" : "#3b82f6"} opacity="0.5" />
                          );
                        })}

                        {/* 거래량 레이블 */}
                        <text x={PAD.l-4} y={H+8} textAnchor="end" fontSize="8" fill={T.textMuted}>거래량</text>

                        {/* X축 날짜 - 연도 포함 */}
                        {chartData.map((c, i) => {
                          const step = n <= 30 ? 5 : n <= 60 ? 10 : n <= 120 ? 20 : n <= 260 ? 40 : 60;
                          if (i % step !== 0) return null;
                          const x = PAD.l + i * spacing;
                          const [yyyy, mm, dd] = c.date.split('-');
                          // 기간에 따라 표시 형식 다르게
                          const label = chartTimeframe === 'month'
                            ? `${yyyy}.${mm}`
                            : chartTimeframe === 'week'
                            ? `${yyyy.slice(2)}.${mm}.${dd}`
                            : `${yyyy.slice(2)}.${mm}.${dd}`;
                          return <text key={i} x={x} y={H+VH+18} textAnchor="middle" fontSize="8" fill={T.textMuted}>{label}</text>;
                        })}
                      </svg>
                    </div>

                    {/* 툴팁 박스 */}
                    {chartTooltip && (
                      <div style={{ margin:"8px 0 4px", padding:"10px 14px", background:T.section, border:`1px solid ${T.border}`, borderRadius:10, fontSize:12 }}>
                        {chartTooltip.trade ? (
                          // 매수/매도 거래 툴팁
                          <div>
                            <div style={{ fontWeight:700, color:chartTooltip.trade.type==='매수'?"#ef4444":"#3b82f6", marginBottom:4 }}>
                              {chartTooltip.trade.type} ({chartTooltip.candle.date})
                              {/* ✅ v1.5.21: 그날 분할 체결이 여러 건 합쳐진 값이면 몇 건이 합쳐졌는지 표시 */}
                              {chartTooltip.trade._rawTrades && chartTooltip.trade._rawTrades.length > 1 && (
                                <span style={{ fontSize:10, color:T.textMuted, fontWeight:500 }}> · 체결 {chartTooltip.trade._rawTrades.length}건 합산 (평단)</span>
                              )}
                            </div>
                            <div style={{ color:T.text }}>가격: {chartTooltip.trade.price?.toLocaleString()}원</div>
                            {chartTooltip.trade.quantity && <div style={{ color:T.text }}>수량: {chartTooltip.trade.quantity}주</div>}
                            {chartTooltip.trade.total && <div style={{ color:T.text }}>금액: {chartTooltip.trade.total?.toLocaleString()}원</div>}
                            {/* ✅ v1.5.19: AI 인식 오류(예: 19주→1주 오독) 직접 교정용 */}
                            {isAdmin && (
                              <div style={{ display:"flex", gap:6, marginTop:8 }}>
                                <button onClick={() => openTradeEdit(chartTooltip.trade, ticker)}
                                  style={{ flex:1, fontSize:11, fontWeight:600, padding:"5px 0", borderRadius:6, border:`1px solid ${T.border}`, background:T.card, color:T.text, cursor:"pointer" }}>✏️ 수정</button>
                                <button onClick={() => deleteTradeEntry(chartTooltip.trade, ticker)}
                                  style={{ flex:1, fontSize:11, fontWeight:600, padding:"5px 0", borderRadius:6, border:"1px solid #ef4444", background:"transparent", color:"#ef4444", cursor:"pointer" }}>🗑️ 삭제</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          // 일반 캔들 툴팁
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 16px" }}>
                            <div style={{ color:T.textMuted }}>날짜 <span style={{ color:T.text, fontWeight:600 }}>{chartTooltip.candle.date}</span></div>
                            <div style={{ color:T.textMuted }}>종가 <span style={{ color:T.text, fontWeight:700 }}>{chartTooltip.candle.close?.toLocaleString()}원</span></div>
                            <div style={{ color:T.textMuted }}>시가 <span style={{ color:T.text }}>{chartTooltip.candle.open?.toLocaleString()}원</span></div>
                            <div style={{ color:T.textMuted }}>고가 <span style={{ color:"#ef4444" }}>{chartTooltip.candle.high?.toLocaleString()}원</span></div>
                            <div style={{ color:T.textMuted }}>저가 <span style={{ color:"#3b82f6" }}>{chartTooltip.candle.low?.toLocaleString()}원</span></div>
                            <div style={{ color:T.textMuted }}>거래량 <span style={{ color:T.text }}>{chartTooltip.candle.volume?.toLocaleString()}</span></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showPin && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: T.text }}>🔐 관리자 PIN</div>
            <input style={S.pinInput} type="password" inputMode="numeric" maxLength={6} placeholder="PIN 입력" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === "Enter" && checkPin()} autoFocus />
            {pinError && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>{pinError}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={S.btnSub} onClick={() => { setShowPin(false); setPinInput(""); setPinError(""); }}>취소</button>
              <button style={S.btnMain} onClick={checkPin}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 메인화면 편집 모달 */}
      {editingMain && (
        <div style={S.overlay}>
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: 20, width: "92vw", maxWidth: 480, textAlign: "left", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: T.text }}>✏️ 메인화면 편집</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>텍스트를 드래그해서 선택 후 아래 버튼으로 스타일 적용</div>
            <div style={{ background: T.section, borderRadius: 10, padding: "10px", marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: T.textMuted, minWidth: 28 }}>크기</span>
                {[12,14,16,18,20,24,28,32,40].map(sz => (
                  <button key={sz} onClick={() => {
                    const el = document.getElementById("richEditor"); if (!el) return; el.focus();
                    const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
                    const range = sel.getRangeAt(0); const frag = range.extractContents();
                    frag.querySelectorAll && frag.querySelectorAll("[style]").forEach(e2 => e2.style.removeProperty("font-size"));
                    const wrapper = document.createElement("span"); wrapper.style.fontSize = sz + "px"; wrapper.appendChild(frag);
                    range.insertNode(wrapper); range.setStartAfter(wrapper); range.collapse(true); sel.removeAllRanges(); sel.addRange(range);
                  }} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 5, color: T.textSub, padding: "3px 6px", fontSize: 10, cursor: "pointer" }}>
                    {sz}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: T.textMuted, minWidth: 28 }}>스타일</span>
                {[{label:"B",tag:"strong"},{label:"I",tag:"em"},{label:"U",tag:"u"}].map(b => (
                  <button key={b.label} onClick={() => {
                    const el = document.getElementById("richEditor"); if (!el) return; el.focus();
                    const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
                    const range = sel.getRangeAt(0); const frag = range.extractContents();
                    const wrapper = document.createElement(b.tag); wrapper.appendChild(frag);
                    range.insertNode(wrapper); range.setStartAfter(wrapper); range.collapse(true); sel.removeAllRanges(); sel.addRange(range);
                  }} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 5, color: T.textSub, padding: "3px 10px", fontSize: 13, cursor: "pointer" }}>
                    {b.label}
                  </button>
                ))}
                <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 4 }}>정렬</span>
                {[{label:"◀좌",align:"left"},{label:"■중",align:"center"},{label:"▶우",align:"right"}].map(a => (
                  <button key={a.align} onClick={() => {
                    const el = document.getElementById("richEditor"); if (!el) return; el.focus();
                    const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return;
                    const range = sel.getRangeAt(0); let block = range.commonAncestorContainer;
                    if (block.nodeType === 3) block = block.parentElement;
                    while (block && block !== el && !["P","DIV","H1","H2","H3","LI"].includes(block.tagName)) block = block.parentElement;
                    if (block && block !== el) block.style.textAlign = a.align; else el.style.textAlign = a.align;
                  }} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 5, color: T.textSub, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>
                    {a.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: T.textMuted, minWidth: 28 }}>색</span>
                {["#e2e8f0","#f59e0b","#4ade80","#60a5fa","#a78bfa","#ef4444","#f97316","#ec4899","#94a3b8","#1a1a2e"].map(c => (
                  <button key={c} title={c} onClick={() => {
                    const el = document.getElementById("richEditor"); if (!el) return; el.focus();
                    const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
                    const range = sel.getRangeAt(0); const frag = range.extractContents();
                    const wrapper = document.createElement("span"); wrapper.style.color = c; wrapper.appendChild(frag);
                    range.insertNode(wrapper); range.setStartAfter(wrapper); range.collapse(true); sel.removeAllRanges(); sel.addRange(range);
                  }} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: `2px solid ${T.border}`, cursor: "pointer", flexShrink: 0 }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <label style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 6, color: T.textSub, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                  🖼️ 이미지 업로드
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files[0]; if (!file) return;
                    const reader = new FileReader(); reader.onload = ev => {
                      const el = document.getElementById("richEditor"); if (!el) return; el.focus();
                      const img = document.createElement("img"); img.src = ev.target.result;
                      img.style.cssText = "max-width:100%;border-radius:8px;margin:8px 0;display:block;";
                      const sel = window.getSelection();
                      if (sel && sel.rangeCount > 0) { const range = sel.getRangeAt(0); range.collapse(false); range.insertNode(img); }
                      else el.appendChild(img);
                    }; reader.readAsDataURL(file); e.target.value = "";
                  }} />
                </label>
                <button onClick={() => {
                  const def = `<div style="text-align:center"><span style="font-size:40px">🐜</span><br/><span style="font-size:22px;font-weight:900;color:${T.text}">존버일기장</span><br/><br/><span style="font-size:18px;font-weight:700;color:#f59e0b">존버는 승리한다.<br/>왜냐하면 승리하기 때문이다.</span></div>`;
                  if (richEditorRef.current) richEditorRef.current.innerHTML = def;
                  setEditDraft(d => ({ ...d, html: null }));
                }} style={{ background: T.btnDangerBg, border: `1px solid ${T.btnDangerBorder}`, borderRadius: 6, color: T.btnDangerText, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                  🔄 기본값으로
                </button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>✍️ 여기서 직접 편집하세요</div>
            <div id="richEditor" ref={richEditorRef} contentEditable suppressContentEditableWarning
              style={{ minHeight: 180, background: T.bg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: "20px 16px", color: T.text, fontSize: 16, lineHeight: 1.7, outline: "none", marginBottom: 8, textAlign: "center" }} />
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 14 }}>💡 텍스트 드래그 선택 → 위 버튼으로 스타일 적용</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => setEditingMain(false)}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={() => { const el = document.getElementById("richEditor"); saveMainText(el ? el.innerHTML : null); }}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 계좌 추가 모달 */}
      {addAccModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: T.text }}>➕ 계좌 추가</div>
            <div style={{ textAlign: "left", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>계좌명</div>
              <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                placeholder="예: KB ISA, 미래에셋 CMA" value={newAccName} onChange={e => setNewAccName(e.target.value)} onKeyDown={e => e.key === "Enter" && addAccount()} autoFocus />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setAddAccModal(false); setNewAccName(""); }}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={addAccount}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 수기입력 모달 */}
      {manualModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 300 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: T.text }}>✏️ 수기 입력</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12 }}>{accounts.find(a => a.id === manualModal.accountId)?.name}</div>
            {/* 탭 */}
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {[{k:"stock",l:"📈 종목"},{k:"cash",l:"💵 예수금"}].map(tab => (
                <button key={tab.k} onClick={() => setManualMode(tab.k)}
                  style={{ flex:1, padding:"6px 0", fontSize:12, fontWeight:700, borderRadius:8, cursor:"pointer", border:"1px solid",
                    background: manualMode===tab.k ? (darkMode?"#1e3a5f":"#dbeafe") : T.section,
                    borderColor: manualMode===tab.k ? "#3b82f6" : T.border,
                    color: manualMode===tab.k ? "#3b82f6" : T.textMuted }}>
                  {tab.l}
                </button>
              ))}
            </div>
            {manualMode === "stock" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
                {[
                  { label: "종목명", placeholder: "예: SK하이닉스", value: manualTicker, onChange: e => setManualTicker(e.target.value) },
                  { label: "종목코드 (선택 — 입력하면 현재가 자동 갱신)", placeholder: "예: 000660", value: manualTickerCode, onChange: e => setManualTickerCode(e.target.value) },
                  { label: "보유 수량 (주)", placeholder: "예: 10", value: manualQty, onChange: e => setManualQty(e.target.value), type: "number" },
                  { label: "매수 평단가 (원)", placeholder: "예: 185000", value: manualAvg, onChange: e => setManualAvg(e.target.value), type: "number" },
                  { label: "현재가 (원, 선택)", placeholder: "비워두면 평단가로 설정", value: manualPrice, onChange: e => setManualPrice(e.target.value), type: "number" },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{f.label}</div>
                    <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type={f.type||"text"} placeholder={f.placeholder} value={f.value} onChange={f.onChange} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>예수금 금액 (원)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  type="number" placeholder="예: 1500000" value={manualCashAmount}
                  onChange={e => setManualCashAmount(e.target.value)} />
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}>💡 계좌당 예수금은 1개만 저장돼요. 다시 입력하면 덮어씌워집니다.</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setManualModal(null); setManualTicker(""); setManualTickerCode(""); setManualQty(""); setManualAvg(""); setManualPrice(""); setManualMode("stock"); setManualCashAmount(""); }}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={saveManualStock}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 종목 편집 모달 */}
      {editStockModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 300 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: T.text }}>✏️ 종목 수정</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>{editStockModal.stock.ticker}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>종목명 (OCR 오인식 교정용)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="text" placeholder="예: 티에프이" value={editStockName} onChange={e => setEditStockName(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>보유 수량 (주)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="number" placeholder="예: 100" value={editStockQty} onChange={e => setEditStockQty(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>매수 평단가 (원)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="number" placeholder="예: 85000" value={editStockAvg} onChange={e => setEditStockAvg(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setEditStockModal(null); setEditStockQty(""); setEditStockAvg(""); setEditStockName(""); }}>취소</button>
              <button style={{ ...S.btnDanger, flex: 1, fontSize: 12 }} onClick={() => { deleteStock(editStockModal.accountId, editStockModal.stock.ticker); setEditStockModal(null); }}>🗑️ 삭제</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={saveEditStock}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ v1.5.19: 개별 거래(매수/매도 1건) 수정 모달 - AI 인식 오류 교정용 */}
      {tradeEditModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 300 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: T.text }}>✏️ 거래 기록 수정</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>{tradeEditModal.ticker}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>날짜</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="date" value={teDate} onChange={e => setTeDate(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>매매구분</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["매수","매도"].map(tp => (
                    <button key={tp} onClick={() => setTeType(tp)}
                      style={{ flex:1, padding:"8px 0", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700,
                        border:`1px solid ${teType===tp ? (tp==='매수'?'#ef4444':'#3b82f6') : T.border}`,
                        background: teType===tp ? (tp==='매수' ? (darkMode?'#3a1a1a':'#fee2e2') : (darkMode?'#1a2a3a':'#dbeafe')) : "transparent",
                        color: teType===tp ? (tp==='매수'?'#ef4444':'#3b82f6') : T.textMuted }}>{tp}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>체결단가 (원)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="number" placeholder="예: 250750" value={tePrice} onChange={e => setTePrice(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>체결수량 (주)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="number" placeholder="예: 19" value={teQty} onChange={e => setTeQty(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => setTradeEditModal(null)}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={saveTradeEdit}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 일기장 수정 모달 */}
      {diaryEditModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 320, textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: T.text }}>✏️ 글 수정</div>
            {!isAdmin && diaryEditModal.password && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>비밀번호</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="password" placeholder="작성 시 입력한 비밀번호" value={diaryEditPw} onChange={e => setDiaryEditPw(e.target.value)} />
              </div>
            )}
            <textarea style={{ width: "100%", minHeight: 100, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: "10px", resize: "vertical", outline: "none", boxSizing: "border-box" }} value={diaryEditText} onChange={e => setDiaryEditText(e.target.value)} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setDiaryEditModal(null); setDiaryEditPw(""); }}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={editDiaryPost}>저장</button>
            </div>
          </div>
        </div>
      )}
      {diaryDeleteModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 300, textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: T.text }}>🗑️ 글 삭제</div>
            <div style={{ fontSize: 12, color: T.textSub, marginBottom: 12 }}>정말 삭제할까요? 되돌릴 수 없어요.</div>
            {!isAdmin && diaryDeleteModal.password && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>비밀번호</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="password" placeholder="작성 시 입력한 비밀번호" value={diaryDeletePw} onChange={e => setDiaryDeletePw(e.target.value)} />
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setDiaryDeleteModal(null); setDiaryDeletePw(""); }}>취소</button>
              <button style={{ ...S.btnDanger, flex: 1 }} onClick={deleteDiaryPost}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 구루 의견 추가/수정 모달 */}
      {guruModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 320, textAlign: "left", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: T.text }}>
              {guruModal === 'new' ? "🔮 의견 추가" : "✏️ 의견 수정"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>날짜 (발표일)</div>
                <input type="date" style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  value={guruForm.date} onChange={e => setGuruForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>구루명</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  placeholder="예: 김프로" value={guruForm.guru} onChange={e => setGuruForm(f => ({ ...f, guru: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>대상 (종목 / 지수 / 시장전반)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  placeholder="예: 코스피, 삼성전자" value={guruForm.target} onChange={e => setGuruForm(f => ({ ...f, target: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>포지션</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ k: "long", l: "📈 롱" }, { k: "short", l: "📉 숏" }, { k: "neutral", l: "➖ 중립" }].map(p => (
                    <button key={p.k} onClick={() => setGuruForm(f => ({ ...f, position: p.k }))}
                      style={{ flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: "pointer", border: "1px solid",
                        background: guruForm.position === p.k ? (darkMode ? "#1e3a5f" : "#dbeafe") : T.section,
                        borderColor: guruForm.position === p.k ? "#3b82f6" : T.border,
                        color: guruForm.position === p.k ? "#3b82f6" : T.textMuted }}>{p.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>출처 제목 (영상/기사명)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  placeholder="예: OO 유튜브 8월 전망" value={guruForm.source} onChange={e => setGuruForm(f => ({ ...f, source: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>출처 링크 (선택)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  placeholder="https://..." value={guruForm.sourceUrl} onChange={e => setGuruForm(f => ({ ...f, sourceUrl: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>의견 요약</div>
                <textarea style={{ width: "100%", minHeight: 60, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: "8px 10px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  placeholder="핵심 코멘트" value={guruForm.summary} onChange={e => setGuruForm(f => ({ ...f, summary: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>결과 판정</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ k: "pending", l: "미정" }, { k: "hit", l: "✅ 적중" }, { k: "miss", l: "❌ 불일치" }].map(v => (
                    <button key={v.k} onClick={() => setGuruForm(f => ({ ...f, verdict: v.k }))}
                      style={{ flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: "pointer", border: "1px solid",
                        background: guruForm.verdict === v.k ? (darkMode ? "#1e3a5f" : "#dbeafe") : T.section,
                        borderColor: guruForm.verdict === v.k ? "#3b82f6" : T.border,
                        color: guruForm.verdict === v.k ? "#3b82f6" : T.textMuted }}>{v.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>메모 (선택)</div>
                <textarea style={{ width: "100%", minHeight: 44, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: "8px 10px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  placeholder="추가 메모" value={guruForm.memo} onChange={e => setGuruForm(f => ({ ...f, memo: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => setGuruModal(null)}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={saveGuruOpinion}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div style={S.header}>
        <div style={S.logoRow}>
          <span style={{ fontSize: 24 }}>🐜</span>
          <span style={S.logoText}>존버일기장</span>
          <span style={S.verBadge}>{VERSION}</span>
          {/* 홈(시장현황) 버튼 */}
          <button onClick={() => { const next = activeTab !== "home"; setActiveTab(next ? "home" : "portfolio"); if (next) { if (!marketData) loadMarketData(); if (!concentrationData) loadConcentrationHistory(); loadIndexChart(perfRange); } }}
            style={{ background: activeTab === "home" ? (darkMode?"#1e3a5f":"#dbeafe") : T.section, border: `1px solid ${activeTab==="home"?"#3b82f6":T.border}`, borderRadius: 8, padding: "4px 8px", fontSize: 14, cursor: "pointer", lineHeight: 1, color: activeTab==="home"?"#3b82f6":T.textMuted }}
            title="시장 현황">🏠</button>
          {/* 다크/라이트 토글 */}
          <button onClick={toggleDarkMode} style={{ background: T.section, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 8px", fontSize: 14, cursor: "pointer", lineHeight: 1 }} title={darkMode ? "라이트 모드" : "다크 모드"}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          {isAdmin && <button onClick={() => setShowWealth(v => !v)} style={{ background: showWealth ? (darkMode ? "#1a2a1a" : "#dcfce7") : T.section, border: `1px solid ${showWealth ? "#22c55e" : T.border}`, borderRadius: 8, color: showWealth ? "#22c55e" : T.textMuted, padding: "4px 10px", fontSize: 14, cursor: "pointer", lineHeight: 1 }} title={showWealth ? "자산 비공개" : "자산 공개"}>{showWealth ? "🔓" : "🔒"}</button>}
          {isAdmin ? <button style={S.adminTag} onClick={() => { sessionStorage.removeItem("jb_pin"); setIsAdmin(false); setIsViewer(false); setShowWealth(false); }}>관리자 ✕</button>
            : isViewer ? <button style={S.adminTag} onClick={() => setIsViewer(false)}>조회중 ✕</button>
            : <button style={S.loginTag} onClick={() => setShowPin(true)}>관리자</button>}
        </div>
        <p style={S.sub}>{isAdmin && activeTab !== "home" ? "📤 이미지 올려서 분석 후 저장" : isViewer && activeTab !== "home" ? "📊 존버 매매기록 조회 중" : ""}</p>
        {isAdmin && activeTab !== "home" && (
          <button style={{ ...S.btnSub, fontSize: 11, padding: "4px 14px", marginTop: 8 }} onClick={() => { setEditDraft({ ...mainText }); setEditingMain(true); }}>
            ✏️ 입장화면 편집
          </button>
        )}
      </div>

      {/* 관리자 업로드 영역 - 홈 탭일 때 숨김 */}
      {isAdmin && activeTab !== "home" && (
        <>
          <div style={{ ...S.drop, ...(dragOver ? S.dropOn : {}) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
            <div style={{ fontSize: 32, marginBottom: 6 }}>📱</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>매매내역 이미지 업로드</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>여러 날짜 누적 저장 가능</div>
          </div>
          {images.length > 0 && (
            <div style={S.grid}>
              {images.map(img => (
                <div key={img.id} style={S.card}>
                  <div style={{ position: "relative" }}>
                    <img src={img.preview} alt="" style={S.thumb} />
                    <button style={S.xBtn} onClick={() => setImages(p => p.filter(i => i.id !== img.id))}>✕</button>
                  </div>
                  <div style={{ padding: "6px 8px", fontSize: 11 }}>
                    {img.loading && <span style={{ color: "#f59e0b" }}>⏳ 분석 중…</span>}
                    {img.error && <span style={{ color: "#ef4444" }}>⚠️ {img.error}</span>}
                    {img.result && !img.loading && <span style={{ color: "#4ade80" }}>✅ {img.result.stocks?.length}개 종목</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {allDone && images.some(i => i.result) && (
            <button style={{ ...S.btnMain, width: "100%", marginBottom: 10 }} onClick={saveResults} disabled={merging}>{merging ? "저장 중…" : "💾 매매기록 저장"}</button>
          )}
          <input ref={portfolioRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { if (e.target.files[0] && uploadingAccount) { analyzePortfolio(e.target.files[0], uploadingAccount); e.target.value = ""; } }} />
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: T.textMuted }}>📈 계좌별 포트폴리오 업로드</div>
              <button style={{ background: darkMode ? "#1a2a1a" : "#dcfce7", border: "1px solid #166534", borderRadius: 8, color: "#4ade80", padding: "4px 10px", fontSize: 12, cursor: "pointer" }} onClick={() => setAddAccModal(true)}>➕ 계좌 추가</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{ display: "flex", alignItems: "center", gap: 8, background: T.section, border: `1px solid ${T.sectionBorder}`, borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{acc.name}</span>
                    {portfolios[acc.id] && (
                      <span style={{ fontSize: 11, color: "#4ade80", marginLeft: 8 }}>
                        ✅ {portfolios[acc.id].stocks?.length}종목
                        {portfolios[acc.id].approximateData && <span style={{ fontSize: 10, color: "#f59e0b", marginLeft: 4 }}>⚠️ 금액기준</span>}
                      </span>
                    )}
                  </div>
                  <button style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSub, padding: "5px 12px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                    disabled={portfolioLoading === acc.id}
                    onClick={() => { setUploadingAccount(acc.id); setTimeout(() => portfolioRef.current?.click(), 50); }}>
                    {portfolioLoading === acc.id ? "⏳" : "📤 업로드"}
                  </button>
                  <button style={{ background: darkMode ? "#1a2a1a" : "#dcfce7", border: "1px solid #166534", borderRadius: 8, color: "#4ade80", padding: "5px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                    onClick={() => { setManualModal({ accountId: acc.id }); setManualTicker(""); setManualTickerCode(""); setManualQty(""); setManualAvg(""); setManualPrice(""); }}>✏️</button>
                  {portfolios[acc.id] && <button title="포트폴리오 내역 초기화 (계좌 유지)" style={{ background: T.btnDangerBg, border: `1px solid ${T.btnDangerBorder}`, borderRadius: 8, color: T.btnDangerText, padding: "5px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }} onClick={() => clearPortfolio(acc.id)}>🗑️</button>}
                  <button title="계좌 완전 삭제" style={{ background: T.btnDangerBg, border: `1px solid ${T.btnDangerBorder}`, borderRadius: 8, color: T.textMuted, padding: "5px 8px", fontSize: 11, cursor: "pointer", flexShrink: 0 }} onClick={() => deleteAccount(acc.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button style={{ ...S.btnDanger, flex: 1, fontSize: 12, padding: "10px 8px" }} onClick={clearRecords}>🗑️ 매매기록</button>
            <button style={{ ...S.btnDanger, flex: 1, fontSize: 12, padding: "10px 8px" }} onClick={clearAll}>🗑️ 전체삭제</button>
          </div>
        </>
      )}

      {/* 뷰어 영역 */}
      {isViewer && (
        <>
          {/* 탭 3개 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[
              { id: "portfolio", label: "📊 포트폴리오", activeBg: darkMode ? "#1a2a1a" : "#dcfce7", activeBorder: "#15803d", activeColor: darkMode ? "#22c55e" : "#15803d" },
              { id: "history", label: "📋 매매기록", activeBg: darkMode ? "#1a1a2a" : "#ede9fe", activeBorder: darkMode ? "#6366f1" : "#7c3aed", activeColor: darkMode ? "#a78bfa" : "#6d28d9" },
              { id: "diary", label: "🐜 존버기록실", activeBg: darkMode ? "#1a1500" : "#fef9c3", activeBorder: darkMode ? "#f59e0b" : "#ca8a04", activeColor: darkMode ? "#f59e0b" : "#92400e" },
              { id: "gurus", label: "🔮 구루의견", activeBg: darkMode ? "#2a1a3a" : "#fce7f3", activeBorder: darkMode ? "#c084fc" : "#be185d", activeColor: darkMode ? "#e9d5ff" : "#be185d" },
            ].map(tab => (
              <button key={tab.id} onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "history" && allRecords.length > 0) {
                  const allDates = allRecords.flatMap(r => r.result?.stocks||[]).flatMap(s => s.trades||[]).map(t => t.date).sort();
                  const latest = allDates[allDates.length-1];
                  if (latest) { const d = new Date(latest); d.setDate(d.getDate()-6); setStartDate(d.toISOString().split("T")[0]); setEndDate(latest); setDateError(""); }
                }
              }} style={{ flex: 1, padding: "10px 4px", fontSize: 11, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                background: activeTab === tab.id ? tab.activeBg : T.section,
                borderColor: activeTab === tab.id ? tab.activeBorder : T.sectionBorder,
                color: activeTab === tab.id ? tab.activeColor : T.text,
              }}>{tab.label}</button>
            ))}
          </div>

          {/* 포트폴리오 탭 */}
          {activeTab === "portfolio" && (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
                {[{ id: "all", name: "전체합산" }, ...accounts].map(acc => (
                  <button key={acc.id} onClick={() => { setActiveAccount(acc.id); setPortfolioEditMode(false); }}
                    style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "1px solid", whiteSpace: "nowrap", flexShrink: 0,
                      background: activeAccount === acc.id ? (darkMode ? "#1e3a5f" : "#dbeafe") : T.section,
                      borderColor: activeAccount === acc.id ? "#3b82f6" : T.sectionBorder,
                      color: activeAccount === acc.id ? (darkMode ? "#60a5fa" : "#1d4ed8") : T.text,
                    }}>
                    {acc.name}
                    {acc.id !== "all" && portfolios[acc.id] && <span style={{ color: "#4ade80", marginLeft: 4 }}>●</span>}
                  </button>
                ))}
              </div>
              {displayPortfolio ? (
                <>
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spinner { width: 14px; height: 14px; border: 2px solid ${T.border}; border-top-color: #60a5fa; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }`}</style>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: T.textMuted }}>{lastUpdated ? `📅 ${lastUpdated} 기준 주가를 갱신했습니다.` : ""}</span>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {isAdmin && activeAccount !== "all" && (
                          <button onClick={() => setPortfolioEditMode(v => !v)} style={{ background: portfolioEditMode ? (darkMode ? "#1a2a3a" : "#dbeafe") : T.section, border: `1px solid ${portfolioEditMode ? "#60a5fa" : T.border}`, borderRadius: 8, color: portfolioEditMode ? "#60a5fa" : T.textSub, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                            {portfolioEditMode ? "✏️ 편집 종료" : "✏️ 종목 편집"}
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={savePerformance} disabled={perfSaving}
                            style={{ background: perfSaving ? T.section : (darkMode?"#1a2a1a":"#dcfce7"), border: `1px solid ${perfSaving?"#aaa":"#22c55e"}`, borderRadius: 8, color: perfSaving ? T.textMuted : "#16a34a", padding: "4px 12px", fontSize: 12, cursor: perfSaving ? "default" : "pointer" }}>
                            {perfSaving ? "⏳ 저장 중..." : "📊 성과 기록"}
                          </button>
                        )}
                        <button onClick={() => { const all = Object.values(portfolios).flatMap(p => p.stocks||[]).filter(s => !s.approximateData); const unique = [...new Map(all.map(s=>[s.ticker,s])).values()]; fetchLivePrices(unique); }}
                          disabled={priceLoading}
                          style={{ background: T.section, border: `1px solid ${T.border}`, borderRadius: 8, color: priceLoading ? "#60a5fa" : T.textSub, padding: "4px 12px", fontSize: 12, cursor: priceLoading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                          {priceLoading ? <><span className="spinner" /><span>갱신 중...</span></> : "🔄 현재가 갱신"}
                        </button>
                      </div>
                    </div>
                    {priceLoading && <div style={{ fontSize: 11, color: "#60a5fa", marginTop: 6, textAlign: "right" }}>잠시만 기다려주세요, 현재 가격을 갱신 중입니다.</div>}
                  </div>
                  {showWealth && (
                    <div style={{ background: darkMode ? "#0f1f0f" : "#dcfce7", border: "1px solid #166534", borderRadius: 12, padding: "12px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>🔓 총 보유금액</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: "#22c55e" }}>{(displayPortfolio.totalValue || 0).toLocaleString()}원</span>
                    </div>
                  )}
                  {activeAccount === "all" && displayPortfolio.approxTotal > 0 && (
                    <div style={{ background: darkMode ? "#1a1500" : "#fffbeb", border: "1px solid #b45309", borderRadius: 10, padding: "8px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#f59e0b" }}>
                      <span>⚠️ 금액기준 계좌(DC 등) 종목은 차트 제외</span>
                      <span style={{ fontWeight: 700 }}>+{displayPortfolio.approxTotal.toLocaleString()}원 포함</span>
                    </div>
                  )}
                  <PortfolioChart T={T} isAdmin={isAdmin} showWealth={showWealth}
                    onChart={(s) => {
                      // 원본 stock에서 tickerCode, isOverseas 찾기
                      const allS = Object.values(portfolios).flatMap(p => p.stocks || []);
                      const orig = allS.find(st => st.ticker === s.ticker) || s;
                      // avgBuy: 전체합산뷰의 가중평균 평단(s.avgBuy) 우선, 없으면 개별계좌 평단
                      const avgBuy = s.avgBuy || orig.avgBuyPrice || null;
                      openChart({ ticker: s.ticker, tickerCode: orig.tickerCode, isOverseas: orig.isOverseas || false, avgBuy });
                    }}
                    onEdit={(activeAccount !== "all" && portfolioEditMode) ? (s) => {
                      const origStock = portfolios[activeAccount]?.stocks?.find(st => st.ticker === s.ticker);
                      if (origStock) { setEditStockModal({ accountId: activeAccount, stock: origStock }); setEditStockQty(String(origStock.quantity||"")); setEditStockAvg(String(origStock.avgBuyPrice||"")); setEditStockName(origStock.ticker||""); }
                    } : null}
                    data={displayPortfolio.stocks?.map(s => {
                      const currentPrice = livePrices[s.ticker] || s.currentPrice;
                      const value = s.isOverseas ? Math.round(livePrices[s.ticker] ? livePrices[s.ticker] * s.quantity : (s.currentValue || 0)) : Math.round(currentPrice * s.quantity);
                      return { ticker: s.ticker, value, avgBuy: s.isOverseas ? null : s.avgBuyPrice, current: s.isOverseas ? livePrices[s.ticker] || null : currentPrice, qty: s.quantity, isOverseas: s.isOverseas, returnRate: s.returnRate, approximateData: s.approximateData, isCash: s.isCash || false };
                    })} />
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: T.textMuted, background: T.card, borderRadius: 16, border: `1px solid ${T.cardBorder}` }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.textSub, marginBottom: 6 }}>
                    {activeAccount === "all" ? "등록된 계좌가 없어요" : "아직 포트폴리오 등록이 되지 않았습니다."}
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{activeAccount === "all" ? "관리자 로그인 후 업로드해주세요" : `${accounts.find(a=>a.id===activeAccount)?.name} 계좌를 준비 중이에요`}</div>
                </div>
              )}
            </>
          )}

          {/* 매매기록 탭 */}
          {activeTab === "history" && (
            <>
              {allRecords.length > 0 && (
                <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>📅 조회 기간 설정</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[
                      { label: "오늘", action: () => { setStartDate(maxDate); setEndDate(maxDate); setDateError(""); } },
                      { label: "1주", action: () => { const d = new Date(maxDate); d.setDate(d.getDate()-6); setStartDate(d.toISOString().split("T")[0]); setEndDate(maxDate); setDateError(""); } },
                      { label: "1달", action: () => { const d = new Date(maxDate); d.setMonth(d.getMonth()-1); setStartDate(d.toISOString().split("T")[0]); setEndDate(maxDate); setDateError(""); } },
                      { label: "전체", action: () => { setStartDate(""); setEndDate(""); setDateError(""); } },
                    ].map(btn => <button key={btn.label} onClick={btn.action} style={{ ...S.btnSub, padding: "5px 12px", fontSize: 12 }}>{btn.label}</button>)}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                    {[{label:"시작일",value:startDate,onChange:e=>{const v=e.target.value;if(endDate&&v>endDate)setDateError("시작일이 종료일보다 빠를 수 없습니다.");else{setDateError("");setStartDate(v);}}},{label:"종료일",value:endDate,onChange:e=>{const v=e.target.value;if(startDate&&v<startDate)setDateError("시작일이 종료일보다 빠를 수 없습니다.");else{setDateError("");setEndDate(v);}}}].map((f,i) => (
                      <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                        <span style={{ fontSize: 10, color: T.textMuted }}>{f.label}</span>
                        <input type="date" value={f.value} onChange={f.onChange} style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "6px 10px", fontSize: 13, outline: "none" }} />
                      </div>
                    ))}
                  </div>
                  {dateError && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 6 }}>⚠️ {dateError}</div>}
                  {(startDate||endDate) && !dateError && <div style={{ fontSize: 11, color: "#6366f1", marginTop: 6 }}>📌 {startDate||minDate} ~ {endDate||maxDate} 조회 중</div>}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {[{id:"buy",label:"🔴 매수 기록",activeBg:darkMode?"#2d1515":"#fef2f2",activeBorder:"#ef4444",activeColor:"#ef4444"},{id:"sell",label:"🔵 매도 기록",activeBg:darkMode?"#151d2d":"#eff6ff",activeBorder:"#3b82f6",activeColor:"#3b82f6"}].map(tab => (
                  <button key={tab.id} onClick={() => setHistorySubTab(tab.id)} style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                    background: historySubTab === tab.id ? tab.activeBg : T.section,
                    borderColor: historySubTab === tab.id ? tab.activeBorder : T.sectionBorder,
                    color: historySubTab === tab.id ? tab.activeColor : T.text,
                  }}>{tab.label}</button>
                ))}
              </div>
              <DonutChart T={T} data={historySubTab==="buy"?buyPieData:sellPieData} title={historySubTab==="buy"?"📊 매수 비중 (투자금 기준)":"📊 매도 비중 (매도금 기준)"} labelName="종목명" labelPct={historySubTab==="buy"?"매수비중":"매도비중"} labelAvg={historySubTab==="buy"?"매수평단":"매도평단"} />
              {showWealth && (() => {
                const totalBuy = buyPieData.reduce((s,d)=>s+d.value,0), totalSell = sellPieData.reduce((s,d)=>s+d.value,0);
                return (
                  <div style={{ background: darkMode?"#0f1f0f":"#dcfce7", border:"1px solid #166534", borderRadius:12, padding:"12px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"#4ade80", fontWeight:700 }}>🔓 총 {historySubTab==="buy"?"매수":"매도"}금액</span>
                    <span style={{ fontSize:18, fontWeight:900, color:"#22c55e" }}>{(historySubTab==="buy"?totalBuy:totalSell).toLocaleString()}원</span>
                  </div>
                );
              })()}
              {allRecords.length === 0 && <div style={{ textAlign:"center", padding:"40px 20px", color:T.textMuted }}><div style={{ fontSize:40, marginBottom:12 }}>📋</div><div style={{ fontSize:14 }}>아직 저장된 매매기록이 없어요</div><div style={{ fontSize:12, marginTop:6 }}>관리자 로그인 후 이미지를 업로드해주세요</div></div>}
              {allRecords.length > 0 && displayStocks.length === 0 && <div style={{ textAlign:"center", padding:"30px", color:T.textMuted, fontSize:14 }}>선택한 기간에 {historySubTab==="buy"?"매수":"매도"} 기록이 없어요</div>}
              {displayStocks.map((stock, i) => {
                const trades = stock.trades.filter(t => t.type === (historySubTab==="buy"?"매수":"매도"));
                const totalVal = historySubTab==="buy" ? buyPieData.reduce((s,d)=>s+d.value,0) : sellPieData.reduce((s,d)=>s+d.value,0);
                const myVal = historySubTab==="buy" ? (buyPieData.find(s=>s.ticker===stock.ticker)?.value||0) : (sellPieData.find(s=>s.ticker===stock.ticker)?.value||0);
                const pct = totalVal ? Math.round(myVal/totalVal*1000)/10 : 0;
                const avgPrice = historySubTab==="buy" ? stock.avgBuyPrice : sellPieData.find(s=>s.ticker===stock.ticker)?.avgPrice;
                return (
                  <div key={i} style={S.stockCard}>
                    <div style={{ display:"flex", alignItems:"center", marginBottom:8 }}>
                      <div style={{ flex:2 }}>
                        <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>종목명</div>
                        <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{stock.ticker}</span>
                      </div>
                      <div style={{ flex:1, textAlign:"center" }}>
                        <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>{historySubTab==="buy"?"매수비중":"매도비중"}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:historySubTab==="buy"?"#ef4444":"#3b82f6" }}>{Number(pct).toFixed(1)}%</div>
                      </div>
                      <div style={{ flex:1, textAlign:"right" }}>
                        <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>{historySubTab==="buy"?"매수평단":"매도평단"}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{avgPrice?.toLocaleString()}원</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:8 }}>
                      {(() => {
                        const byDate = trades.reduce((acc,t) => { if(!acc[t.date]) acc[t.date]={date:t.date,type:t.type,totalAmt:0,totalQty:0}; acc[t.date].totalAmt+=t.price*t.quantity; acc[t.date].totalQty+=t.quantity; return acc; },{});
                        return Object.values(byDate).map((g,j) => {
                          const avgP = Math.round(g.totalAmt/g.totalQty);
                          return (
                            <div key={j} style={{ display:"flex", gap:8, fontSize:12, alignItems:"center" }}>
                              <span style={{ color:T.textSub, minWidth:76 }}>{g.date}</span>
                              <span style={{ fontWeight:700, color:g.type==="매수"?"#ef4444":"#3b82f6", minWidth:24 }}>{g.type}</span>
                              <span style={{ color:T.textSub, flex:1 }}>평단 {avgP?.toLocaleString()}원</span>
                              {showWealth && <span style={{ color:"#22c55e", fontWeight:600 }}>{g.totalQty}주 · {g.totalAmt?.toLocaleString()}원</span>}
                            </div>
                          );
                        });
                      })()}
                    </div>
                    {stock.insight && isAdmin && <div style={S.insight}>{stock.insight}</div>}
                  </div>
                );
              })}
              {allRecords.length > 0 && historySubTab === "buy" && (
                <div style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:14, padding:16, marginTop:12 }}>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:10, color:T.text }}>공유 텍스트</div>
                  <pre style={{ background:T.section, borderRadius:8, padding:"10px 12px", fontSize:11, color:T.textSub, whiteSpace:"pre-wrap", marginBottom:10, border:`1px solid ${T.sectionBorder}`, fontFamily:"monospace" }}>{shareText()}</pre>
                  <button style={S.btnMain} onClick={() => { navigator.clipboard.writeText(shareText()).then(() => { setShareMsg("✅ 복사됐어요!"); setTimeout(() => setShareMsg(""),2500); }); }}>📋 텍스트 복사</button>
                  {shareMsg && <p style={{ color:"#4ade80", fontSize:13, marginTop:8 }}>{shareMsg}</p>}
                </div>
              )}
            </>
          )}

          {/* 존버기록실 탭 */}
          {activeTab === "diary" && (
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16, minHeight:200 }}>
                {diaryPosts.length === 0 && (
                  <div style={{ textAlign:"center", padding:"40px 20px", color:T.textMuted }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>🐜</div>
                    <div style={{ fontSize:13 }}>아직 작성된 글이 없어요</div>
                  </div>
                )}
                {diaryPosts.map(post => {
                  const isMine = (isAdmin && post.isAdmin) || post.sessionId === mySessionId;
                  const isSecretHidden = post.isSecret && !isAdmin;
                  const timeStr = new Date(post.createdAt).toLocaleString("ko-KR", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" });
                  const editStr = post.editedAt ? new Date(post.editedAt).toLocaleString("ko-KR", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }) : null;
                  const preview = linkPreviews[post.id];
                  return (
                    <div key={post.id} style={{ display:"flex", flexDirection:isMine?"row-reverse":"row", alignItems:"flex-end", gap:8 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:isMine?(darkMode?"#1e3a5f":"#dbeafe"):(darkMode?"#1e293b":"#ede8e0"), display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                        {post.isAdmin?"🐜":isMine?"😊":"👤"}
                      </div>
                      <div style={{ maxWidth:"75%", display:"flex", flexDirection:"column", alignItems:isMine?"flex-end":"flex-start", gap:2 }}>
                        <div style={{ fontSize:11, color:T.textSub, fontWeight:600, marginBottom:2, paddingLeft:isMine?0:4, paddingRight:isMine?4:0 }}>
                          {post.isSecret && <span style={{ marginRight:4 }}>🔒</span>}
                          {post.nickname}
                        </div>
                        {post.replyPreview && (
                          <div style={{ background:T.section, borderLeft:isMine?"none":`2px solid #6366f1`, borderRight:isMine?`2px solid #6366f1`:"none", padding:"4px 8px", borderRadius:6, fontSize:11, color:T.textSub, maxWidth:"100%" }}>
                            {post.replyPreview}
                          </div>
                        )}
                        <div style={{ background:isMine?T.msgMine:T.msgOther, border:`1px solid ${isMine?T.msgMineBorder:T.msgOtherBorder}`, borderRadius:isMine?"16px 4px 16px 16px":"4px 16px 16px 16px", padding:"10px 14px", fontSize:13, color:isSecretHidden?T.textMuted:T.msgText, lineHeight:1.6, fontStyle:isSecretHidden?"italic":"normal" }}>
                          {isSecretHidden ? "🔒 비밀글입니다" : post.text}
                          {!isSecretHidden && post.linkUrl && (
                            preview?.title ? (
                              <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display:"block", marginTop:8, textDecoration:"none" }}>
                                <div style={{ background:T.section, border:`1px solid ${T.sectionBorder}`, borderRadius:10, overflow:"hidden" }}>
                                  {preview.image && <img src={preview.image} alt="" style={{ width:"100%", maxHeight:140, objectFit:"cover", display:"block" }} onError={e => { e.target.style.display="none"; }} />}
                                  <div style={{ padding:"8px 10px" }}>
                                    {preview.domain && <div style={{ fontSize:9, color:T.textMuted, marginBottom:3 }}>{preview.domain}</div>}
                                    <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:3 }}>{preview.title}</div>
                                    {preview.description && <div style={{ fontSize:11, color:T.textSub }}>{preview.description}</div>}
                                  </div>
                                </div>
                              </a>
                            ) : <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display:"block", marginTop:6, color:"#60a5fa", fontSize:11, wordBreak:"break-all" }}>🔗 {post.linkUrl}</a>
                          )}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexDirection:isMine?"row-reverse":"row" }}>
                          <span style={{ fontSize:10, color:T.textMuted }}>{timeStr}{editStr?` · ${editStr} 수정됨`:""}</span>
                          {isViewer && <button onClick={() => { setDiaryReplyTo(post); }} style={{ background:"none", border:"none", color:darkMode?"#60a5fa":"#2563eb", fontSize:11, cursor:"pointer", padding:"0 2px", fontWeight:600 }}>↩ 답글</button>}
                          {(isAdmin||post.password) && !isSecretHidden && (<>
                            <button onClick={() => { setDiaryEditModal(post); setDiaryEditText(post.text); }} style={{ background:"none", border:"none", color:T.textMuted, fontSize:10, cursor:"pointer", padding:"0 2px" }}>수정</button>
                            <button onClick={() => setDiaryDeleteModal(post)} style={{ background:"none", border:"none", color:T.textMuted, fontSize:10, cursor:"pointer", padding:"0 2px" }}>삭제</button>
                          </>)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 글쓰기 영역 */}
              <div style={{ position:"sticky", bottom:0, paddingTop:8, background:T.diaryBg }}>
                {diaryReplyTo && (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:T.section, borderLeft:"3px solid #6366f1", padding:"6px 12px", borderRadius:8, marginBottom:6 }}>
                    <span style={{ fontSize:11, color:T.textSub }}>↩ {diaryReplyTo.nickname}: {diaryReplyTo.text.slice(0,40)}...</span>
                    <button onClick={() => setDiaryReplyTo(null)} style={{ background:"none", border:"none", color:T.textMuted, fontSize:14, cursor:"pointer" }}>✕</button>
                  </div>
                )}
                {!isAdmin && (
                  <div style={{ display:"flex", gap:6, marginBottom:6 }}>
                    <input style={{ flex:1, background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12, padding:"6px 10px", outline:"none", boxSizing:"border-box" }} placeholder="닉네임" value={diaryNickname} onChange={e => setDiaryNickname(e.target.value)} />
                    <input type="password" style={{ flex:1, background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12, padding:"6px 10px", outline:"none", boxSizing:"border-box" }} placeholder="비밀번호 (수정/삭제용)" value={diaryPassword} onChange={e => setDiaryPassword(e.target.value)} />
                  </div>
                )}
                {isAdmin && (<>
                  <input style={{ width:"100%", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12, padding:"6px 10px", outline:"none", boxSizing:"border-box", marginBottom:6 }}
                    placeholder="🔗 링크 URL (선택)" value={diaryLinkUrl} onChange={e => { setDiaryLinkUrl(e.target.value); setPreviewDraft(null); }} onBlur={e => { if(e.target.value) fetchLinkPreview(e.target.value, null); }} />
                  {previewDraft && (
                    <div style={{ background:T.section, border:`1px solid ${T.sectionBorder}`, borderRadius:10, overflow:"hidden", marginBottom:6 }}>
                      {previewDraft.image && <img src={previewDraft.image} alt="" style={{ width:"100%", maxHeight:100, objectFit:"cover", display:"block" }} onError={e => { e.target.style.display="none"; }} />}
                      <div style={{ padding:"6px 10px" }}>
                        {previewDraft.domain && <div style={{ fontSize:9, color:T.textMuted }}>{previewDraft.domain}</div>}
                        {previewDraft.title && <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{previewDraft.title}</div>}
                      </div>
                    </div>
                  )}
                </>)}
                <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                  <textarea autoFocus style={{ flex:1, minHeight:44, maxHeight:120, background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:22, color:T.text, fontSize:14, padding:"10px 16px", resize:"none", outline:"none", boxSizing:"border-box", lineHeight:1.5, display:"block" }}
                    placeholder="Write a message..." value={diaryText} onChange={e => setDiaryText(e.target.value)}
                    onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(diaryText.trim())addDiaryPost();} }} />
                  <button onClick={() => setDiarySecret(v => !v)} title={diarySecret?"비밀글":"공개글"}
                    style={{ width:44, height:44, borderRadius:"50%", border:`1px solid ${diarySecret?"#f59e0b":T.border}`, background:diarySecret?(darkMode?"#1a1500":"#fffbeb"):"transparent", fontSize:18, cursor:"pointer", flexShrink:0 }}>
                    {diarySecret?"🔒":"🔓"}
                  </button>
                  <button onClick={addDiaryPost} disabled={!diaryText.trim()&&!diaryLinkUrl.trim()}
                    style={{ width:44, height:44, borderRadius:"50%", background:(diaryText.trim()||diaryLinkUrl.trim())?T.btnGrad:T.section, border:"none", color:(diaryText.trim()||diaryLinkUrl.trim())?"#fff":T.textMuted, fontSize:18, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    ➤
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 구루의 의견 탭 */}
          {activeTab === "gurus" && (
            <div>
              {isAdmin && (
                <button style={{ ...S.btnMain, width: "100%", marginBottom: 12 }}
                  onClick={() => { setGuruForm({ date: new Date().toISOString().split("T")[0], guru: "", target: "", position: "long", source: "", sourceUrl: "", summary: "", verdict: "pending", memo: "" }); setGuruModal('new'); }}>
                  ➕ 의견 추가
                </button>
              )}
              {gurus.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: T.textMuted }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔮</div>
                  <div style={{ fontSize: 13 }}>아직 기록된 의견이 없어요</div>
                </div>
              ) : (() => {
                const guruNames = [...new Set(gurus.map(g => g.guru))];
                const filtered = (guruFilter === "all" ? gurus : gurus.filter(g => g.guru === guruFilter))
                  .slice().sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));
                const posLabel = { long: "📈 롱", short: "📉 숏", neutral: "➖ 중립" };
                const posColor = { long: "#ef4444", short: "#3b82f6", neutral: "#94a3b8" };
                const verdictLabel = { hit: "✅ 적중", miss: "❌ 불일치", pending: "⏳ 미정" };
                const verdictColor = { hit: "#22c55e", miss: "#f97316", pending: "#94a3b8" };
                return (
                  <>
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
                      {["all", ...guruNames].map(name => (
                        <button key={name} onClick={() => setGuruFilter(name)}
                          style={{ flexShrink: 0, padding: "6px 12px", fontSize: 11, fontWeight: 700, borderRadius: 20, cursor: "pointer", border: "1px solid",
                            background: guruFilter === name ? (darkMode ? "#2a1a3a" : "#fce7f3") : T.section,
                            borderColor: guruFilter === name ? "#be185d" : T.border,
                            color: guruFilter === name ? (darkMode ? "#e9d5ff" : "#be185d") : T.textMuted }}>
                          {name === "all" ? "전체" : name}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {filtered.map(g => (
                        <div key={g.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{g.guru}</span>
                              <span style={{ fontSize: 10, color: T.textMuted }}>{g.date}</span>
                            </div>
                            {isAdmin && (
                              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                <button onClick={() => { setGuruForm({ date: g.date, guru: g.guru, target: g.target, position: g.position, source: g.source || "", sourceUrl: g.sourceUrl || "", summary: g.summary || "", verdict: g.verdict || "pending", memo: g.memo || "" }); setGuruModal(g); }}
                                  style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, fontSize: 10, padding: "2px 6px", cursor: "pointer" }}>✏️</button>
                                <button onClick={() => deleteGuruOpinion(g.id)}
                                  style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, fontSize: 10, padding: "2px 6px", cursor: "pointer" }}>🗑️</button>
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.text, background: T.section, borderRadius: 6, padding: "2px 8px" }}>🎯 {g.target}</span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: posColor[g.position] || T.textMuted, background: T.section, borderRadius: 6, padding: "2px 8px" }}>
                              {posLabel[g.position] || g.position}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: verdictColor[g.verdict] || T.textMuted, background: T.section, borderRadius: 6, padding: "2px 8px" }}>
                              {verdictLabel[g.verdict] || g.verdict}
                            </span>
                          </div>
                          {g.summary && <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5, marginBottom: 6 }}>{g.summary}</div>}
                          {g.source && (
                            g.sourceUrl
                              ? <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#3b82f6", textDecoration: "underline" }}>🔗 {g.source}</a>
                              : <div style={{ fontSize: 11, color: T.textMuted }}>📎 {g.source}</div>
                          )}
                          {g.memo && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6, borderTop: `1px solid ${T.cardBorder}`, paddingTop: 6 }}>💬 {g.memo}</div>}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* 입장 화면 */}
      {/* 🏠 홈 - 시장 현황 */}
      {activeTab === "home" && (
        <div style={{ marginBottom: 16 }}>
          {/* 투자성과 대시보드 */}
          {(() => {
            const perfDates = Object.keys(performance).sort();
            const hasPerfData = perfDates.length >= 1;
            const firstDate = perfDates[0];
            const lastDate = perfDates[perfDates.length - 1];
            const lastPerf = lastDate ? performance[lastDate] : null;

            // 기간 필터링
            const filteredDates = (() => {
              if (perfRange === 'all' || perfRange === 'mine') return perfDates;
              const days = perfRange === '1m' ? 30 : perfRange === '3m' ? 90 : 180;
              const cutoff = new Date();
              cutoff.setDate(cutoff.getDate() - days);
              return perfDates.filter(d => new Date(d) >= cutoff);
            })();

            return (
              <div style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:"12px 10px", marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:T.text }}>📊 투자성과</div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {perfDates.length > 0 && (
                      <div style={{ fontSize:10, color:T.textMuted }}>{firstDate}{lastDate !== firstDate ? ` ~ ${lastDate}` : ''} ({perfDates.length}일)</div>
                    )}
                    {perfDates.length > 0 && (
                      <button onClick={() => setPerfDetailModal(true)}
                        style={{ fontSize:10, padding:"3px 8px", borderRadius:6, border:`1px solid ${T.border}`, background:T.section, color:T.textMuted, cursor:"pointer" }}>
                        📋 기록보기
                      </button>
                    )}
                  </div>
                </div>

                {perfDates.length === 0 && (
                  <div style={{ textAlign:"center", padding:"16px 0", color:T.textMuted, fontSize:12 }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>📈</div>
                    <div>아직 기록된 성과가 없어요</div>
                    <div style={{ fontSize:11, marginTop:4 }}>포트폴리오 탭에서 📊 성과 기록을 눌러주세요</div>
                  </div>
                )}

                {hasPerfData && (() => {
                  const lastPerf = performance[perfDates[perfDates.length - 1]];
                  if (!lastPerf) return null;

                  // 기간 버튼 (코스피/코스닥 기준)
                  const rangeButtons = [{k:'1m',l:'1개월'},{k:'3m',l:'3개월'},{k:'6m',l:'6개월'},{k:'all',l:'전체'},{k:'mine',l:'내 기록'}];

                  // 인덱스 차트 데이터 (코스피/코스닥 연속)
                  // '내 기록'은 별도 API 없이 '전체' 인덱스 데이터를 첫 성과기록일(firstDate) 기준으로 잘라서 사용
                  // → 내가 실제로 기록한 기간과 정확히 같은 구간으로 코스피/코스닥을 비교할 수 있음
                  const idxData = indexChartData[perfRange === 'mine' ? 'all' : perfRange];
                  const rawKospiLine = idxData?.kospi || [];
                  const rawKosdaqLine = idxData?.kosdaq || [];
                  // firstDate가 비영업일(주말/공휴일)일 수 있으므로, 그대로 자르면 그 이전 영업일 데이터가
                  // 통째로 사라져서 첫 타점이 매칭될 곳이 없어짐(→ 다음 영업일로 밀려 다시 겹쳐 보임).
                  // firstDate '이하'의 마지막 영업일(anchor)까지는 남기고 그 지점부터 자른다.
                  const findAnchorDate = (arr, targetDate) => {
                    if (!arr || arr.length === 0 || !targetDate) return null;
                    let anchor = null;
                    for (let k = 0; k < arr.length; k++) {
                      if (arr[k].date <= targetDate) anchor = arr[k].date;
                      else break;
                    }
                    return anchor || arr[0].date;
                  };
                  const mineAnchor = perfRange === 'mine' ? findAnchorDate(rawKospiLine, firstDate) : null;
                  const kospiLine = (perfRange === 'mine' && mineAnchor) ? rawKospiLine.filter(d => d.date >= mineAnchor) : rawKospiLine;
                  const kosdaqLine = (perfRange === 'mine' && mineAnchor) ? rawKosdaqLine.filter(d => d.date >= mineAnchor) : rawKosdaqLine;

                  // 내 포트 타점 (기간 필터)
                  const myPoints = filteredDates.map(d => ({
                    date: d,
                    val: performance[d]?.cumulativeIndex || 100,
                  }));

                  // 코스피/코스닥 수익률 (기간 기준)
                  const kospiRangePct = kospiLine.length >= 2
                    ? ((kospiLine[kospiLine.length-1].close - kospiLine[0].close) / kospiLine[0].close * 100).toFixed(2)
                    : lastPerf.kospiIndex ? (lastPerf.kospiIndex - 100).toFixed(2) : null;
                  const kosdaqRangePct = kosdaqLine.length >= 2
                    ? ((kosdaqLine[kosdaqLine.length-1].close - kosdaqLine[0].close) / kosdaqLine[0].close * 100).toFixed(2)
                    : lastPerf.kosdaqIndex ? (lastPerf.kosdaqIndex - 100).toFixed(2) : null;
                  // mine 모드: 첫 타점 기준 수익률
                  const myRangePct = myPoints.length >= 1
                    ? ((myPoints[myPoints.length-1].val / (perfRange === 'mine' ? myPoints[0].val : 100) - 1) * 100).toFixed(2)
                    : null;
                  const vsKospi = (myRangePct && kospiRangePct) ? (parseFloat(myRangePct) - parseFloat(kospiRangePct)).toFixed(2) : null;
                  const vsKosdaq = (myRangePct && kosdaqRangePct) ? (parseFloat(myRangePct) - parseFloat(kosdaqRangePct)).toFixed(2) : null;

                  // 차트 그리기
                  const W = 340, H = 120, PAD = { l:42, r:8, t:8, b:22 };

                  // 코스피/코스닥을 100 기준 정규화
                  const normalizeArr = (arr) => {
                    if (!arr || arr.length === 0) return [];
                    const base = arr[0].close;
                    return arr.map((d, i) => ({ i, val: d.close / base * 100, date: d.date }));
                  };
                  const kospiNorm = normalizeArr(kospiLine);
                  const kosdaqNorm = normalizeArr(kosdaqLine);

                  // 내 포트 타점도 같은 시작점으로 정규화
                  const myNorm = myPoints.map(p => ({ date: p.date, val: p.val }));

                  // 전체 데이터로 Y축 범위 계산
                  const allVals = [
                    ...kospiNorm.map(d => d.val),
                    ...kosdaqNorm.map(d => d.val),
                    ...myNorm.map(d => d.val),
                    100,
                  ];
                  const minV = Math.min(...allVals) * 0.998;
                  const maxV = Math.max(...allVals) * 1.002;
                  const vRange = maxV - minV || 1;

                  // ✅ v1.5.15 버그 수정: X축을 "배열 인덱스" 기반 → "실제 날짜(시간)" 기반으로 교체.
                  // 기존에는 코스피 데이터 배열의 인덱스를 균등 분할해 X좌표를 정했는데, 조회 range(1개월/전체 등)마다
                  // Yahoo가 실제로 내려주는 거래일 데이터의 개수/간격이 미세하게 달라질 수 있어서, 서로 다른 날짜의
                  // 내 기록이 같은 인덱스로 매칭되어 같은 X좌표에 겹쳐 찍히는 문제가 있었음
                  // (예: 1개월 차트에서 7/30, 7/31 두 타점이 같은 자리에 겹침 — '내 기록' 보기에선 정상이었던 건
                  //  그 모드가 별도 range로 더 넓은 데이터를 받아와 우연히 인덱스가 안 겹쳤을 뿐, 근본 원인은 동일했음).
                  // → 각 점의 X좌표를 그 점의 "날짜" 자체로 직접 계산하면, 날짜가 다르면 X좌표도 반드시 달라지므로
                  //   이 문제 자체가 원천적으로 발생할 수 없음.
                  const toTime = (d) => new Date(d).getTime();
                  const timeCandidates = [
                    ...kospiNorm.map(d => toTime(d.date)),
                    ...kosdaqNorm.map(d => toTime(d.date)),
                    ...myNorm.map(d => toTime(d.date)),
                  ];
                  const minTime = timeCandidates.length ? Math.min(...timeCandidates) : Date.now();
                  const maxTime = timeCandidates.length ? Math.max(...timeCandidates) : Date.now();
                  const timeRange = (maxTime - minTime) || 1;
                  const pxByDate = (dateStr) => PAD.l + (W - PAD.l - PAD.r) * (toTime(dateStr) - minTime) / timeRange;
                  const pyVal = (v) => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - minV) / vRange);

                  // 코스피/코스닥 path (날짜 기준 X좌표)
                  const linePath = (arr) => arr.length < 2
                    ? null
                    : arr.map((d, i) => `${i===0?'M':'L'}${pxByDate(d.date)},${pyVal(d.val)}`).join(' ');

                  // 내 포트 타점: X좌표는 날짜로 직접 계산(항상 정확). idx는 그날 코스피/코스닥 수치를
                  // 툴팁에 보여주기 위한 참고용일 뿐, X좌표 계산에는 더 이상 관여하지 않음.
                  const findNearestKospiIdx = (targetDate) => {
                    if (kospiNorm.length === 0) return undefined;
                    let idx;
                    const tTime = toTime(targetDate);
                    for (let k = 0; k < kospiNorm.length; k++) {
                      // 비영업일(주말/공휴일) 기록: "직전" 영업일 종가에 매칭
                      if (toTime(kospiNorm[k].date) <= tTime) idx = kospiNorm[k].i;
                      else break; // kospiNorm은 날짜 오름차순 정렬 가정
                    }
                    return idx !== undefined ? idx : kospiNorm[0].i; // 그 이전 영업일 데이터가 아예 없으면 첫 영업일로
                  };
                  const myDots = myNorm.map(p => ({
                    x: pxByDate(p.date),
                    y: pyVal(p.val),
                    val: p.val,
                    date: p.date,
                    idx: findNearestKospiIdx(p.date),
                  }));

                  // Y축 - 10칸
                  const ySteps = 10;
                  const yLabels = Array.from({length: ySteps + 1}, (_, i) => {
                    const v = minV + (maxV - minV) * i / ySteps;
                    return { y: pyVal(v), label: (v-100).toFixed(1)+'%' };
                  });

                  // X축 - 월별로 표시 (연도 포함, 날짜 기준 X좌표)
                  const xLabels = [];
                  let prevYearMonth = '';
                  kospiNorm.forEach((d) => {
                    if (!d.date) return;
                    const [yyyy, mm] = d.date.split('-');
                    const ym = `${yyyy}-${mm}`;
                    if (ym !== prevYearMonth) {
                      // 매월 1일 근처에 레이블
                      const label = mm === '01' ? `${yyyy.slice(2)}.${mm}` : `'${mm}`;
                      xLabels.push({ x: pxByDate(d.date), label });
                      prevYearMonth = ym;
                    }
                  });
                  // 너무 촘촘하면 2개월마다
                  const xStep = xLabels.length > 18 ? 3 : xLabels.length > 10 ? 2 : 1;
                  const xLabelsFiltered = xLabels.filter((_, i) => i % xStep === 0);

                  return (
                    <div>
                      {/* 기간 수익률 요약 카드 - 항상 표시 */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
                        <div style={{ background:T.section, borderRadius:8, padding:"7px 8px", textAlign:"center" }}>
                          <div style={{ fontSize:9, color:"#3b82f6", fontWeight:700, marginBottom:2 }}>● 내 포트 ({perfRange==='1m'?'1개월':perfRange==='3m'?'3개월':perfRange==='6m'?'6개월':perfRange==='mine'?'내 기록':'전체'})</div>
                          <div style={{ fontSize:14, fontWeight:900, color: myRangePct >= 0 ? "#ef4444" : "#3b82f6" }}>
                            {myRangePct !== null ? `${myRangePct >= 0 ? '+' : ''}${myRangePct}%` : <span style={{fontSize:11,color:T.textMuted}}>타점 없음</span>}
                          </div>
                        </div>
                        <div style={{ background:T.section, borderRadius:8, padding:"7px 8px", textAlign:"center" }}>
                          <div style={{ fontSize:9, color:"#f59e0b", fontWeight:700, marginBottom:2 }}>— 코스피</div>
                          <div style={{ fontSize:14, fontWeight:900, color: kospiRangePct >= 0 ? "#ef4444" : "#3b82f6" }}>
                            {kospiRangePct !== null ? `${kospiRangePct >= 0 ? '+' : ''}${kospiRangePct}%` : indexChartLoading ? '로딩중...' : '-'}
                          </div>
                
                        </div>
                        <div style={{ background:T.section, borderRadius:8, padding:"7px 8px", textAlign:"center" }}>
                          <div style={{ fontSize:9, color:"#22c55e", fontWeight:700, marginBottom:2 }}>— 코스닥</div>
                          <div style={{ fontSize:14, fontWeight:900, color: kosdaqRangePct >= 0 ? "#ef4444" : "#3b82f6" }}>
                            {kosdaqRangePct !== null ? `${kosdaqRangePct >= 0 ? '+' : ''}${kosdaqRangePct}%` : indexChartLoading ? '로딩중...' : '-'}
                          </div>
                
                        </div>
                      </div>

                      {/* 기간 버튼 */}
                      <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                        {rangeButtons.map(r => (
                          <button key={r.k} onClick={() => { setPerfRange(r.k); loadIndexChart(r.k); setPerfTooltip(null); }}
                            style={{ flex:1, padding:"4px 0", fontSize:10, fontWeight:600, borderRadius:6, cursor:"pointer", border:"1px solid",
                              background: perfRange===r.k ? (darkMode?"#1e3a5f":"#dbeafe") : T.section,
                              borderColor: perfRange===r.k ? "#3b82f6" : T.border,
                              color: perfRange===r.k ? "#3b82f6" : T.textMuted }}>
                            {r.l}
                          </button>
                        ))}
                      </div>

                      {/* 차트 */}
                      {indexChartLoading ? (
                        <div style={{ textAlign:"center", padding:"20px", color:T.textMuted, fontSize:11 }}>📈 차트 불러오는 중...</div>
                      ) : (
                        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", cursor:"crosshair" }}
                          onClick={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const mx = (e.clientX - rect.left) / rect.width * W;
                            // 클릭 X좌표 → 실제 시각으로 역산 후, 가장 가까운 코스피 데이터 포인트 탐색 (날짜 기준 X축)
                            if (kospiNorm.length === 0) { setPerfTooltip(null); return; }
                            const clickTime = minTime + (mx - PAD.l) / (W - PAD.l - PAD.r) * timeRange;
                            let clampedIdx = 0, bestDiff = Infinity;
                            kospiNorm.forEach((d, i) => {
                              const diff = Math.abs(toTime(d.date) - clickTime);
                              if (diff < bestDiff) { bestDiff = diff; clampedIdx = i; }
                            });
                            const kd = kospiNorm[clampedIdx];
                            const qd = kosdaqNorm[clampedIdx];
                            if (!kd) { setPerfTooltip(null); return; }
                            setPerfTooltip({
                              date: kd.date,
                              kospiVal: kd.val,
                              kosdaqVal: qd?.val || null,
                              kospiClose: kospiLine[clampedIdx]?.close,
                              kosdaqClose: kosdaqLine[clampedIdx]?.close,
                            });
                          }}>
                          {yLabels.map((yl, i) => (
                            <g key={i}>
                              <line x1={PAD.l} y1={yl.y} x2={W-PAD.r} y2={yl.y} stroke={T.cardBorder} strokeWidth={i%2===0?"0.6":"0.3"} strokeDasharray="3,3" />
                              {i%2===0 && <text x={PAD.l-3} y={yl.y+3} textAnchor="end" fontSize="7" fill={T.textMuted}>{yl.label}</text>}
                            </g>
                          ))}
                          <line x1={PAD.l} y1={pyVal(100)} x2={W-PAD.r} y2={pyVal(100)} stroke={T.textMuted} strokeWidth="0.5" strokeDasharray="2,2" />
                          {/* 코스닥 연속 라인 */}
                          {linePath(kosdaqNorm) && <path d={linePath(kosdaqNorm)} fill="none" stroke="#22c55e" strokeWidth="1.2" opacity="0.7" />}
                          {/* 코스피 연속 라인 */}
                          {linePath(kospiNorm) && <path d={linePath(kospiNorm)} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" />}
                          {/* 내 포트 연결선 (타점 2개 이상일 때만) */}
                          {myDots.length >= 2 && (
                            <path d={myDots.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.x},${d.y}`).join(' ')}
                              fill="none" stroke="#3b82f6" strokeWidth="1.8" opacity="0.9" />
                          )}
                          {/* 내 포트 타점 */}
                          {myDots.map((dot, i) => {
                            const isSelected = perfTooltip?.date === dot.date;
                            const perfDay = performance[dot.date];
                            return (
                              <g key={i} style={{ cursor:"pointer" }}
                                onClick={e => {
                                  e.stopPropagation();
                                  if (isSelected) { setPerfTooltip(null); return; }
                                  // 타점 클릭: 내 포트 + 그날 코스피/코스닥
                                  // (myDots 계산 시 이미 확정된 idx를 그대로 사용 — 점 위치와 툴팁 수치가 항상 일치하도록)
                                  const dotIdx = dot.idx ?? 0;
                                  setPerfTooltip({
                                    date: dot.date,
                                    myVal: dot.val,
                                    kospiVal: kospiNorm[dotIdx]?.val,
                                    kosdaqVal: kosdaqNorm[dotIdx]?.val,
                                    kospiClose: kospiLine[dotIdx]?.close,
                                    kosdaqClose: kosdaqLine[dotIdx]?.close,
                                  });
                                }}>
                                {/* 클릭 영역 확대 */}
                                <circle cx={dot.x} cy={dot.y} r="12" fill="transparent" />
                                {/* 선택 시 외곽 링 */}
                                {isSelected && <circle cx={dot.x} cy={dot.y} r="8" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />}
                                <circle cx={dot.x} cy={dot.y} r="5" fill={isSelected ? "#1d4ed8" : "#3b82f6"} stroke="white" strokeWidth="1.5" />
                                {/* 마지막 타점엔 항상 수익률 표시 */}
                                {i === myDots.length - 1 && !isSelected && (
                                  <text x={dot.x} y={dot.y - 9} textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="700">
                                    {dot.val >= 100 ? '+' : ''}{(dot.val - 100).toFixed(1)}%
                                  </text>
                                )}
                              </g>
                            );
                          })}
                          {xLabelsFiltered.map((xl, i) => (
                            <text key={i} x={xl.x} y={H} textAnchor="middle" fontSize="7" fill={T.textMuted}>{xl.label}</text>
                          ))}
                        </svg>
                      )}

                      {/* 툴팁 */}
                      {perfTooltip && (
                        <div style={{ margin:"6px 0 4px", padding:"10px 14px", background:T.section, border:`1px solid ${T.border}`, borderRadius:10, fontSize:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                            <div style={{ fontWeight:700, color:T.text, fontSize:13 }}>{perfTooltip.date}</div>
                            <button onClick={() => setPerfTooltip(null)} style={{ background:"none", border:"none", color:T.textMuted, fontSize:14, cursor:"pointer", lineHeight:1 }}>✕</button>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                            {/* 내 포트 - 타점 클릭 시만 표시 */}
                            <div style={{ textAlign:"center", background:T.card, borderRadius:6, padding:"6px 4px", opacity: perfTooltip.myVal !== undefined ? 1 : 0.4 }}>
                              <div style={{ fontSize:9, color:"#3b82f6", fontWeight:700 }}>● 내 포트</div>
                              {perfTooltip.myVal !== undefined
                                ? <div style={{ fontSize:13, fontWeight:800, color: perfTooltip.myVal >= 100 ? "#ef4444" : "#3b82f6" }}>
                                    {perfTooltip.myVal >= 100 ? '+' : ''}{(perfTooltip.myVal - 100).toFixed(2)}%
                                  </div>
                                : <div style={{ fontSize:11, color:T.textMuted }}>타점 없음</div>
                              }
                            </div>
                            {/* 코스피 */}
                            <div style={{ textAlign:"center", background:T.card, borderRadius:6, padding:"6px 4px" }}>
                              <div style={{ fontSize:9, color:"#f59e0b", fontWeight:700 }}>— 코스피</div>
                              {perfTooltip.kospiVal !== undefined
                                ? <>
                                    {perfTooltip.kospiClose && <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{Math.round(perfTooltip.kospiClose).toLocaleString()}pt</div>}
                                    <div style={{ fontSize:11, color: perfTooltip.kospiVal >= 100 ? "#ef4444" : "#3b82f6" }}>
                                      {perfTooltip.kospiVal >= 100 ? '+' : ''}{(perfTooltip.kospiVal - 100).toFixed(2)}%
                                    </div>
                                  </>
                                : <div style={{ fontSize:11, color:T.textMuted }}>-</div>}
                            </div>
                            {/* 코스닥 */}
                            <div style={{ textAlign:"center", background:T.card, borderRadius:6, padding:"6px 4px" }}>
                              <div style={{ fontSize:9, color:"#22c55e", fontWeight:700 }}>— 코스닥</div>
                              {perfTooltip.kosdaqVal !== undefined
                                ? <>
                                    {perfTooltip.kosdaqClose && <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{Math.round(perfTooltip.kosdaqClose).toLocaleString()}pt</div>}
                                    <div style={{ fontSize:11, color: perfTooltip.kosdaqVal >= 100 ? "#ef4444" : "#3b82f6" }}>
                                      {perfTooltip.kosdaqVal >= 100 ? '+' : ''}{(perfTooltip.kosdaqVal - 100).toFixed(2)}%
                                    </div>
                                  </>
                                : <div style={{ fontSize:11, color:T.textMuted }}>-</div>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 범례 */}
                      <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:4 }}>
                        {[{color:"#3b82f6",label:"내 포트",dot:true},{color:"#f59e0b",label:"코스피"},{color:"#22c55e",label:"코스닥"}].map((l,i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, color:T.textMuted }}>
                            {l.dot
                              ? <div style={{ width:8, height:8, borderRadius:"50%", background:l.color, border:"1.5px solid white", outline:`1px solid ${l.color}` }} />
                              : <div style={{ width:16, height:2, background:l.color, borderRadius:1 }} />
                            }
                            {l.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {marketLoading && !marketData && (
            <div style={{ textAlign:"center", padding:"20px", color:T.textMuted, fontSize:12 }}>📊 시장 데이터 불러오는 중...</div>
          )}
          {marketData && (() => {
            const { indices, kospiTop, kosdaqTop, kospiChart, kosdaqChart, kospiMap, kosdaqMap, kospiMapTotal, kosdaqMapTotal, kospiTotalMarketCap, kosdaqTotalMarketCap } = marketData;

            // 영역 차트 그리기 함수
            const renderAreaChart = (data, label, indexInfo) => {
              if (!data || data.length === 0) return (
                <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", color:T.textMuted, fontSize:11 }}>데이터 없음</div>
              );
              const prevClose = data[0]?.prevClose || data[0]?.close;
              const closes = data.map(d => d.close);
              const times = data.map(d => d.time);
              const minV = Math.min(...closes, prevClose) * 0.999;
              const maxV = Math.max(...closes, prevClose) * 1.001;
              const range = maxV - minV || 1;
              const W = 300, H = 70, PAD = { l:0, r:0, t:4, b:16 };
              const n = closes.length;
              const px = i => PAD.l + (W - PAD.l - PAD.r) * i / (n - 1);
              const py = v => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - minV) / range);
              const prevY = py(prevClose);
              const isUp = indexInfo ? indexInfo.change >= 0 : closes[closes.length-1] >= prevClose;
              const lineColor = isUp ? "#ef4444" : "#3b82f6";
              const fillColor = isUp ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)";

              // path 생성
              const points = closes.map((c, i) => `${px(i)},${py(c)}`).join(' ');
              const areaPath = `M${px(0)},${py(closes[0])} ` +
                closes.map((c, i) => `L${px(i)},${py(c)}`).join(' ') +
                ` L${px(n-1)},${H-PAD.b} L${px(0)},${H-PAD.b} Z`;

              // X축 레이블 (3개)
              const xLabels = [0, Math.floor(n/2), n-1].map(i => ({ x: px(i), label: times[i] || '' }));

              return (
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
                  {/* 기준선 (전일 종가) */}
                  <line x1={0} y1={prevY} x2={W} y2={prevY} stroke={darkMode?"#334155":"#d6cfc4"} strokeWidth="0.8" strokeDasharray="3,2" />
                  {/* 영역 */}
                  <path d={areaPath} fill={fillColor} />
                  {/* 선 */}
                  <polyline points={points} fill="none" stroke={lineColor} strokeWidth="1.5" />
                  {/* X축 시간 */}
                  {xLabels.map((xl, i) => (
                    <text key={i} x={xl.x} y={H} textAnchor={i===0?"start":i===2?"end":"middle"} fontSize="8" fill={T.textMuted}>{xl.label}</text>
                  ))}
                </svg>
              );
            };

            // 종목 등락 리스트
            // 시가총액 포맷 (억/조 단위)
            const formatMktCap = (v) => {
              if (!v || v <= 0) return null;
              if (v >= 10000) return (v/10000).toFixed(0) + '조';
              return v.toLocaleString() + '억';
            };

            const renderStockList = (stocks) => {
              if (!stocks || stocks.length === 0) return <div style={{ color:T.textMuted, fontSize:11, textAlign:"center", padding:"8px" }}>데이터 없음</div>;
              return stocks.map((s, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", padding:"5px 0", borderBottom: i < stocks.length-1 ? `1px solid ${T.cardBorder}` : "none", gap:4 }}>
                  <span style={{ fontSize:10, color:T.textMuted, minWidth:16, flexShrink:0 }}>{s.rank}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:T.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.text }}>{s.price?.toLocaleString()}원</div>
                    {formatMktCap(s.marketCap) && <div style={{ fontSize:9, color:T.textMuted }}>{formatMktCap(s.marketCap)}</div>}
                    <div style={{ fontSize:10, fontWeight:700, color: s.isUp ? "#ef4444" : "#3b82f6" }}>{s.pct}</div>
                  </div>
                </div>
              ));
            };

            // 맵차트용 데이터 준비 (코스피/코스닥 토글에 따라)
            const activeMapList = treemapMarket === 'kospi' ? kospiMap : kosdaqMap;
            const activeMapTotal = treemapMarket === 'kospi' ? kospiMapTotal : kosdaqMapTotal;
            // ✅ v1.5.12: 시장 "전체" 시가총액 (파싱 성공 시). 실패하면 null → 기존 "상위 N개 합"으로 자동 폴백
            const activeOfficialTotal = treemapMarket === 'kospi' ? kospiTotalMarketCap : kosdaqTotalMarketCap;
            const { items: treemapItems, total: treemapTotal } = buildTreemapItems(activeMapList);

            // ✅ v1.5.17: 상위 2개 종목 시총 집중도 코멘트 (예: "삼성전자+SK하이닉스가 코스피의 X%")
            // 전체 시총 파싱에 성공했으면 그 값 기준, 실패했으면 상위 50개 합 기준으로 계산하고 그 사실을 표시함
            const top2 = [...(activeMapList || [])].filter(s => s.marketCap > 0).sort((a,b) => b.marketCap - a.marketCap).slice(0, 2);
            const top2Sum = top2.reduce((s, it) => s + it.marketCap, 0);
            const concentrationDenom = activeOfficialTotal || treemapTotal;
            const top2Pct = (top2.length === 2 && concentrationDenom > 0) ? (top2Sum / concentrationDenom * 100).toFixed(1) : null;
            const concentrationNote = top2Pct
              ? `💡 ${top2[0].name}+${top2[1].name}이(가) ${treemapMarket === 'kospi' ? '코스피' : '코스닥'} 시가총액의 ${top2Pct}%를 차지해요${activeOfficialTotal ? '' : ' (상위 50개 기준)'}`
              : null;

            return (
              <>
              <div style={{ display:"flex", gap:8 }}>
                {/* 코스피 */}
                <div style={{ flex:1, background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:"12px 10px", minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:T.textMuted }}>코스피</div>
                      {indices?.kospi && (
                        <>
                          <div style={{ fontSize:16, fontWeight:900, color: indices.kospi.change>=0?"#ef4444":"#3b82f6" }}>{indices.kospi.price?.toLocaleString()}</div>
                          <div style={{ fontSize:10, color: indices.kospi.change>=0?"#ef4444":"#3b82f6" }}>
                            {indices.kospi.change>=0?"+":""}{indices.kospi.change} ({indices.kospi.change>=0?"+":""}{indices.kospi.pct}%)
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {renderAreaChart(kospiChart, "코스피", indices?.kospi)}
                  <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, margin:"8px 0 4px" }}>시총 TOP10</div>
                  {renderStockList(kospiTop)}
                </div>

                {/* 코스닥 */}
                <div style={{ flex:1, background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:"12px 10px", minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:T.textMuted }}>코스닥</div>
                      {indices?.kosdaq && (
                        <>
                          <div style={{ fontSize:16, fontWeight:900, color: indices.kosdaq.change>=0?"#ef4444":"#3b82f6" }}>{indices.kosdaq.price?.toLocaleString()}</div>
                          <div style={{ fontSize:10, color: indices.kosdaq.change>=0?"#ef4444":"#3b82f6" }}>
                            {indices.kosdaq.change>=0?"+":""}{indices.kosdaq.change} ({indices.kosdaq.change>=0?"+":""}{indices.kosdaq.pct}%)
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {renderAreaChart(kosdaqChart, "코스닥", indices?.kosdaq)}
                  <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, margin:"8px 0 4px" }}>시총 TOP10</div>
                  {renderStockList(kosdaqTop)}
                </div>
              </div>

              {/* 🗺️ 맵차트 (트리맵) - top10 시총 아래 최하단 배치 */}
              <div style={{ marginTop:8, background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:"12px 10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:6 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:T.text }}>🗺️ 맵차트</div>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    <button
                      onClick={() => { const next = !showSectorView; setShowSectorView(next); if (next) loadSectorMap(); }}
                      style={{
                        fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8, border:"none", cursor:"pointer",
                        background: showSectorView ? (darkMode?"#164e3a":"#dcfce7") : "transparent",
                        color: showSectorView ? (darkMode?"#86efac":"#15803d") : T.textMuted,
                      }}>🏷️ 업종별{sectorMapLoading ? ' ⏳' : ''}</button>
                    {[{ k:'kospi', label:'코스피' }, { k:'kosdaq', label:'코스닥' }].map(o => (
                      <button key={o.k} onClick={() => setTreemapMarket(o.k)}
                        style={{
                          fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8, border:"none", cursor:"pointer",
                          background: treemapMarket===o.k ? (darkMode?"#3730a3":"#e0e7ff") : "transparent",
                          color: treemapMarket===o.k ? (darkMode?"#c7d2fe":"#3730a3") : T.textMuted,
                        }}>{o.label}</button>
                    ))}
                  </div>
                </div>

                {(!treemapItems || treemapItems.length === 0) ? (
                  <div style={{ textAlign:"center", padding:"24px", color:T.textMuted, fontSize:12 }}>맵차트 데이터 없음</div>
                ) : (() => {
                  const useSectorView = showSectorView && sectorMap;
                  const W = 320, H = useSectorView ? 400 : 300;

                  // 개별 종목 타일 렌더 (풀네임 → 축약이름 → 초축약이름 → 숨김, 박스가 작을수록 글씨도 축소) - 평면/업종별 모드 공용
                  const renderStockTile = (t, key) => {
                    const clampedAbs = Math.abs(Math.max(-30, Math.min(30, t.pctNum || 0))) / 30;
                    const color = pctToColor(t.pctNum);
                    const textColor = clampedAbs > 0.4 ? "#ffffff" : "#1a1a1a";
                    const showFull = t.w > 50 && t.h > 32;
                    const showMed = !showFull && t.w > 30 && t.h > 19;
                    const showSmall = !showFull && !showMed && t.w > 15 && t.h > 12;
                    const pctDecimals = showFull ? 2 : showMed ? 1 : 0;
                    const pctLabel = (t.pctNum >= 0 ? '+' : '') + t.pctNum.toFixed(pctDecimals) + '%';
                    const fullName = t.isEtc ? t.name : (t.name.length > 7 ? t.name.slice(0,6)+'…' : t.name);
                    const medName = t.isEtc ? t.name : (t.name.length > 4 ? t.name.slice(0,4)+'…' : t.name);
                    const smallName = t.isEtc ? '기타' : t.name.slice(0, 2);
                    return (
                      <g key={key}>
                        <rect x={t.x} y={t.y} width={Math.max(t.w-0.6,0)} height={Math.max(t.h-0.6,0)} fill={color} />
                        {showFull && (
                          <>
                            <text x={t.x + t.w/2} y={t.y + t.h/2 - 3} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={textColor}>
                              {fullName}
                            </text>
                            <text x={t.x + t.w/2} y={t.y + t.h/2 + 9} textAnchor="middle" fontSize="8.5" fill={textColor}>
                              {t.isEtc ? '' : pctLabel}
                            </text>
                          </>
                        )}
                        {showMed && (
                          <>
                            <text x={t.x + t.w/2} y={t.y + t.h/2 - 2} textAnchor="middle" fontSize="7.2" fontWeight="700" fill={textColor}>
                              {medName}
                            </text>
                            <text x={t.x + t.w/2} y={t.y + t.h/2 + 7} textAnchor="middle" fontSize="6.5" fill={textColor}>
                              {t.isEtc ? '' : pctLabel}
                            </text>
                          </>
                        )}
                        {showSmall && (
                          <text x={t.x + t.w/2} y={t.y + t.h/2 + 2} textAnchor="middle" fontSize="6" fontWeight="700" fill={textColor}>
                            {smallName}
                          </text>
                        )}
                      </g>
                    );
                  };

                  // ── 업종별 2단계 맵차트 ──
                  if (useSectorView) {
                    const sectorGroups = buildSectorGroups(activeMapList, sectorMap);
                    const grandTotal = sectorGroups.reduce((s, g) => s + g.marketCap, 0);
                    const sectorAreaItems = sectorGroups.map(g => ({ ...g, area: grandTotal > 0 ? (W*H) * (g.marketCap/grandTotal) : 0 }));
                    const sectorTiles = squarify(sectorAreaItems, 0, 0, W, H);
                    const HEADER_H = 13;

                    return (
                      <>
                        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", borderRadius:8, overflow:"hidden" }}>
                          {sectorTiles.map((st, si) => {
                            const showHeader = st.w > 26 && st.h > HEADER_H + 10;
                            const innerY = showHeader ? st.y + HEADER_H : st.y;
                            const innerH = showHeader ? Math.max(st.h - HEADER_H, 0) : st.h;
                            // 업종 내부는 자체 총액 기준 3% 미만 종목을 "기타"로 재묶음 (세부 업종일수록 종목 수가 적어 임계치를 상대적으로 높게)
                            const { items: subItems, total: subTotal } = buildTreemapItems(st.stocks, 3);
                            const subAreaItems = subItems.map(it => ({ ...it, area: subTotal > 0 ? (st.w*innerH) * (it.marketCap/subTotal) : 0 }));
                            const subTiles = (innerH > 4 && st.w > 4) ? squarify(subAreaItems, st.x, innerY, st.w, innerH) : [];
                            const sectorLabel = st.sector.length > 9 ? st.sector.slice(0,8)+'…' : st.sector;
                            return (
                              <g key={si}>
                                {subTiles.map((t, ti) => renderStockTile(t, `${si}-${ti}`))}
                                <rect x={st.x} y={st.y} width={Math.max(st.w-1,0)} height={Math.max(st.h-1,0)} fill="none" stroke={darkMode?"#0a0f1e":"#ffffff"} strokeWidth="1.5" />
                                {showHeader && (
                                  <text x={st.x+4} y={st.y+9.5} fontSize="7.5" fontWeight="800" fill={darkMode?"#e2e8f0":"#1a1a1a"} style={{ textShadow: darkMode ? "0 0 3px #000" : "0 0 3px #fff" }}>
                                    {sectorLabel}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:10, color:T.textMuted }}>
                          <span>업종 {sectorGroups.length}개 (⚠️ 네이버 업종 분류 기준, 미분류 종목 포함될 수 있음)</span>
                          <span>
                            {activeOfficialTotal
                              ? `${treemapMarket === 'kospi' ? '코스피' : '코스닥'} 전체 시총 ${formatMktCap(activeOfficialTotal)}`
                              : `합계 ${formatMktCap(activeMapTotal || treemapTotal) || '-'} (상위 ${activeMapList?.length || 0}개 합)`}
                          </span>
                        </div>
                        {concentrationNote && (
                          <div style={{ marginTop:4, fontSize:10, color:T.textMuted }}>{concentrationNote}</div>
                        )}
                      </>
                    );
                  }

                  // ── 평면(업종 구분 없는) 맵차트 ──
                  const areaItems = treemapItems.map(it => ({ ...it, area: treemapTotal > 0 ? (W*H) * (it.marketCap/treemapTotal) : 0 }));
                  const tiles = squarify(areaItems, 0, 0, W, H);
                  const bigCount = treemapItems.filter(it => !it.isEtc).length;
                  const hasEtc = treemapItems.some(it => it.isEtc);
                  return (
                    <>
                      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", borderRadius:8, overflow:"hidden" }}>
                        {tiles.map((t, i) => renderStockTile(t, i))}
                      </svg>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:10, color:T.textMuted }}>
                        <span>시총 상위 {bigCount}개{hasEtc ? ' + 기타' : ''} (박스 면적 = 시총 비중, 색 = 등락률)</span>
                        <span>
                          {activeOfficialTotal
                            ? `${treemapMarket === 'kospi' ? '코스피' : '코스닥'} 전체 시총 ${formatMktCap(activeOfficialTotal)}`
                            : `합계 ${formatMktCap(activeMapTotal || treemapTotal) || '-'} (상위 ${activeMapList?.length || 0}개 합)`}
                        </span>
                      </div>
                      {concentrationNote && (
                        <div style={{ marginTop:4, fontSize:10, color:T.textMuted }}>{concentrationNote}</div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* ✅ v1.5.18: 삼성전자+SK하이닉스 시총 집중도 6개월 추이 차트 */}
              <div style={{ marginTop:8, background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:"12px 10px" }}>
                <div style={{ fontSize:12, fontWeight:800, color:T.text, marginBottom:8 }}>📊 삼성전자+SK하이닉스 시총 집중도 (6개월)</div>
                {concentrationLoading ? (
                  <div style={{ textAlign:"center", padding:"24px", color:T.textMuted, fontSize:12 }}>📈 불러오는 중...</div>
                ) : (!concentrationData || concentrationData.length === 0) ? (
                  <div style={{ textAlign:"center", padding:"24px", color:T.textMuted, fontSize:12 }}>
                    데이터 없음{concentrationError ? ` (${concentrationError})` : ''}
                  </div>
                ) : (() => {
                  const cd = concentrationData;
                  const last = cd[cd.length - 1];
                  const first = cd[0];
                  const delta = (last.ratio - first.ratio);

                  const W = 320, H = 110, PAD = { l:32, r:8, t:8, b:20 };
                  const ratios = cd.map(d => d.ratio);
                  const minV = Math.min(...ratios) * 0.98;
                  const maxV = Math.max(...ratios) * 1.02;
                  const vRange = (maxV - minV) || 1;

                  const toTime2 = (d) => new Date(d).getTime();
                  const minTime2 = toTime2(cd[0].date);
                  const maxTime2 = toTime2(cd[cd.length - 1].date);
                  const timeRange2 = (maxTime2 - minTime2) || 1;
                  const pxByDate2 = (dateStr) => PAD.l + (W - PAD.l - PAD.r) * (toTime2(dateStr) - minTime2) / timeRange2;
                  const pyVal2 = (v) => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - minV) / vRange);

                  const linePath2 = cd.map((d, i) => `${i === 0 ? 'M' : 'L'}${pxByDate2(d.date)},${pyVal2(d.ratio)}`).join(' ');
                  const areaPath2 = `${linePath2} L${pxByDate2(last.date)},${pyVal2(minV)} L${pxByDate2(first.date)},${pyVal2(minV)} Z`;

                  const ySteps2 = 4;
                  const yLabels2 = Array.from({ length: ySteps2 + 1 }, (_, i) => {
                    const v = minV + (maxV - minV) * i / ySteps2;
                    return { y: pyVal2(v), label: v.toFixed(1) + '%' };
                  });

                  const xLabels2 = [];
                  let prevYm2 = '';
                  cd.forEach(d => {
                    const [yyyy, mm] = d.date.split('-');
                    const ym = `${yyyy}-${mm}`;
                    if (ym !== prevYm2) {
                      xLabels2.push({ x: pxByDate2(d.date), label: mm === '01' ? `${yyyy.slice(2)}.${mm}` : `'${mm}` });
                      prevYm2 = ym;
                    }
                  });

                  return (
                    <>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
                        <div style={{ fontSize:20, fontWeight:900, color:T.text }}>{last.ratio.toFixed(2)}%</div>
                        <div style={{ fontSize:11, fontWeight:700, color: delta >= 0 ? "#ef4444" : "#3b82f6" }}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(2)}%p (6개월)
                        </div>
                        <div style={{ fontSize:10, color:T.textMuted, marginLeft:"auto" }}>{last.date} 기준</div>
                      </div>
                      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", cursor:"crosshair" }}
                        onClick={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const mx = (e.clientX - rect.left) / rect.width * W;
                          const clickTime = minTime2 + (mx - PAD.l) / (W - PAD.l - PAD.r) * timeRange2;
                          let best = cd[0], bestDiff = Infinity;
                          cd.forEach(d => {
                            const diff = Math.abs(toTime2(d.date) - clickTime);
                            if (diff < bestDiff) { bestDiff = diff; best = d; }
                          });
                          setConcentrationTooltip(concentrationTooltip?.date === best.date ? null : best);
                        }}>
                        {yLabels2.map((yl, i) => (
                          <g key={i}>
                            <line x1={PAD.l} y1={yl.y} x2={W-PAD.r} y2={yl.y} stroke={T.cardBorder} strokeWidth="0.5" strokeDasharray="3,3" />
                            <text x={PAD.l-3} y={yl.y+3} textAnchor="end" fontSize="7" fill={T.textMuted}>{yl.label}</text>
                          </g>
                        ))}
                        {xLabels2.map((xl, i) => (
                          <text key={i} x={xl.x} y={H-6} textAnchor="middle" fontSize="7" fill={T.textMuted}>{xl.label}</text>
                        ))}
                        <path d={areaPath2} fill="#8b5cf6" opacity="0.12" stroke="none" />
                        <path d={linePath2} fill="none" stroke="#8b5cf6" strokeWidth="1.6" />
                        {concentrationTooltip && (() => {
                          const tx = pxByDate2(concentrationTooltip.date);
                          const ty = pyVal2(concentrationTooltip.ratio);
                          return (
                            <g>
                              <line x1={tx} y1={PAD.t} x2={tx} y2={H-PAD.b} stroke={T.textMuted} strokeWidth="0.5" strokeDasharray="2,2" />
                              <circle cx={tx} cy={ty} r="2.5" fill="#8b5cf6" stroke="#fff" strokeWidth="0.8" />
                            </g>
                          );
                        })()}
                      </svg>
                      {concentrationTooltip && (
                        <div style={{ marginTop:4, textAlign:"center", fontSize:11, color:T.text, background:T.section, borderRadius:6, padding:"4px 0" }}>
                          {concentrationTooltip.date} · {concentrationTooltip.ratio.toFixed(2)}%
                        </div>
                      )}
                      <div style={{ marginTop:6, fontSize:9, color:T.textMuted, lineHeight:1.4 }}>
                        ※ 추정치입니다. 삼성전자·SK하이닉스는 상장주식수를 현재 기준으로 고정하고 과거 주가를 곱해 계산했고,
                        코스피 전체 시총은 현재 전체 시총에 코스피 지수의 과거 대비 변동 비율을 곱해 역산한 값입니다.
                        (네이버는 과거 일자별 전체 시총 데이터를 제공하지 않아 정확한 값과는 다소 차이가 있을 수 있습니다.)
                      </div>
                    </>
                  );
                })()}
              </div>
              </>
            );
          })()}
        </div>
      )}

      {!isViewer && (
        <div style={{ textAlign:"center", padding:"40px 20px" }}>
          {mainText.html
            ? <div dangerouslySetInnerHTML={{ __html: mainText.html }} style={{ marginBottom:24, lineHeight:1.7 }} />
            : <>
                <div style={{ fontSize:56, marginBottom:8 }}>{mainText.emoji}</div>
                <div style={{ fontSize:22, fontWeight:900, color:T.text, marginBottom:4 }}>{mainText.title}</div>
                <div style={{ fontSize:20, color:"#f59e0b", fontWeight:900, marginBottom:24, lineHeight:1.7 }}>
                  {mainText.subtitle.split("\n").map((line,i) => <span key={i}>{line}{i<mainText.subtitle.split("\n").length-1&&<br/>}</span>)}
                </div>
              </>
          }
          <div style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:16, padding:24, maxWidth:320, margin:"0 auto" }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:4, color:T.text }}>📋 조회 코드 입력</div>
            <div style={{ fontSize:12, color:T.textMuted, marginBottom:16 }}>포트폴리오 및 매매 평단 리스트</div>
            <input style={{ ...S.pinInput, marginBottom:12 }} type="password" inputMode="numeric" maxLength={6} placeholder="코드 입력" value={viewerPinInput} onChange={e => setViewerPinInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&checkViewerPin()} />
            {viewerPinError && <div style={{ color:"#ef4444", fontSize:12, marginBottom:8 }}>{viewerPinError}</div>}
            <button style={{ ...S.btnMain, width:"100%" }} onClick={checkViewerPin}>입장하기</button>
          </div>
          <div style={{ marginTop:40, fontSize:11, color:T.textMuted }}>관리자는 우측 상단 버튼을 이용하세요</div>
        </div>
      )}
    </div>
  );
}
