import { useState, useRef, useCallback, useEffect } from "react";

const ADMIN_PIN = "4254";
const VIEWER_PIN = "2026";
const VERSION = "v1.2";

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

function PieChart({ data, title }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  const COLORS = ["#3b82f6","#a78bfa","#22c55e","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16","#f97316","#8b5cf6"];
  let cumulative = 0;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const start = cumulative;
    cumulative += pct;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = 50 + 40 * Math.cos(startAngle);
    const y1 = 50 + 40 * Math.sin(startAngle);
    const x2 = 50 + 40 * Math.cos(endAngle);
    const y2 = 50 + 40 * Math.sin(endAngle);
    const large = pct > 0.5 ? 1 : 0;
    return { ...d, path: `M50,50 L${x1},${y1} A40,40 0 ${large},1 ${x2},${y2} Z`, color: COLORS[i % COLORS.length], pct: Math.round(pct * 100) };
  });
  return (
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <svg viewBox="0 0 100 100" style={{ width: 100, height: 100, flexShrink: 0 }}>
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
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
                <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{s.ticker}</span>
              </div>
              <span style={{ flex: 1, color: s.color, fontWeight: 700, textAlign: "center" }}>{s.pct}%</span>
              <span style={{ flex: 1, color: "#94a3b8", textAlign: "right" }}>{s.avgPrice?.toLocaleString()}원</span>
            </div>
          ))}
        </div>
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
  const [images, setImages] = useState([]);
  const [allRecords, setAllRecords] = useState([]); // [{date, result}]
  const [merging, setMerging] = useState(false);
  const [activeTab, setActiveTab] = useState("buy");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [viewerPinInput, setViewerPinInput] = useState("");
  const [viewerPinError, setViewerPinError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch("/api/load").then(r => r.json()).then(d => {
      if (d.records) setAllRecords(d.records);
    }).catch(() => {});
  }, []);

  function checkViewerPin() {
    if (viewerPinInput === VIEWER_PIN) { setIsViewer(true); setViewerPinInput(""); setViewerPinError(""); }
    else { setViewerPinError("코드가 틀렸습니다."); setViewerPinInput(""); }
  }

  function checkPin() {
    if (pinInput === ADMIN_PIN) { setIsAdmin(true); setIsViewer(true); setShowPin(false); setPinInput(""); setPinError(""); }
    else if (pinInput === VIEWER_PIN) { setIsViewer(true); setShowPin(false); setPinInput(""); setPinError(""); }
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
      await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: updated }) });
      setAllRecords(updated);
      setImages([]);
      alert("✅ 저장 완료! 지인들도 바로 볼 수 있어요.");
    } catch(e) { alert("저장 실패: " + e.message); }
    setMerging(false);
  }

  async function clearAll() {
    if (!window.confirm("전체 기록을 삭제할까요?")) return;
    await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: [] }) });
    setAllRecords([]);
  }

  // 전체 거래에서 날짜 범위 추출
  const allTradesFlat = allRecords.flatMap(r => r.result?.stocks || []).flatMap(s => s.trades || []);
  const tradeDates = [...new Set(allTradesFlat.map(t => t.date))].sort();
  const minDate = tradeDates[0] || "";
  const maxDate = tradeDates[tradeDates.length - 1] || "";

  // 날짜 범위 필터링
  const isInRange = (date) => {
    if (!startDate && !endDate) return true;
    if (startDate && endDate) return date >= startDate && date <= endDate;
    if (startDate) return date >= startDate;
    if (endDate) return date <= endDate;
    return true;
  };

  // 모든 기록에서 날짜 범위에 맞는 거래만 필터링해서 종목별 합산
  const allStocks = allRecords.flatMap(r => r.result?.stocks || []);
  const mergedStocks = Object.values(allStocks.reduce((acc, s) => {
    const filteredTrades = s.trades.filter(t => isInRange(t.date));
    if (filteredTrades.length === 0) return acc;
    if (!acc[s.ticker]) {
      acc[s.ticker] = { ...s, trades: [...filteredTrades] };
    } else {
      acc[s.ticker].trades = [...acc[s.ticker].trades, ...filteredTrades];
    }
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

  const buyStocks = mergedStocks.filter(s => s.trades.some(t => t.type === "매수"));
  const sellStocks = mergedStocks.filter(s => s.trades.some(t => t.type === "매도"));

  const buyPieData = buyStocks.map(s => ({ ticker: s.ticker, value: s.totalInvested || 0, avgPrice: s.avgBuyPrice }));
  const sellPieData = sellStocks.map(s => ({ ticker: s.ticker, value: s.totalSold || 0, avgPrice: Math.round((s.trades.filter(t=>t.type==="매도").reduce((a,t)=>a+t.price*t.quantity,0))/(s.trades.filter(t=>t.type==="매도").reduce((a,t)=>a+t.quantity,0)||1)) }));

  const allDone = images.length > 0 && images.every(i => !i.loading);
  const ps = v => v > 0 ? "+" : "";
  const pc = v => v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#94a3b8";

  function shareText() {
    const lines = ["📊 내 주식 매매기록\n"];
    mergedStocks.forEach(s => {
      lines.push(`▶ ${s.ticker} | 평균 ${s.avgBuyPrice?.toLocaleString()}원 | ${s.currentHolding}주 보유`);
      s.trades.forEach(t => lines.push(`  ${t.date} ${t.type} ${t.price?.toLocaleString()}원×${t.quantity}주`));
    });
    lines.push("\n#주식 #매매기록 #포트폴리오");
    return lines.join("\n");
  }

  const displayStocks = activeTab === "buy" ? buyStocks : sellStocks;

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
          <span style={{ fontSize: 24 }}>📸</span>
          <span style={S.logoText}>존버일기장</span>
          <span style={S.verBadge}>{VERSION}</span>
          {isAdmin ? <button style={S.adminTag} onClick={() => { setIsAdmin(false); setIsViewer(false); }}>관리자 ✕</button>
            : isViewer ? <button style={S.adminTag} onClick={() => { setIsViewer(false); }}>조회중 ✕</button>
            : <button style={S.loginTag} onClick={() => setShowPin(true)}>코드 입력</button>}
        </div>
        <p style={S.sub}>{isAdmin ? "📤 이미지 올려서 분석 후 저장" : isViewer ? "📊 존버 매매기록 조회 중" : ""}</p>
      </div>

      {isAdmin && isViewer && (
        <>
          <div style={{ ...S.drop, ...(dragOver ? S.dropOn : {}) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
            <div style={{ fontSize: 32, marginBottom: 6 }}>📱</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>캡처 이미지 업로드</div>
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
              {merging ? "저장 중…" : "💾 저장하기 (지인 공개)"}
            </button>
          )}
          {isViewer && allRecords.length > 0 && (
            <button style={{ ...S.btnDanger, width: "100%", marginBottom: 16 }} onClick={clearAll}>🗑️ 전체 기록 삭제</button>
          )}
        </>
      )}

      {isViewer && allRecords.length > 0 && (
        <>
          {/* 날짜 범위 필터 */}
          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>📅 조회 기간 설정</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <span style={{ fontSize: 10, color: "#475569" }}>시작일</span>
                <input type="date" value={startDate} min={minDate} max={endDate || maxDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "6px 10px", fontSize: 13, outline: "none" }} />
              </div>
              <div style={{ color: "#475569", marginTop: 16 }}>~</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <span style={{ fontSize: 10, color: "#475569" }}>종료일</span>
                <input type="date" value={endDate} min={startDate || minDate} max={maxDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "6px 10px", fontSize: 13, outline: "none" }} />
              </div>
              <button onClick={() => { setStartDate(""); setEndDate(""); }}
                style={{ ...S.btnSub, marginTop: 16, padding: "6px 12px", fontSize: 12 }}>
                전체
              </button>
            </div>
            {(startDate || endDate) && (
              <div style={{ fontSize: 11, color: "#6366f1", marginTop: 8 }}>
                📌 {startDate || minDate} ~ {endDate || maxDate} 기간 조회 중
              </div>
            )}
          </div>

          {/* 매수/매도 탭 */}
          <div style={S.tabs}>
            <button style={{ ...S.tab, ...(activeTab === "buy" ? S.tabBuy : {}) }} onClick={() => setActiveTab("buy")}>
              매수 {buyStocks.length}종목
            </button>
            <button style={{ ...S.tab, ...(activeTab === "sell" ? S.tabSell : {}) }} onClick={() => setActiveTab("sell")}>
              매도 {sellStocks.length}종목
            </button>
          </div>

          {/* 파이차트 */}
          <PieChart
            data={activeTab === "buy" ? buyPieData : sellPieData}
            title={activeTab === "buy" ? "📊 매수 비중 (투자금 기준)" : "📊 매도 비중 (매도금 기준)"}
          />

          {/* 종목 리스트 */}
          {displayStocks.map((stock, i) => {
            const trades = stock.trades.filter(t => t.type === (activeTab === "buy" ? "매수" : "매도"));
            const totalVal = activeTab === "buy"
              ? buyPieData.reduce((s, d) => s + d.value, 0)
              : sellPieData.reduce((s, d) => s + d.value, 0);
            const myVal = activeTab === "buy"
              ? (buyPieData.find(s => s.ticker === stock.ticker)?.value || 0)
              : (sellPieData.find(s => s.ticker === stock.ticker)?.value || 0);
            const pct = totalVal ? Math.round(myVal / totalVal * 100) : 0;
            const avgPrice = activeTab === "buy"
              ? stock.avgBuyPrice
              : sellPieData.find(s => s.ticker === stock.ticker)?.avgPrice;
            return (
              <div key={i} style={S.stockCard}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 0 }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>종목명</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{stock.ticker}</span>
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, fontWeight: 600,
                        background: activeTab === "buy" ? "#1a2a4a" : "#2a1a2a",
                        color: activeTab === "buy" ? "#ef4444" : "#3b82f6" }}>
                        {activeTab === "buy" ? `${stock.currentHolding}주` : "매도"}
                      </span>
                    </div>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {trades.map((t, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, fontSize: 12, alignItems: "center" }}>
                      <span style={{ color: "#475569", minWidth: 76 }}>{t.date}</span>
                      <span style={{ fontWeight: 700, color: t.type === "매수" ? "#ef4444" : "#3b82f6", minWidth: 24 }}>{t.type}</span>
                      <span style={{ color: "#94a3b8" }}>{t.price?.toLocaleString()}원 × {t.quantity}주</span>
                      <span style={{ marginLeft: "auto", fontWeight: 600, color: "#e2e8f0" }}>{t.total?.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
                {stock.insight && <div style={S.insight}>{stock.insight}</div>}
              </div>
            );
          })}

          {/* 공유 */}
          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: 16, marginTop: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>공유 텍스트</div>
            <pre style={{ background: "#0a0f1e", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#94a3b8", whiteSpace: "pre-wrap", marginBottom: 10, border: "1px solid #1e293b", fontFamily: "monospace" }}>{shareText()}</pre>
            <button style={S.btnMain} onClick={() => { navigator.clipboard.writeText(shareText()).then(() => { setShareMsg("✅ 복사됐어요!"); setTimeout(() => setShareMsg(""), 2500); }); }}>📋 텍스트 복사</button>
            {shareMsg && <p style={{ color: "#4ade80", fontSize: 13, marginTop: 8 }}>{shareMsg}</p>}
          </div>
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
            <input
              style={{ ...S.pinInput, marginBottom: 12 }}
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="코드 입력"
              value={viewerPinInput}
              onChange={e => setViewerPinInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && checkViewerPin()}
            />
            {viewerPinError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{viewerPinError}</div>}
            <button style={{ ...S.btnMain, width: "100%" }} onClick={checkViewerPin}>입장하기</button>
          </div>
          <div style={{ marginTop: 40, fontSize: 11, color: "#334155" }}>관리자는 우측 상단 버튼을 이용하세요</div>
        </div>
      )}
      {isViewer && allRecords.length === 0 && !isAdmin && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>아직 등록된 매매기록이 없어요</div>
          <div style={{ fontSize: 14, color: "#64748b" }}>관리자가 기록을 업로드하면 여기서 확인할 수 있어요</div>
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
  tabs: { display: "flex", gap: 8, marginBottom: 12 },
  tab: { flex: 1, background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#64748b", padding: "8px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  tabBuy: { background: "#2a1a1a", borderColor: "#ef4444", color: "#ef4444" },
  tabSell: { background: "#1a1a2a", borderColor: "#3b82f6", color: "#3b82f6" },
  dateBtn: { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#64748b", padding: "6px 12px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" },
  dateBtnOn: { background: "#1e293b", borderColor: "#6366f1", color: "#a78bfa" },
  stockCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 8 },
  insight: { marginTop: 8, padding: "6px 10px", background: "#0f172a", borderRadius: 6, fontSize: 11, color: "#64748b", borderLeft: "2px solid #6366f1" },
  btnMain: { background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnSub: { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontSize: 13, cursor: "pointer" },
  btnDanger: { background: "#2d1f1f", color: "#ef4444", border: "1px solid #7f1d1d", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};
