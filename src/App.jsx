import { useState, useRef, useCallback, useEffect } from "react";

const ADMIN_PIN = "4254";
const VIEWER_PIN = "2026";
const VERSION = "v2.3";

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const scale = img.width > MAX ? MAX / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const COLORS = ["#06b6d4","#3b82f6","#a78bfa","#22c55e","#f59e0b","#ef4444","#ec4899","#84cc16","#f97316","#8b5cf6","#14b8a6","#f43f5e","#6366f1","#eab308","#10b981"];

function DonutChart({ data, title, centerText }) {
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
    return { ...d, path, color: COLORS[i % COLORS.length], pct: Math.round(pct * 100) };
  });

  return (
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 16, marginBottom: 12 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>{title}</div>}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <svg viewBox="0 0 100 100" style={{ width: 130, height: 130, flexShrink: 0 }}>
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
          {centerText && (
            <>
              <text x="50" y="47" textAnchor="middle" fill="#e2e8f0" fontSize="6" fontWeight="700">{centerText.line1}</text>
              <text x="50" y="56" textAnchor="middle" fill="#94a3b8" fontSize="5">{centerText.line2}</text>
            </>
          )}
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid #1e293b" }}>
            <span style={{ flex: 2, fontSize: 10, color: "#475569" }}>종목명</span>
            <span style={{ flex: 1, fontSize: 10, color: "#475569", textAlign: "center" }}>비중</span>
            <span style={{ flex: 1, fontSize: 10, color: "#475569", textAlign: "right" }}>평단</span>
          </div>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 2 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 11 }}>{s.ticker}</span>
              </div>
              <span style={{ flex: 1, color: s.color, fontWeight: 700, textAlign: "center" }}>{s.pct}%</span>
              <span style={{ flex: 1, color: "#94a3b8", textAlign: "right", fontSize: 11 }}>{s.avgPrice?.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PortfolioChart({ data, isAdmin }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const R = 40, r = 22, cx = 50, cy = 50;
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
    const ret = d.avgBuy ? ((d.current - d.avgBuy) / d.avgBuy * 100) : null;
    return { ...d, path, color: COLORS[i % COLORS.length], pct: Math.round(pct * 100), ret };
  });

  return (
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>📊 현재 포트폴리오</div>

      {/* 도넛 + 숏 서머리 */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <svg viewBox="0 0 100 100" style={{ width: 140, height: 140, flexShrink: 0 }}>
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
          <text x="50" y="48" textAnchor="middle" fill="#94a3b8" fontSize="6">포트폴리오</text>
          <text x="50" y="57" textAnchor="middle" fill="#e2e8f0" fontSize="6" fontWeight="700">{slices.length}종목</text>
        </svg>
        <div style={{ flex: 1 }}>
          {(() => {
            const MAX = 19;
            const shown = slices.slice(0, MAX);
            const rest = slices.slice(MAX);
            const restPct = rest.reduce((sum, r) => sum + r.pct, 0);
            const all = [...shown, ...(rest.length > 0 ? [{ ticker: `기타 ${rest.length}종목`, pct: restPct, color: "#475569", isEtc: true }] : [])];
            const half = Math.ceil(all.length / 2);
            const col1 = all.slice(0, half);
            const col2 = all.slice(half);
            return (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  {col1.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: s.isEtc ? "#64748b" : "#e2e8f0", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.ticker}</span>
                      <span style={{ fontSize: 10, color: s.isEtc ? "#64748b" : "#94a3b8", fontWeight: 700, flexShrink: 0 }}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  {col2.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: s.isEtc ? "#64748b" : "#e2e8f0", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.ticker}</span>
                      <span style={{ fontSize: 10, color: s.isEtc ? "#64748b" : "#94a3b8", fontWeight: 700, flexShrink: 0 }}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 종목 테이블 */}
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
        {/* 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.7fr 0.7fr 1.4fr", background: "#0f172a", padding: "8px 12px", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#475569" }}>종목명</span>
          <span style={{ fontSize: 10, color: "#475569", textAlign: "center" }}>비중</span>
          <span style={{ fontSize: 10, color: "#475569", textAlign: "center" }}>수익률</span>
          <span style={{ fontSize: 10, color: "#475569", textAlign: "right" }}>평단 / 현재가</span>
        </div>
        {/* 행 */}
        {slices.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.8fr 0.7fr 0.7fr 1.4fr", padding: "9px 12px", gap: 4, alignItems: "center", borderTop: "1px solid #1e293b", background: i % 2 === 0 ? "#111827" : "#0f172a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 12 }}>{s.ticker}</span>
            </div>
            <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 12, textAlign: "center" }}>{s.pct}%</span>
            <span style={{ fontSize: 12, textAlign: "center", fontWeight: 700,
              color: s.ret === null ? "#64748b" : s.ret >= 0 ? "#ef4444" : "#3b82f6" }}>
              {s.ret !== null ? (s.ret >= 0 ? "+" : "") + s.ret.toFixed(1) + "%" : "-"}
            </span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>{s.avgBuy?.toLocaleString()}원</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{s.current?.toLocaleString()}원</div>
            </div>
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
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [activeTab, setActiveTab] = useState("buy");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const portfolioRef = useRef(null);

  useEffect(() => {
    fetch("/api/load").then(r => r.json()).then(d => {
      if (d.records) setAllRecords(d.records);
      if (d.portfolio) setPortfolio(d.portfolio);
    }).catch(() => {});
  }, []);

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
        const base64 = await compressImage(item.file);
        const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: base64 }) });
        const result = await res.json();
        if (result.error) throw new Error(result.error);
        setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: false, result } : i));
      } catch(e) {
        setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: false, error: e.message } : i));
      }
    }
  }, [isAdmin]);

  async function analyzePortfolio(file) {
    setPortfolioLoading(true);
    try {
      const base64 = await compressImage(file);
      const res = await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: base64 }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPortfolio(data);
      // Save portfolio
      const updated = { records: allRecords, portfolio: data };
      await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
      alert("✅ 포트폴리오 저장 완료!");
    } catch(e) {
      alert("오류: " + e.message);
    }
    setPortfolioLoading(false);
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
      await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: updated, portfolio }) });
      setAllRecords(updated);
      setImages([]);
      alert("✅ 저장 완료!");
    } catch(e) { alert("저장 실패: " + e.message); }
    setMerging(false);
  }

  async function clearAll() {
    if (!window.confirm("전체 기록을 삭제할까요?")) return;
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: [], portfolio: null }) });
    setAllRecords([]); setPortfolio(null);
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
  const displayStocks = activeTab === "buy" ? buyStocks : sellStocks;

  const allDone = images.length > 0 && images.every(i => !i.loading);
  const ps = v => v > 0 ? "+" : "";

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

      <div style={S.header}>
        <div style={S.logoRow}>
          <span style={{ fontSize: 24 }}>🐜</span>
          <span style={S.logoText}>존버일기장</span>
          <span style={S.verBadge}>{VERSION}</span>
          {isAdmin ? <button style={S.adminTag} onClick={() => { setIsAdmin(false); setIsViewer(false); }}>관리자 ✕</button>
            : isViewer ? <button style={S.adminTag} onClick={() => setIsViewer(false)}>조회중 ✕</button>
            : <button style={S.loginTag} onClick={() => setShowPin(true)}>관리자</button>}
        </div>
        <p style={S.sub}>{isAdmin ? "📤 이미지 올려서 분석 후 저장" : isViewer ? "📊 존버 매매기록 조회 중" : ""}</p>
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

          {/* 포트폴리오 이미지 업로드 */}
          <input ref={portfolioRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { if (e.target.files[0]) { analyzePortfolio(e.target.files[0]); e.target.value = ""; } }} />
          <button
            style={{ width: "100%", background: "#111827", border: "1px dashed #334155", borderRadius: 12, padding: 14, marginBottom: 12, cursor: "pointer", textAlign: "center", color: "#e2e8f0" }}
            onClick={() => portfolioRef.current?.click()}
            disabled={portfolioLoading}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              {portfolioLoading ? "⏳ 포트폴리오 분석 중…" : "📈 현재 포트폴리오 이미지 업로드"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>증권앱 보유종목 화면 캡처 업로드</div>
          </button>

          {allRecords.length > 0 && (
            <button style={{ ...S.btnDanger, width: "100%", marginBottom: 16 }} onClick={clearAll}>🗑️ 전체 기록 삭제</button>
          )}
        </>
      )}

      {isViewer && (
        <>
          {/* 탭 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[
              { key: "buy", label: `매수 ${buyStocks.length}종목` },
              { key: "sell", label: `매도 ${sellStocks.length}종목` },
              { key: "portfolio", label: "현재 포트폴리오" },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ flex: 1, padding: "8px 4px", fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "1px solid",
                  background: activeTab === t.key ? (t.key === "buy" ? "#2a1a1a" : t.key === "sell" ? "#1a1a2a" : "#1a2a1a") : "#111827",
                  borderColor: activeTab === t.key ? (t.key === "buy" ? "#ef4444" : t.key === "sell" ? "#3b82f6" : "#22c55e") : "#1e293b",
                  color: activeTab === t.key ? (t.key === "buy" ? "#ef4444" : t.key === "sell" ? "#3b82f6" : "#22c55e") : "#64748b",
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* 조회기간 - 매수/매도탭만 */}
          {(activeTab === "buy" || activeTab === "sell") && allRecords.length > 0 && (
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

          {/* 포트폴리오 탭 */}
          {activeTab === "portfolio" && (
            portfolio
              ? <PortfolioChart isAdmin={isAdmin} data={portfolio.stocks?.map(s => ({ ticker: s.ticker, value: s.currentValue, avgBuy: s.avgBuyPrice, current: s.currentPrice, qty: s.quantity }))} />
              : <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
                  <div style={{ fontSize: 14 }}>포트폴리오 이미지를 업로드해주세요</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>관리자 로그인 후 업로드 가능</div>
                </div>
          )}

          {/* 매수/매도 탭 내용 */}
          {(activeTab === "buy" || activeTab === "sell") && (
            <>
              <DonutChart
                data={activeTab === "buy" ? buyPieData : sellPieData}
                title={activeTab === "buy" ? "📊 매수 비중 (투자금 기준)" : "📊 매도 비중 (매도금 기준)"}
              />
              {displayStocks.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: 14 }}>선택한 기간에 {activeTab === "buy" ? "매수" : "매도"} 기록이 없어요</div>
              )}
              {displayStocks.map((stock, i) => {
                const trades = stock.trades.filter(t => t.type === (activeTab === "buy" ? "매수" : "매도"));
                const totalVal = activeTab === "buy" ? buyPieData.reduce((s, d) => s + d.value, 0) : sellPieData.reduce((s, d) => s + d.value, 0);
                const myVal = activeTab === "buy" ? (buyPieData.find(s => s.ticker === stock.ticker)?.value || 0) : (sellPieData.find(s => s.ticker === stock.ticker)?.value || 0);
                const pct = totalVal ? Math.round(myVal / totalVal * 100) : 0;
                const avgPrice = activeTab === "buy" ? stock.avgBuyPrice : sellPieData.find(s => s.ticker === stock.ticker)?.avgPrice;
                return (
                  <div key={i} style={S.stockCard}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>종목명</div>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{stock.ticker}</span>
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>비중</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: activeTab === "buy" ? "#ef4444" : "#3b82f6" }}>{pct}%</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>평단</div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{avgPrice?.toLocaleString()}원</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                        {trades.map((t, j) => (
                          <div key={j} style={{ display: "flex", gap: 8, fontSize: 12, alignItems: "center" }}>
                            <span style={{ color: "#475569", minWidth: 76 }}>{t.date}</span>
                            <span style={{ fontWeight: 700, color: t.type === "매수" ? "#ef4444" : "#3b82f6", minWidth: 24 }}>{t.type}</span>
                            {isAdmin
                              ? <span style={{ color: "#94a3b8", flex: 1 }}>{t.price?.toLocaleString()}원×{t.quantity}주</span>
                              : <span style={{ color: "#94a3b8", flex: 1 }}>{t.price?.toLocaleString()}원</span>
                            }
                            <span style={{ fontWeight: 600 }}>{t.total?.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    {stock.insight && <div style={S.insight}>{stock.insight}</div>}
                  </div>
                );
              })}

              {allRecords.length > 0 && activeTab === "buy" && (
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
          <div style={{ fontSize: 64, marginBottom: 8 }}>🐜</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", marginBottom: 4 }}>존버일기장</div>
          <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700, marginBottom: 24, lineHeight: 1.6 }}>
            존버는 승리한다.<br/>왜냐하면 승리하기 때문이다.
          </div>
          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 24, maxWidth: 320, margin: "0 auto" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📋 조회 코드 입력</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>지인 공유용 코드를 입력하세요</div>
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
