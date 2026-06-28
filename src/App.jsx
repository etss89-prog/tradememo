import { useState, useRef, useCallback, useEffect } from "react";

const ADMIN_PIN = "4254";
const VIEWER_PIN = "2026";
const VERSION = "v5.6";

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

// 기본 계좌 목록 (초기값, 이후 Redis에서 불러옴)
const DEFAULT_ACCOUNTS = [
  { id: "main", name: "삼성증권 본계좌" },
  { id: "pension", name: "삼성증권 연금저축" },
  { id: "irp", name: "삼성증권 퇴직연금IRP" },
  { id: "dc", name: "삼성증권 퇴직연금DC" },
  { id: "hana", name: "하나증권" },
  { id: "ksfc", name: "한국증권금융" },
  { id: "kb_isa", name: "KB ISA" },
];

const COLORS = [
  "#06b6d4","#0891b2","#0e7490",
  "#3b82f6","#1d4ed8","#60a5fa",
  "#a78bfa","#7c3aed","#c4b5fd",
  "#22c55e","#15803d","#86efac",
  "#f59e0b","#b45309","#fcd34d",
  "#ef4444","#b91c1c","#fca5a5",
  "#ec4899","#be185d","#f9a8d4",
  "#84cc16","#4d7c0f","#bef264",
  "#f97316","#c2410c","#fdba74",
  "#8b5cf6","#6d28d9","#c084fc",
];

function DonutChart({ data, title, centerText, labelName, labelPct, labelAvg }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const R = 42, r = 24, cx = 50, cy = 50;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const start = cumulative;
    cumulative += pct;
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
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 12, marginBottom: 12 }}>
      {title && <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>{title}</div>}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <svg viewBox="0 0 100 100" style={{ width: 80, height: 80, flexShrink: 0 }}>
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
          {centerText && (
            <>
              <text x="50" y="47" textAnchor="middle" fill="#e2e8f0" fontSize="6" fontWeight="700">{centerText.line1}</text>
              <text x="50" y="56" textAnchor="middle" fill="#94a3b8" fontSize="5">{centerText.line2}</text>
            </>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 5, paddingBottom: 4, borderBottom: "1px solid #1e293b" }}>
            <span style={{ flex: 2, fontSize: 10, color: "#475569" }}>{labelName || "종목명"}</span>
            <span style={{ flex: 1, fontSize: 10, color: "#475569", textAlign: "center" }}>{labelPct || "비중"}</span>
            <span style={{ flex: 1, fontSize: 10, color: "#475569", textAlign: "right" }}>{labelAvg || "평단"}</span>
          </div>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 2, minWidth: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.ticker}</span>
              </div>
              <span style={{ flex: 1, color: s.color, fontWeight: 700, textAlign: "center", fontSize: 11, whiteSpace: "nowrap" }}>{Number(s.pct).toFixed(1)}%</span>
              <span style={{ flex: 1, color: "#94a3b8", textAlign: "right", fontSize: 11, whiteSpace: "nowrap" }}>{s.avgPrice?.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PortfolioChart({ data, isAdmin, showWealth }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const R = 40, r = 22, cx = 50, cy = 50;
  const slices = sorted.map((d, i) => {
    const pct = d.value / total;
    const start = cumulative;
    cumulative += pct;
    const a1 = start * 2 * Math.PI - Math.PI / 2;
    const a2 = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1o = cx + R * Math.cos(a1), y1o = cy + R * Math.sin(a1);
    const x2o = cx + R * Math.cos(a2), y2o = cy + R * Math.sin(a2);
    const x1i = cx + r * Math.cos(a1), y1i = cy + r * Math.sin(a1);
    const x2i = cx + r * Math.cos(a2), y2i = cy + r * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    const path = `M${x1o},${y1o} A${R},${R} 0 ${large},1 ${x2o},${y2o} L${x2i},${y2i} A${r},${r} 0 ${large},0 ${x1i},${y1i} Z`;
    const ret = d.avgBuy ? ((d.current - d.avgBuy) / d.avgBuy * 100) : null;
    return { ...d, path, color: COLORS[i % COLORS.length], pct: Math.round(pct * 1000) / 10, ret };
  });

  return (
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>📊 현재 포트폴리오</div>
        {data?.some?.(s => s.approximateData) && (
          <span style={{ fontSize: 10, background: "#2d2000", border: "1px solid #b45309", color: "#f59e0b", borderRadius: 6, padding: "2px 7px" }}>
            ⚠️ 수량 미확인 · 금액 기준 표시
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <svg viewBox="0 0 100 100" style={{ width: "38%", maxWidth: 150, minWidth: 100, flexShrink: 0 }}>
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
          <text x="50" y="48" textAnchor="middle" fill="#94a3b8" fontSize="7">포트폴리오</text>
          <text x="50" y="58" textAnchor="middle" fill="#e2e8f0" fontSize="7" fontWeight="700">{slices.length}종목</text>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          {(() => {
            const MAX = 29;
            const shown = slices.slice(0, MAX);
            const rest = slices.slice(MAX);
            const restValue = rest.reduce((sum, r) => sum + r.value, 0);
            const restPct = total > 0 ? Math.round(restValue / total * 1000) / 10 : 0;
            const all = [...shown, ...(rest.length > 0 ? [{ ticker: `기타 ${rest.length}종목`, pct: restPct, color: "#475569", isEtc: true }] : [])];
            const half = Math.ceil(all.length / 2);
            const col1 = all.slice(0, half);
            const col2 = all.slice(half);
            const ColItem = ({ s }) => (
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: s.isEtc ? "#64748b" : "#e2e8f0", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{s.ticker}</span>
                <span style={{ fontSize: 10, color: s.isEtc ? "#64748b" : "#94a3b8", fontWeight: 700, flexShrink: 0, marginLeft: 2 }}>{Number(s.pct).toFixed(1)}%</span>
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
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
        <div style={{ display: "grid", gridTemplateColumns: showWealth ? "1.4fr 0.6fr 0.6fr 1fr 1.1fr" : "1.8fr 0.7fr 0.7fr 1.4fr", background: "#0f172a", padding: "8px 12px", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#475569" }}>종목명</span>
          <span style={{ fontSize: 10, color: "#475569", textAlign: "center" }}>비중</span>
          <span style={{ fontSize: 10, color: "#475569", textAlign: "center" }}>수익률</span>
          <span style={{ fontSize: 10, color: "#475569", textAlign: "right" }}>평단/현재가</span>
          {showWealth && <span style={{ fontSize: 10, color: "#22c55e", textAlign: "right" }}>수량/보유금액</span>}
        </div>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: showWealth ? "1.4fr 0.6fr 0.6fr 1fr 1.1fr" : "1.8fr 0.7fr 0.7fr 1.4fr", padding: "9px 12px", gap: 4, alignItems: "center", borderTop: "1px solid #1e293b", background: i % 2 === 0 ? "#111827" : "#0f172a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 12 }}>{s.ticker}</span>
            </div>
            <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 12, textAlign: "center" }}>{Number(s.pct).toFixed(1)}%</span>
            <span style={{ fontSize: 12, textAlign: "center", fontWeight: 700,
              color: s.ret === null ? "#64748b" : s.ret >= 0 ? "#ef4444" : "#3b82f6" }}>
              {s.ret !== null ? (s.ret >= 0 ? "+" : "") + s.ret.toFixed(1) + "%" : "-"}
            </span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>{s.avgBuy?.toLocaleString()}원</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{s.current?.toLocaleString()}원</div>
            </div>
            {showWealth && (
              <div style={{ textAlign: "right" }}>
                {s.approximateData
                  ? <div style={{ fontSize: 10, color: "#f59e0b" }}>금액기준</div>
                  : <div style={{ fontSize: 11, color: "#22c55e" }}>{s.qty?.toLocaleString()}주</div>
                }
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [viewerPinInput, setViewerPinInput] = useState("");
  const [viewerPinError, setViewerPinError] = useState("");
  const [images, setImages] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [portfolios, setPortfolios] = useState({});
  const [activeAccount, setActiveAccount] = useState("all");
  const [portfolioLoading, setPortfolioLoading] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [uploadingAccount, setUploadingAccount] = useState(null);
  const [merging, setMerging] = useState(false);
  // ✅ 수정: activeTab은 "portfolio" / "history" 만 사용
  const [activeTab, setActiveTab] = useState("portfolio");
  // ✅ 수정: history 안에 별도 서브탭 추가
  const [historySubTab, setHistorySubTab] = useState("buy");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showWealth, setShowWealth] = useState(false); // 관리자 자산공개 토글
  const [mainText, setMainText] = useState({ emoji: "🐜", title: "존버일기장", subtitle: "존버는 승리한다.\n왜냐하면 승리하기 때문이다." });
  const [editingMain, setEditingMain] = useState(false);
  const [editDraft, setEditDraft] = useState({});
  // 동적 계좌 관리
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [addAccModal, setAddAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  // 수기입력 모달
  const [manualModal, setManualModal] = useState(null); // { accountId }
  const [manualTicker, setManualTicker] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [manualAvg, setManualAvg] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const fileRef = useRef(null);
  const portfolioRef = useRef(null);

  useEffect(() => {
    fetch("/api/load").then(r => r.json()).then(d => {
      if (d.records) setAllRecords(d.records);
      if (d.portfolios) {
        setPortfolios(d.portfolios);
      }
      if (d.accounts && d.accounts.length > 0) setAccounts(d.accounts);
      if (d.mainText) setMainText(d.mainText);
      // ✅ Redis에 저장된 현재가 불러오기 → 관리자가 갱신한 가격을 모든 접속자가 공유
      if (d.livePrices) setLivePrices(d.livePrices);
      if (d.priceUpdatedAt) setLastUpdated(d.priceUpdatedAt);
    }).catch(() => {});
  }, []);

  async function saveMainText() {
    setMainText(editDraft);
    setEditingMain(false);
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: allRecords, portfolios, accounts, mainText: editDraft })
    });
  }

  async function addAccount() {
    const name = newAccName.trim();
    if (!name) return alert("계좌명을 입력해주세요.");
    const id = "acc_" + Date.now();
    const newAccounts = [...accounts, { id, name }];
    setAccounts(newAccounts);
    setNewAccName("");
    setAddAccModal(false);
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: allRecords, portfolios, accounts: newAccounts, mainText })
    });
  }

  async function deleteAccount(accountId) {
    const acc = accounts.find(a => a.id === accountId);
    if (!window.confirm(`"${acc?.name}" 계좌를 삭제할까요?
(해당 계좌의 포트폴리오도 삭제됩니다)`)) return;
    const newAccounts = accounts.filter(a => a.id !== accountId);
    const newPortfolios = { ...portfolios };
    delete newPortfolios[accountId];
    setAccounts(newAccounts);
    setPortfolios(newPortfolios);
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts: newAccounts, mainText })
    });
  }

  async function saveManualStock() {
    const ticker = manualTicker.trim();
    const qty = parseInt(manualQty);
    const avg = parseInt(manualAvg.replace(/,/g, ""));
    const price = parseInt(manualPrice.replace(/,/g, "")) || avg;
    if (!ticker || !qty || !avg) return alert("종목명, 수량, 평단가를 모두 입력해주세요.");
    const accountId = manualModal.accountId;
    const newStock = {
      ticker,
      quantity: qty,
      avgBuyPrice: avg,
      currentPrice: price,
      currentValue: price * qty,
    };
    const existing = portfolios[accountId];
    let stocks = existing ? [...(existing.stocks || [])] : [];
    const idx = stocks.findIndex(s => s.ticker === ticker);
    if (idx >= 0) stocks[idx] = newStock; // 같은 종목이면 덮어쓰기
    else stocks.push(newStock);
    const totalValue = stocks.reduce((s, st) => s + st.currentValue, 0);
    const newPortfolios = { ...portfolios, [accountId]: { stocks, totalValue } };
    setPortfolios(newPortfolios);
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts })
    });
    setManualTicker(""); setManualQty(""); setManualAvg(""); setManualPrice("");
    setManualModal(null);
    alert(`✅ ${ticker} 저장 완료!`);
  }

  function checkViewerPin() {
    if (viewerPinInput === VIEWER_PIN) { setIsViewer(true); setViewerPinInput(""); setViewerPinError(""); }
    else { setViewerPinError("코드가 틀렸습니다."); setViewerPinInput(""); }
  }

  function checkPin() {
    if (pinInput === ADMIN_PIN) { setIsAdmin(true); setIsViewer(true); setShowPin(false); setPinInput(""); setPinError(""); }
    else { setPinError("PIN이 틀렸습니다."); setPinInput(""); }
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
        const result = await res.json();
        if (result.error) throw new Error(result.error);
        setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: false, result } : i));
      } catch(e) {
        setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: false, error: e.message } : i));
      }
    }
  }, [isAdmin]);

  async function analyzePortfolio(file, accountId) {
    setPortfolioLoading(accountId);
    try {
      const base64 = await compressImage(file, 800);
      const res = await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: base64 }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const existing = portfolios[accountId];
      let allStocks = [...(data.stocks || [])];
      if (existing && existing.stocks && existing.stocks.length > 0) {
        const newTickers = new Set(data.stocks.map(s => s.ticker));
        const existingOnly = existing.stocks.filter(s => !newTickers.has(s.ticker));
        allStocks = [...existingOnly, ...data.stocks];
      }
      allStocks = allStocks.map(s => {
        if (s.approximateData) {
          // 금액기준 종목: avgBuyPrice=매입원금, currentPrice=평가금액, quantity=1
          // currentValue는 평가금액 그대로 유지
          return { ...s, currentValue: s.currentPrice };
        }
        return { ...s, currentValue: s.currentPrice * s.quantity };
      });
      const totalValue = allStocks.reduce((sum, s) => sum + s.currentValue, 0);
      // approximateData: 수량/단가 없이 금액만 있는 포맷 여부 (퇴직연금DC 등)
      const isApproximate = data.stocks?.some(s => s.approximateData === true);
      const merged = { stocks: allStocks, totalValue, approximateData: isApproximate };

      const newPortfolios = { ...portfolios, [accountId]: merged };
      setPortfolios(newPortfolios);

      // ✅ 자동 현재가 조회 제거 - 🔄 버튼 눌렀을 때만 조회

      await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts })
      });

      const isAdding = existing && existing.stocks;
      alert(isAdding ? `✅ 추가 완료! 총 ${merged.stocks.length}종목` : `✅ 저장 완료! ${merged.stocks.length}종목`);
    } catch(e) {
      alert("오류: " + e.message);
    }
    setPortfolioLoading(null);
  }

  async function fetchLivePrices(stocks) {
    if (!stocks || stocks.length === 0) return;
    setPriceLoading(true);
    try {
      const tickers = stocks.map(s => s.ticker);
      const res = await fetch("/api/stockprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      });
      const data = await res.json();
      if (data.prices) {
        setLivePrices(data.prices);
        const now = new Date().toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
        setLastUpdated(now);
        // ✅ 현재가만 별도로 저장 (portfolios 등 다른 데이터 건드리지 않음)
        fetch("/api/save-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ livePrices: data.prices, priceUpdatedAt: now })
        }).catch(() => {});
      }
    } catch (e) {
      console.error("주가 조회 실패:", e);
    }
    setPriceLoading(false);
  }

  async function saveResults() {
    const valid = images.filter(i => i.result).map(i => i.result);
    if (!valid.length) return;
    setMerging(true);
    try {
      let merged = valid[0];
      if (valid.length > 1) {
        const r = await fetch("/api/merge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results: valid }) });
        merged = await r.json();
      }
      const today = new Date().toISOString().split("T")[0];
      const newRecord = { date: today, result: merged };
      const updated = [...allRecords.filter(r => r.date !== today), newRecord];
      await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: updated, portfolios }) });
      setAllRecords(updated);
      setImages([]);
      alert("✅ 저장 완료!");
    } catch(e) { alert("저장 실패: " + e.message); }
    setMerging(false);
  }

  async function clearRecords() {
    if (!window.confirm("매수/매도 기록을 삭제할까요?")) return;
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: [], portfolios }) });
    setAllRecords([]);
  }

  async function clearPortfolio(accountId) {
    const accountName = accounts.find(a => a.id === accountId)?.name || "포트폴리오";
    if (!window.confirm(`${accountName}를 삭제할까요?`)) return;
    const newPortfolios = { ...portfolios };
    delete newPortfolios[accountId];
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: allRecords, portfolios: newPortfolios }) });
    setPortfolios(newPortfolios);
    if (Object.keys(newPortfolios).length === 0) setLivePrices({});
  }

  async function clearAll() {
    if (!window.confirm("매수/매도 기록과 포트폴리오를 모두 삭제할까요?")) return;
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: [], portfolios: {} }) });
    setAllRecords([]); setPortfolios({}); setLivePrices({});
  }

  // Date filtering
  const allTradesFlat = allRecords.flatMap(r => r.result?.stocks || []).flatMap(s => s.trades || []);
  const tradeDates = [...new Set(allTradesFlat.map(t => t.date))].sort();
  const minDate = tradeDates[0] || "";
  const maxDate = tradeDates[tradeDates.length - 1] || "";

  const isInRange = (date) => {
    if (!startDate && !endDate) return true;
    if (startDate && endDate) return date >= startDate && date <= endDate;
    if (startDate) return date >= startDate;
    if (endDate) return date <= endDate;
    return true;
  };

  const allStocks = allRecords.flatMap(r => r.result?.stocks || []);
  const mergedStocks = Object.values(allStocks.reduce((acc, s) => {
    const filteredTrades = s.trades.filter(t => isInRange(t.date));
    if (filteredTrades.length === 0) return acc;
    if (!acc[s.ticker]) acc[s.ticker] = { ...s, trades: [...filteredTrades] };
    else acc[s.ticker].trades = [...acc[s.ticker].trades, ...filteredTrades];
    const buyTrades = acc[s.ticker].trades.filter(t => t.type === "매수");
    const sellTrades = acc[s.ticker].trades.filter(t => t.type === "매도");
    const totalBuyQty = buyTrades.reduce((sum, t) => sum + t.quantity, 0);
    const totalBuyAmt = buyTrades.reduce((sum, t) => sum + t.price * t.quantity, 0);
    const totalSellQty = sellTrades.reduce((sum, t) => sum + t.quantity, 0);
    acc[s.ticker].avgBuyPrice = totalBuyQty ? Math.round(totalBuyAmt / totalBuyQty) : 0;
    acc[s.ticker].totalInvested = buyTrades.reduce((sum, t) => sum + t.total, 0);
    acc[s.ticker].totalSold = sellTrades.reduce((sum, t) => sum + t.total, 0);
    acc[s.ticker].currentHolding = totalBuyQty - totalSellQty;
    return acc;
  }, {}));

  const buyStocks = mergedStocks.filter(s => s.trades.some(t => t.type === "매수")).sort((a, b) => (b.totalInvested || 0) - (a.totalInvested || 0));
  const sellStocks = mergedStocks.filter(s => s.trades.some(t => t.type === "매도")).sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
  const buyPieData = buyStocks.map(s => ({ ticker: s.ticker, value: s.totalInvested || 0, avgPrice: s.avgBuyPrice }));
  const sellPieData = sellStocks.map(s => ({ ticker: s.ticker, value: s.totalSold || 0, avgPrice: Math.round((s.trades.filter(t=>t.type==="매도").reduce((a,t)=>a+t.price*t.quantity,0))/(s.trades.filter(t=>t.type==="매도").reduce((a,t)=>a+t.quantity,0)||1)) }));

  // ✅ 수정: historySubTab 기준으로 표시 종목 결정
  const displayStocks = historySubTab === "buy" ? buyStocks : sellStocks;

  const displayPortfolio = (() => {
    if (activeAccount === "all") {
      const allStocks = Object.values(portfolios).flatMap(p => p.stocks || []);
      if (allStocks.length === 0) return null;
      const merged = Object.values(allStocks.reduce((acc, s) => {
        if (s.approximateData) {
          // 금액기준 종목: currentValue 직접 사용, 현재가 갱신 무시
          if (!acc[s.ticker]) acc[s.ticker] = { ...s, currentValue: s.currentValue };
          else acc[s.ticker].currentValue += s.currentValue;
          return acc;
        }
        const cur = livePrices[s.ticker] || s.currentPrice;
        if (!acc[s.ticker]) {
          acc[s.ticker] = { ...s, quantity: s.quantity, currentValue: cur * s.quantity };
        } else {
          acc[s.ticker].quantity += s.quantity;
          acc[s.ticker].currentValue += cur * s.quantity;
          acc[s.ticker].avgBuyPrice = Math.round(
            (acc[s.ticker].avgBuyPrice * (acc[s.ticker].quantity - s.quantity) + s.avgBuyPrice * s.quantity) / acc[s.ticker].quantity
          );
        }
        return acc;
      }, {}));
      return { stocks: merged, totalValue: merged.reduce((s, d) => s + d.currentValue, 0) };
    }
    return portfolios[activeAccount] || null;
  })();

  const allDone = images.length > 0 && images.every(i => !i.loading);

  function shareText() {
    const lines = ["📊 존버일기장 매매기록\n"];
    mergedStocks.forEach(s => {
      lines.push(`▶ ${s.ticker} | 평균 ${s.avgBuyPrice?.toLocaleString()}원 | ${s.currentHolding}주`);
      s.trades.forEach(t => lines.push(`  ${t.date} ${t.type} ${t.price?.toLocaleString()}원×${t.quantity}주`));
    });
    lines.push("\n#주식 #존버일기장 #포트폴리오");
    return lines.join("\n");
  }

  return (
    <div style={S.page}>
      {/* 메인화면 편집 모달 - 관리자 전용 */}
      {editingMain && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 320, textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>✏️ 메인화면 편집</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>이모지</div>
                <input style={{ ...S.pinInput, fontSize: 20, letterSpacing: 4, padding: "8px 12px" }}
                  value={editDraft.emoji} onChange={e => setEditDraft(d => ({ ...d, emoji: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>제목</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  value={editDraft.title} onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>부제목 (줄바꿈은 
 입력)</div>
                <textarea style={{ ...S.pinInput, fontSize: 13, letterSpacing: 0, textAlign: "left", padding: "8px 12px", height: 80, resize: "none", lineHeight: 1.6 }}
                  value={editDraft.subtitle} onChange={e => setEditDraft(d => ({ ...d, subtitle: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => setEditingMain(false)}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={saveMainText}>저장</button>
            </div>
          </div>
        </div>
      )}

      {showPin && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔐 관리자 PIN</div>
            <input style={S.pinInput} type="password" inputMode="numeric" maxLength={6} placeholder="PIN 입력" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === "Enter" && checkPin()} autoFocus />
            {pinError && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>{pinError}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={S.btnSub} onClick={() => { setShowPin(false); setPinInput(""); setPinError(""); }}>취소</button>
              <button style={S.btnMain} onClick={checkPin}>확인</button>
            </div>
          </div>
        </div>
      )}

      {addAccModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 300 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>➕ 계좌 추가</div>
            <div style={{ textAlign: "left", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>계좌명</div>
              <input
                style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                placeholder="예: KB ISA, 미래에셋 CMA"
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addAccount()}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setAddAccModal(false); setNewAccName(""); }}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={addAccount}>추가</button>
            </div>
          </div>
        </div>
      )}

      {manualModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 300 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>✏️ 수기 종목 입력</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
              {accounts.find(a => a.id === manualModal.accountId)?.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>종목명</div>
                <input
                  style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  placeholder="예: SK하이닉스"
                  value={manualTicker}
                  onChange={e => setManualTicker(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>보유 수량 (주)</div>
                <input
                  style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  type="number" placeholder="예: 10"
                  value={manualQty}
                  onChange={e => setManualQty(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>매수 평단가 (원)</div>
                <input
                  style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  type="number" placeholder="예: 185000"
                  value={manualAvg}
                  onChange={e => setManualAvg(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>현재가 (원, 선택)</div>
                <input
                  style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  type="number" placeholder="비워두면 평단가로 설정"
                  value={manualPrice}
                  onChange={e => setManualPrice(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setManualModal(null); setManualTicker(""); setManualQty(""); setManualAvg(""); setManualPrice(""); }}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={saveManualStock}>저장</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.header}>
        <div style={S.logoRow}>
          <span style={{ fontSize: 24 }}>🐜</span>
          <span style={S.logoText}>존버일기장</span>
          <span style={S.verBadge}>{VERSION}</span>
          {isAdmin && (
            <button
              onClick={() => setShowWealth(v => !v)}
              style={{
                background: showWealth ? "#1a2a1a" : "#1e293b",
                border: showWealth ? "1px solid #22c55e" : "1px solid #334155",
                borderRadius: 8, color: showWealth ? "#22c55e" : "#475569",
                padding: "4px 10px", fontSize: 14, cursor: "pointer", lineHeight: 1,
              }}
              title={showWealth ? "자산 비공개로 전환" : "자산 공개로 전환"}
            >
              {showWealth ? "🔓" : "🔒"}
            </button>
          )}
          {isAdmin ? <button style={S.adminTag} onClick={() => { setIsAdmin(false); setIsViewer(false); setShowWealth(false); }}>관리자 ✕</button>
            : isViewer ? <button style={S.adminTag} onClick={() => setIsViewer(false)}>조회중 ✕</button>
            : <button style={S.loginTag} onClick={() => setShowPin(true)}>관리자</button>}
        </div>
        <p style={S.sub}>{isAdmin ? "📤 이미지 올려서 분석 후 저장" : isViewer ? "📊 존버 매매기록 조회 중" : ""}</p>
        {isAdmin && (
          <button style={{ ...S.btnSub, fontSize: 11, padding: "4px 14px", marginTop: 8 }}
            onClick={() => { setEditDraft({ ...mainText }); setEditingMain(true); }}>
            ✏️ 입장화면 편집
          </button>
        )}
      </div>

      {isAdmin && (
        <>
          <div style={{ ...S.drop, ...(dragOver ? S.dropOn : {}) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
            <div style={{ fontSize: 32, marginBottom: 6 }}>📱</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>매매내역 이미지 업로드</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>여러 날짜 누적 저장 가능</div>
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
            <button style={{ ...S.btnMain, width: "100%", marginBottom: 10 }} onClick={saveResults} disabled={merging}>
              {merging ? "저장 중…" : "💾 매매기록 저장"}
            </button>
          )}

          <input ref={portfolioRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { if (e.target.files[0] && uploadingAccount) { analyzePortfolio(e.target.files[0], uploadingAccount); e.target.value = ""; } }} />
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>📈 계좌별 포트폴리오 업로드</div>
              <button style={{ background: "#1a2a1a", border: "1px solid #166534", borderRadius: 8, color: "#4ade80", padding: "4px 10px", fontSize: 12, cursor: "pointer" }} onClick={() => setAddAccModal(true)}>➕ 계좌 추가</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{acc.name}</span>
                    {portfolios[acc.id] && (
                      <span style={{ fontSize: 11, color: "#4ade80", marginLeft: 8 }}>
                        ✅ {portfolios[acc.id].stocks?.length}종목
                        {portfolios[acc.id].approximateData && (
                          <span style={{ fontSize: 10, color: "#f59e0b", marginLeft: 4 }}>⚠️ 금액기준</span>
                        )}
                      </span>
                    )}
                  </div>
                  <button
                    style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#94a3b8", padding: "5px 12px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                    disabled={portfolioLoading === acc.id}
                    onClick={() => { setUploadingAccount(acc.id); setTimeout(() => portfolioRef.current?.click(), 50); }}>
                    {portfolioLoading === acc.id ? "⏳" : "📤 업로드"}
                  </button>
                  <button
                    style={{ background: "#1a2a1a", border: "1px solid #166534", borderRadius: 8, color: "#4ade80", padding: "5px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                    onClick={() => { setManualModal({ accountId: acc.id }); setManualTicker(""); setManualQty(""); setManualAvg(""); setManualPrice(""); }}>
                    ✏️
                  </button>
                  {portfolios[acc.id] && (
                    <button
                      style={{ background: "#2d1f1f", border: "1px solid #7f1d1d", borderRadius: 8, color: "#ef4444", padding: "5px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                      onClick={() => clearPortfolio(acc.id)}>
                      🗑️
                    </button>
                  )}
                  <button
                    style={{ background: "#2d1f1f", border: "1px solid #7f1d1d", borderRadius: 8, color: "#475569", padding: "5px 8px", fontSize: 11, cursor: "pointer", flexShrink: 0 }}
                    title="계좌 삭제"
                    onClick={() => deleteAccount(acc.id)}>
                    ✕
                  </button>
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

      {isViewer && (
        <>
          {/* 메인 탭 2개 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => setActiveTab("portfolio")}
              style={{ flex: 1, padding: "10px 8px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                background: activeTab === "portfolio" ? "#1a2a1a" : "#111827",
                borderColor: activeTab === "portfolio" ? "#22c55e" : "#1e293b",
                color: activeTab === "portfolio" ? "#22c55e" : "#64748b",
              }}>
              📊 현재 포트폴리오
            </button>
            <button onClick={() => setActiveTab("history")}
              style={{ flex: 1, padding: "10px 8px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                background: activeTab === "history" ? "#1a1a2a" : "#111827",
                borderColor: activeTab === "history" ? "#6366f1" : "#1e293b",
                color: activeTab === "history" ? "#a78bfa" : "#64748b",
              }}>
              📋 매수/매도 기록
            </button>
          </div>

          {/* 포트폴리오 탭 */}
          {activeTab === "portfolio" && (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
                {[{ id: "all", name: "전체합산" }, ...accounts].map(acc => (
                  <button key={acc.id} onClick={() => setActiveAccount(acc.id)}
                    style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "1px solid", whiteSpace: "nowrap", flexShrink: 0,
                      background: activeAccount === acc.id ? "#1e3a5f" : "#111827",
                      borderColor: activeAccount === acc.id ? "#3b82f6" : "#1e293b",
                      color: activeAccount === acc.id ? "#60a5fa" : "#64748b",
                    }}>
                    {acc.name}
                    {acc.id !== "all" && portfolios[acc.id] && <span style={{ color: "#4ade80", marginLeft: 4 }}>●</span>}
                  </button>
                ))}
              </div>

              {displayPortfolio
                ? <>
                    <style>{`
                      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                      .spinner { width: 14px; height: 14px; border: 2px solid #334155; border-top-color: #60a5fa; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
                    `}</style>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#475569" }}>
                          {lastUpdated ? `📅 ${lastUpdated} 기준 주가를 갱신했습니다.` : ""}
                        </span>
                        <button
                          onClick={() => {
            const all = Object.values(portfolios).flatMap(p => p.stocks||[]);
            // ✅ approximateData 종목은 현재가 갱신 제외 (퇴직연금DC 등 금액기준 종목)
            const filtered = all.filter(s => !s.approximateData);
            const unique = [...new Map(filtered.map(s=>[s.ticker,s])).values()];
            fetchLivePrices(unique);
          }}
                          disabled={priceLoading}
                          style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: priceLoading ? "#60a5fa" : "#94a3b8", padding: "4px 12px", fontSize: 12, cursor: priceLoading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                          {priceLoading ? <><span className="spinner" /><span>갱신 중...</span></> : "🔄 현재가 갱신"}
                        </button>
                      </div>
                      {priceLoading && (
                        <div style={{ fontSize: 11, color: "#60a5fa", marginTop: 6, textAlign: "right" }}>
                          잠시만 기다려주세요, 현재 가격을 갱신 중입니다.
                        </div>
                      )}
                    </div>
                    {showWealth && displayPortfolio && (
                      <div style={{ background: "#0f1f0f", border: "1px solid #166534", borderRadius: 12, padding: "12px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>🔓 총 보유금액</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: "#22c55e" }}>
                          {displayPortfolio.stocks?.reduce((s, st) => {
                            if (st.approximateData) return s + (st.currentValue || 0);
                            const cur = livePrices[st.ticker] || st.currentPrice;
                            return s + cur * (st.quantity || 0);
                          }, 0).toLocaleString()}원
                        </span>
                      </div>
                    )}
                    <PortfolioChart isAdmin={isAdmin} showWealth={showWealth} data={displayPortfolio.stocks?.map(s => {
                      if (s.approximateData) {
                        // 금액기준 종목: currentValue(평가금액) 직접 사용, 현재가 갱신 무시
                        return { ticker: s.ticker, value: s.currentValue, avgBuy: s.avgBuyPrice, current: s.currentPrice, qty: null, approximateData: true };
                      }
                      const currentPrice = livePrices[s.ticker] || s.currentPrice;
                      return { ticker: s.ticker, value: currentPrice * s.quantity, avgBuy: s.avgBuyPrice, current: currentPrice, qty: s.quantity };
                    })} />
                  </>
                : <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", background: "#0a0f1e", borderRadius: 16, border: "1px solid #1e293b" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>
                      {activeAccount === "all" ? "등록된 계좌가 없어요" : "아직 포트폴리오 등록이 되지 않았습니다."}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      {activeAccount === "all" ? "관리자 로그인 후 업로드해주세요" : `${accounts.find(a=>a.id===activeAccount)?.name} 계좌를 준비 중이에요`}
                    </div>
                  </div>
              }
            </>
          )}

          {/* ✅ 수정: 매수/매도 기록 탭 */}
          {activeTab === "history" && (
            <>
              {/* 조회 기간 */}
              {allRecords.length > 0 && (
                <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>📅 조회 기간 설정</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[
                      { label: "오늘", action: () => { setStartDate(maxDate); setEndDate(maxDate); setDateError(""); } },
                      { label: "1주", action: () => { const d = new Date(maxDate); d.setDate(d.getDate() - 6); setStartDate(d.toISOString().split("T")[0]); setEndDate(maxDate); setDateError(""); }},
                      { label: "1달", action: () => { const d = new Date(maxDate); d.setMonth(d.getMonth() - 1); setStartDate(d.toISOString().split("T")[0]); setEndDate(maxDate); setDateError(""); }},
                      { label: "전체", action: () => { setStartDate(""); setEndDate(""); setDateError(""); } },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.action} style={{ ...S.btnSub, padding: "5px 12px", fontSize: 12 }}>{btn.label}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <span style={{ fontSize: 10, color: "#475569" }}>시작일</span>
                      <input type="date" value={startDate}
                        onChange={e => { const v = e.target.value; if (endDate && v > endDate) setDateError("시작일이 종료일보다 빠를 수 없습니다."); else { setDateError(""); setStartDate(v); } }}
                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "6px 10px", fontSize: 13, outline: "none" }} />
                    </div>
                    <div style={{ color: "#475569", paddingBottom: 8 }}>~</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <span style={{ fontSize: 10, color: "#475569" }}>종료일</span>
                      <input type="date" value={endDate}
                        onChange={e => { const v = e.target.value; if (startDate && v < startDate) setDateError("시작일이 종료일보다 빠를 수 없습니다."); else { setDateError(""); setEndDate(v); } }}
                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "6px 10px", fontSize: 13, outline: "none" }} />
                    </div>
                  </div>
                  {dateError && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 6 }}>⚠️ {dateError}</div>}
                  {(startDate || endDate) && !dateError && <div style={{ fontSize: 11, color: "#6366f1", marginTop: 6 }}>📌 {startDate || minDate} ~ {endDate || maxDate} 조회 중</div>}
                </div>
              )}

              {/* ✅ 수정: 매수/매도 서브탭 */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={() => setHistorySubTab("buy")}
                  style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                    background: historySubTab === "buy" ? "#2d1515" : "#111827",
                    borderColor: historySubTab === "buy" ? "#ef4444" : "#1e293b",
                    color: historySubTab === "buy" ? "#ef4444" : "#64748b",
                  }}>
                  🔴 매수 기록
                </button>
                <button onClick={() => setHistorySubTab("sell")}
                  style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                    background: historySubTab === "sell" ? "#151d2d" : "#111827",
                    borderColor: historySubTab === "sell" ? "#3b82f6" : "#1e293b",
                    color: historySubTab === "sell" ? "#3b82f6" : "#64748b",
                  }}>
                  🔵 매도 기록
                </button>
              </div>

              {/* 파이 차트 */}
              <DonutChart
                data={historySubTab === "buy" ? buyPieData : sellPieData}
                title={historySubTab === "buy" ? "📊 매수 비중 (투자금 기준)" : "📊 매도 비중 (매도금 기준)"}
                labelName="종목명"
                labelPct={historySubTab === "buy" ? "매수비중" : "매도비중"}
                labelAvg={historySubTab === "buy" ? "매수평단" : "매도평단"}
              />
              {/* 🔓 총 금액 배지 */}
              {showWealth && (() => {
                const totalBuy = buyPieData.reduce((s, d) => s + d.value, 0);
                const totalSell = sellPieData.reduce((s, d) => s + d.value, 0);
                return (
                  <div style={{ background: "#0f1f0f", border: "1px solid #166534", borderRadius: 12, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>🔓 총 {historySubTab === "buy" ? "매수" : "매도"}금액</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#22c55e" }}>
                      {(historySubTab === "buy" ? totalBuy : totalSell).toLocaleString()}원
                    </span>
                  </div>
                );
              })()}

              {/* 데이터 없을 때 */}
              {allRecords.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 14 }}>아직 저장된 매매기록이 없어요</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>관리자 로그인 후 이미지를 업로드해주세요</div>
                </div>
              )}

              {allRecords.length > 0 && displayStocks.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: 14 }}>
                  선택한 기간에 {historySubTab === "buy" ? "매수" : "매도"} 기록이 없어요
                </div>
              )}

              {/* 종목 카드 */}
              {displayStocks.map((stock, i) => {
                const trades = stock.trades.filter(t => t.type === (historySubTab === "buy" ? "매수" : "매도"));
                const totalVal = historySubTab === "buy" ? buyPieData.reduce((s, d) => s + d.value, 0) : sellPieData.reduce((s, d) => s + d.value, 0);
                const myVal = historySubTab === "buy" ? (buyPieData.find(s => s.ticker === stock.ticker)?.value || 0) : (sellPieData.find(s => s.ticker === stock.ticker)?.value || 0);
                const pct = totalVal ? Math.round(myVal / totalVal * 1000) / 10 : 0;
                const avgPrice = historySubTab === "buy" ? stock.avgBuyPrice : sellPieData.find(s => s.ticker === stock.ticker)?.avgPrice;
                return (
                  <div key={i} style={S.stockCard}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>종목명</div>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{stock.ticker}</span>
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>{historySubTab === "buy" ? "매수비중" : "매도비중"}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: historySubTab === "buy" ? "#ef4444" : "#3b82f6" }}>{Number(pct).toFixed(1)}%</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>{historySubTab === "buy" ? "매수평단" : "매도평단"}</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{avgPrice?.toLocaleString()}원</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                      {(() => {
                        // 날짜별 합산: 같은 날 거래는 가중평균 단가로 묶기
                        const byDate = trades.reduce((acc, t) => {
                          if (!acc[t.date]) acc[t.date] = { date: t.date, type: t.type, totalAmt: 0, totalQty: 0 };
                          acc[t.date].totalAmt += t.price * t.quantity;
                          acc[t.date].totalQty += t.quantity;
                          return acc;
                        }, {});
                        return Object.values(byDate).map((g, j) => {
                          const avgP = Math.round(g.totalAmt / g.totalQty);
                          return (
                            <div key={j} style={{ display: "flex", gap: 8, fontSize: 12, alignItems: "center" }}>
                              <span style={{ color: "#475569", minWidth: 76 }}>{g.date}</span>
                              <span style={{ fontWeight: 700, color: g.type === "매수" ? "#ef4444" : "#3b82f6", minWidth: 24 }}>{g.type}</span>
                              <span style={{ color: "#94a3b8", flex: 1 }}>평단 {avgP?.toLocaleString()}원</span>
                              {showWealth && <span style={{ color: "#22c55e", fontWeight: 600 }}>{g.totalQty}주 · {g.totalAmt?.toLocaleString()}원</span>}
                            </div>
                          );
                        });
                      })()}
                    </div>
                    {stock.insight && <div style={S.insight}>{stock.insight}</div>}
                  </div>
                );
              })}

              {allRecords.length > 0 && historySubTab === "buy" && (
                <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: 16, marginTop: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>공유 텍스트</div>
                  <pre style={{ background: "#0a0f1e", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#94a3b8", whiteSpace: "pre-wrap", marginBottom: 10, border: "1px solid #1e293b", fontFamily: "monospace" }}>{shareText()}</pre>
                  <button style={S.btnMain} onClick={() => { navigator.clipboard.writeText(shareText()).then(() => { setShareMsg("✅ 복사됐어요!"); setTimeout(() => setShareMsg(""), 2500); }); }}>📋 텍스트 복사</button>
                  {shareMsg && <p style={{ color: "#4ade80", fontSize: 13, marginTop: 8 }}>{shareMsg}</p>}
                </div>
              )}
            </>
          )}
        </>
      )}

      {!isViewer && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{mainText.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", marginBottom: 4 }}>{mainText.title}</div>
          <div style={{ fontSize: 20, color: "#f59e0b", fontWeight: 900, marginBottom: 24, lineHeight: 1.7 }}>
            {mainText.subtitle.split("\n").map((line, i) => <span key={i}>{line}{i < mainText.subtitle.split("\n").length - 1 && <br/>}</span>)}
          </div>
          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 24, maxWidth: 320, margin: "0 auto" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📋 조회 코드 입력</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>포트폴리오 및 매매 평단 리스트</div>
            <input style={{ ...S.pinInput, marginBottom: 12 }} type="password" inputMode="numeric" maxLength={6} placeholder="코드 입력"
              value={viewerPinInput} onChange={e => setViewerPinInput(e.target.value)} onKeyDown={e => e.key === "Enter" && checkViewerPin()} />
            {viewerPinError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{viewerPinError}</div>}
            <button style={{ ...S.btnMain, width: "100%" }} onClick={checkViewerPin}>입장하기</button>
          </div>
          <div style={{ marginTop: 40, fontSize: 11, color: "#334155" }}>관리자는 우측 상단 버튼을 이용하세요</div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: "20px 14px 60px", maxWidth: 720, margin: "0 auto" },
  header: { textAlign: "center", marginBottom: 20 },
  logoRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  logoText: { fontSize: 22, fontWeight: 700, background: "linear-gradient(90deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  verBadge: { background: "#1e293b", color: "#64748b", border: "1px solid #334155", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 600 },
  loginTag: { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" },
  adminTag: { background: "#1e3a5f", color: "#60a5fa", border: "1px solid #3b82f6", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" },
  sub: { color: "#64748b", fontSize: 13, margin: 0 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 24, width: 260, textAlign: "center" },
  pinInput: { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", fontSize: 20, padding: "10px", textAlign: "center", outline: "none", boxSizing: "border-box", letterSpacing: 8 },
  drop: { border: "2px dashed #1e293b", borderRadius: 14, padding: "24px 16px", textAlign: "center", cursor: "pointer", marginBottom: 12, background: "#0f172a" },
  dropOn: { borderColor: "#3b82f6", background: "#0f1f3a" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8, marginBottom: 12 },
  card: { background: "#111827", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" },
  thumb: { width: "100%", height: 100, objectFit: "cover", display: "block" },
  xBtn: { position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 9 },
  stockCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 8 },
  insight: { marginTop: 8, padding: "6px 10px", background: "#0f172a", borderRadius: 6, fontSize: 11, color: "#64748b", borderLeft: "2px solid #6366f1" },
  btnMain: { background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnSub: { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontSize: 13, cursor: "pointer" },
  btnDanger: { background: "#2d1f1f", color: "#ef4444", border: "1px solid #7f1d1d", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};
