import { useState, useRef, useCallback, useEffect } from "react";

const ADMIN_PIN = "4254";
const VIEWER_PIN = "2026";
const VERSION = "v1.0.7";

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
  "#06b6d4","#0891b2","#0e7490","#3b82f6","#1d4ed8","#60a5fa",
  "#a78bfa","#7c3aed","#c4b5fd","#22c55e","#15803d","#86efac",
  "#f59e0b","#b45309","#fcd34d","#ef4444","#b91c1c","#fca5a5",
  "#ec4899","#be185d","#f9a8d4","#84cc16","#4d7c0f","#bef264",
  "#f97316","#c2410c","#fdba74","#8b5cf6","#6d28d9","#c084fc",
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
                <span style={{ color: T.text, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.ticker}</span>
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
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
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
                <span style={{ fontSize: 10, color: s.isEtc ? T.textMuted : T.text, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{s.ticker}</span>
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
        <div style={{ display: "grid", gridTemplateColumns: showWealth ? "1.4fr 0.6fr 0.6fr 1fr 1.1fr" : "1.8fr 0.7fr 0.7fr 1.4fr", background: T.tableHead, padding: "8px 12px", gap: 4 }}>
          <span style={{ fontSize: 10, color: T.textSub }}>종목명</span>
          <span style={{ fontSize: 10, color: T.textSub, textAlign: "center" }}>비중</span>
          <span style={{ fontSize: 10, color: T.textSub, textAlign: "center" }}>수익률</span>
          <span style={{ fontSize: 10, color: T.textSub, textAlign: "right" }}>평단/현재가</span>
          {showWealth && <span style={{ fontSize: 10, color: "#22c55e", textAlign: "right" }}>수량/보유금액</span>}
        </div>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: showWealth ? "1.4fr 0.6fr 0.6fr 1fr 1.1fr" : "1.8fr 0.7fr 0.7fr 1.4fr", padding: "9px 12px", gap: 4, alignItems: "center", borderTop: `1px solid ${T.cardBorder}`, background: i % 2 === 0 ? T.tableRowEven : T.tableRowOdd }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span onClick={() => onChart && onChart(s)}
                style={{ color: T.text, fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: onChart ? "pointer" : "default", textDecoration: onChart ? "underline dotted" : "none" }}>
                {s.ticker}
              </span>
              {isAdmin && onEdit && (
                <button onClick={() => onEdit(s)} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 11, cursor: "pointer", padding: "2px 3px", flexShrink: 0, lineHeight: 1 }}>✏️</button>
              )}
            </div>
            <span style={{ color: T.text, fontWeight: 700, fontSize: 12, textAlign: "center" }}>{Number(s.pct).toFixed(1)}%</span>
            <span style={{ fontSize: 12, textAlign: "center", fontWeight: 700, color: s.ret === null ? T.textMuted : s.ret >= 0 ? "#ef4444" : "#3b82f6" }}>
              {s.ret !== null ? (s.ret >= 0 ? "+" : "") + s.ret.toFixed(1) + "%" : "-"}
            </span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>{s.avgBuy?.toLocaleString()}원</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.current?.toLocaleString()}원</div>
            </div>
            {showWealth && (
              <div style={{ textAlign: "right" }}>
                {s.approximateData ? <div style={{ fontSize: 10, color: "#f59e0b" }}>금액기준</div> : <div style={{ fontSize: 11, color: "#22c55e" }}>{s.qty?.toLocaleString()}주</div>}
                <div style={{ fontSize: 12, fontWeight: 700, color: s.approximateData ? "#f59e0b" : "#22c55e" }}>{s.value?.toLocaleString()}원</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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
  const [historySubTab, setHistorySubTab] = useState("buy");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showWealth, setShowWealth] = useState(false);
  const [editStockModal, setEditStockModal] = useState(null);
  const [portfolioEditMode, setPortfolioEditMode] = useState(false);
  const [editStockQty, setEditStockQty] = useState("");
  const [editStockAvg, setEditStockAvg] = useState("");
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
              if (!lp || s.approximateData || s.isOverseas) return s;
              return { ...s, currentPrice: lp, currentValue: lp * s.quantity };
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
    }).catch(() => {});
    fetch("/api/diary-load").then(r => r.json()).then(d => {
      if (d.posts) {
        setDiaryPosts(d.posts);
        d.posts.forEach(p => { if (p.linkUrl) fetchLinkPreview(p.linkUrl, p.id); });
      }
    }).catch(() => {});
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
    } else { setViewerPinError("코드가 틀렸습니다."); setViewerPinInput(""); }
  }
  function checkPin() {
    if (pinInput === ADMIN_PIN) {
      sessionStorage.setItem("jb_pin", pinInput);
      setIsAdmin(true); setIsViewer(true); setShowPin(false); setPinInput(""); setPinError("");
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
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: allRecords, portfolios, accounts, mainText: final }) });
  }

  async function addAccount() {
    const name = newAccName.trim(); if (!name) return alert("계좌명을 입력해주세요.");
    const id = "acc_" + Date.now();
    const newAccounts = [...accounts, { id, name }];
    setAccounts(newAccounts); setNewAccName(""); setAddAccModal(false);
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: allRecords, portfolios, accounts: newAccounts, mainText }) });
  }
  async function deleteAccount(accountId) {
    const acc = accounts.find(a => a.id === accountId);
    if (!window.confirm(`"${acc?.name}" 계좌를 삭제할까요?`)) return;
    const newAccounts = accounts.filter(a => a.id !== accountId);
    const newPortfolios = { ...portfolios }; delete newPortfolios[accountId];
    setAccounts(newAccounts); setPortfolios(newPortfolios);
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts: newAccounts, mainText }) });
  }

  async function saveEditStock() {
    const { accountId, stock } = editStockModal;
    const qty = parseInt(editStockQty), avg = parseInt(editStockAvg.replace(/,/g, ""));
    if (isNaN(qty) || isNaN(avg)) return alert("수량과 평단가를 올바르게 입력해주세요.");
    const existing = portfolios[accountId]; if (!existing) return;
    const updatedStocks = existing.stocks.map(s => s.ticker === stock.ticker ? { ...s, quantity: qty, avgBuyPrice: avg, currentValue: (livePrices[s.ticker] || s.currentPrice) * qty } : s);
    const totalValue = updatedStocks.reduce((sum, s) => sum + (s.currentValue || 0), 0);
    const newPortfolios = { ...portfolios, [accountId]: { ...existing, stocks: updatedStocks, totalValue } };
    setPortfolios(newPortfolios); setEditStockModal(null); setEditStockQty(""); setEditStockAvg("");
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
    alert(`✅ ${stock.ticker} 수정 완료!`);
  }
  async function deleteStock(accountId, ticker) {
    if (!window.confirm(`"${ticker}" 종목을 삭제할까요?`)) return;
    const existing = portfolios[accountId]; if (!existing) return;
    const updatedStocks = existing.stocks.filter(s => s.ticker !== ticker);
    const totalValue = updatedStocks.reduce((sum, s) => sum + (s.currentValue || 0), 0);
    const newPortfolios = { ...portfolios, [accountId]: { ...existing, stocks: updatedStocks, totalValue } };
    setPortfolios(newPortfolios);
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
  }
  async function saveManualStock() {
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
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
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
      allStocks = allStocks.map(s => s.approximateData ? { ...s, currentValue: s.currentPrice } : { ...s, currentValue: s.currentPrice * s.quantity });
      const totalValue = allStocks.reduce((sum, s) => sum + s.currentValue, 0);
      const isApproximate = data.stocks?.some(s => s.approximateData === true);
      const merged = { stocks: allStocks, totalValue, approximateData: isApproximate };
      const newPortfolios = { ...portfolios, [accountId]: merged };
      setPortfolios(newPortfolios);
      await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
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
        const base64 = await compressImage(item.file, 800);
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
      let merged = valid[0];
      if (valid.length > 1) { const r = await fetch("/api/merge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results: valid }) }); merged = await r.json(); }
      const today = new Date().toISOString().split("T")[0];
      const newRecord = { date: today, result: merged };
      const updated = [...allRecords.filter(r => r.date !== today), newRecord];
      await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: updated, portfolios, accounts, mainText }) });
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
    if (!window.confirm(`${accountName}를 삭제할까요?`)) return;
    const newPortfolios = { ...portfolios }; delete newPortfolios[accountId];
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts, mainText }) });
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
      const allNormalStocks = allPortfolios.flatMap(p => (p.stocks||[]).filter(s => !s.approximateData));
      const merged = Object.values(allNormalStocks.reduce((acc, s) => {
        if (s.isOverseas) {
          const krwValue = livePrices[s.ticker] ? livePrices[s.ticker] * s.quantity : s.currentValue;
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
      const normalTotal = merged.reduce((s, d) => s + (d.currentValue||0), 0);
      const approxTotal = allPortfolios.filter(p => p.approximateData).reduce((s, p) => s + (p.totalValue||0), 0);
      return { stocks: merged, totalValue: normalTotal + approxTotal, approxTotal };
    }
    const p = portfolios[activeAccount]; if (!p) return null;
    if (p.approximateData) return p;
    const stocks = (p.stocks||[]).map(s => { const cur = livePrices[s.ticker] || s.currentPrice; return { ...s, currentValue: cur * s.quantity }; });
    return { ...p, stocks, totalValue: stocks.reduce((sum, s) => sum + s.currentValue, 0) };
  })();

  const allDone = images.length > 0 && images.every(i => !i.loading);

  // 스타일 객체 (T 변수 사용)
  const S = {
    page: { minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: "20px 14px 60px", maxWidth: 720, margin: "0 auto" },
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
                const tradesByDate = {};
                allRecords.flatMap(r => r.result?.stocks || [])
                  .filter(s => s.ticker === ticker)
                  .flatMap(s => s.trades || [])
                  .forEach(t => {
                    if (!tradesByDate[t.date]) tradesByDate[t.date] = [];
                    tradesByDate[t.date].push(t);
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
                  yLabels.push({ p, y: py(p), label: p >= 10000 ? Math.round(p/100)/10+'만' : Math.round(p).toLocaleString() });
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
                          const avgLabel = chartModal.avgBuy >= 10000
                            ? `평단 ${Math.round(chartModal.avgBuy/100)/10}만`
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
                            </div>
                            <div style={{ color:T.text }}>가격: {chartTooltip.trade.price?.toLocaleString()}원</div>
                            {chartTooltip.trade.quantity && <div style={{ color:T.text }}>수량: {chartTooltip.trade.quantity}주</div>}
                            {chartTooltip.trade.total && <div style={{ color:T.text }}>금액: {chartTooltip.trade.total?.toLocaleString()}원</div>}
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
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: T.text }}>✏️ 수기 종목 입력</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>{accounts.find(a => a.id === manualModal.accountId)?.name}</div>
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
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setManualModal(null); setManualTicker(""); setManualTickerCode(""); setManualQty(""); setManualAvg(""); setManualPrice(""); }}>취소</button>
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
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>보유 수량 (주)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="number" placeholder="예: 100" value={editStockQty} onChange={e => setEditStockQty(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>매수 평단가 (원)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }} type="number" placeholder="예: 85000" value={editStockAvg} onChange={e => setEditStockAvg(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setEditStockModal(null); setEditStockQty(""); setEditStockAvg(""); }}>취소</button>
              <button style={{ ...S.btnDanger, flex: 1, fontSize: 12 }} onClick={() => { deleteStock(editStockModal.accountId, editStockModal.stock.ticker); setEditStockModal(null); }}>🗑️ 삭제</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={saveEditStock}>저장</button>
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

      {/* 헤더 */}
      <div style={S.header}>
        <div style={S.logoRow}>
          <span style={{ fontSize: 24 }}>🐜</span>
          <span style={S.logoText}>존버일기장</span>
          <span style={S.verBadge}>{VERSION}</span>
          {/* 다크/라이트 토글 */}
          <button onClick={toggleDarkMode} style={{ background: T.section, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 8px", fontSize: 14, cursor: "pointer", lineHeight: 1 }} title={darkMode ? "라이트 모드" : "다크 모드"}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          {isAdmin && <button onClick={() => setShowWealth(v => !v)} style={{ background: showWealth ? (darkMode ? "#1a2a1a" : "#dcfce7") : T.section, border: `1px solid ${showWealth ? "#22c55e" : T.border}`, borderRadius: 8, color: showWealth ? "#22c55e" : T.textMuted, padding: "4px 10px", fontSize: 14, cursor: "pointer", lineHeight: 1 }} title={showWealth ? "자산 비공개" : "자산 공개"}>{showWealth ? "🔓" : "🔒"}</button>}
          {isAdmin ? <button style={S.adminTag} onClick={() => { sessionStorage.removeItem("jb_pin"); setIsAdmin(false); setIsViewer(false); setShowWealth(false); }}>관리자 ✕</button>
            : isViewer ? <button style={S.adminTag} onClick={() => setIsViewer(false)}>조회중 ✕</button>
            : <button style={S.loginTag} onClick={() => setShowPin(true)}>관리자</button>}
        </div>
        <p style={S.sub}>{isAdmin ? "📤 이미지 올려서 분석 후 저장" : isViewer ? "📊 존버 매매기록 조회 중" : ""}</p>
        {isAdmin && (
          <button style={{ ...S.btnSub, fontSize: 11, padding: "4px 14px", marginTop: 8 }} onClick={() => { setEditDraft({ ...mainText }); setEditingMain(true); }}>
            ✏️ 입장화면 편집
          </button>
        )}
      </div>

      {/* 관리자 업로드 영역 */}
      {isAdmin && (
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
                  {portfolios[acc.id] && <button style={{ background: T.btnDangerBg, border: `1px solid ${T.btnDangerBorder}`, borderRadius: 8, color: T.btnDangerText, padding: "5px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }} onClick={() => clearPortfolio(acc.id)}>🗑️</button>}
                  <button style={{ background: T.btnDangerBg, border: `1px solid ${T.btnDangerBorder}`, borderRadius: 8, color: T.textMuted, padding: "5px 8px", fontSize: 11, cursor: "pointer", flexShrink: 0 }} onClick={() => deleteAccount(acc.id)}>✕</button>
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
                      openChart({ ticker: s.ticker, tickerCode: orig.tickerCode, isOverseas: orig.isOverseas || false, avgBuy: orig.avgBuyPrice || s.avgBuy || null });
                    }}
                    onEdit={(activeAccount !== "all" && portfolioEditMode) ? (s) => {
                      const origStock = portfolios[activeAccount]?.stocks?.find(st => st.ticker === s.ticker);
                      if (origStock) { setEditStockModal({ accountId: activeAccount, stock: origStock }); setEditStockQty(String(origStock.quantity||"")); setEditStockAvg(String(origStock.avgBuyPrice||"")); }
                    } : null}
                    data={displayPortfolio.stocks?.map(s => {
                      const currentPrice = livePrices[s.ticker] || s.currentPrice;
                      const value = s.isOverseas ? (livePrices[s.ticker] ? livePrices[s.ticker] * s.quantity : s.currentValue) : currentPrice * s.quantity;
                      return { ticker: s.ticker, value, avgBuy: s.isOverseas ? null : s.avgBuyPrice, current: s.isOverseas ? livePrices[s.ticker] || null : currentPrice, qty: s.quantity, isOverseas: s.isOverseas, returnRate: s.returnRate, approximateData: s.approximateData };
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
        </>
      )}

      {/* 입장 화면 */}
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
