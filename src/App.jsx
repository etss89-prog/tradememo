import { useState, useRef, useCallback, useEffect } from "react";

const ADMIN_PIN = "1234";
const STORAGE_KEY = "tradememo_results";
const VERSION = "v8";

const SYSTEM_PROMPT = `당신은 주식 매매내역 이미지 분석 전문가입니다.
이미지에서 날짜, 종목명, 매수/매도 구분, 체결수량, 체결단가를 모두 추출하세요.
순수 JSON만 반환하고 마크다운 없이 출력하세요.

{
  "summary": "전체 거래 요약",
  "stocks": [
    {
      "ticker": "종목명",
      "trades": [
        { "date": "YYYY-MM-DD", "type": "매수 또는 매도", "price": 숫자, "quantity": 숫자, "total": 숫자 }
      ],
      "avgBuyPrice": 숫자,
      "currentHolding": 숫자,
      "totalInvested": 숫자,
      "totalSold": 숫자,
      "realizedPnL": 숫자,
      "insight": "한 줄 인사이트"
    }
  ],
  "totalStats": {
    "totalInvested": 숫자,
    "totalRealized": 숫자,
    "tradeCount": 숫자,
    "stockCount": 숫자
  }
}`;

// 이미지를 800px로 압축해서 base64 반환
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

async function analyzeImage(base64) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function mergeResults(results) {
  const res = await fetch("/api/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results }),
  });
  const data = await res.json();
  return data;
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [images, setImages] = useState([]);
  const [savedResult, setSavedResult] = useState(null);
  const [mergedResult, setMergedResult] = useState(null);
  const [merging, setMerging] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setSavedResult(JSON.parse(s));
    } catch {}
  }, []);

  function checkPin() {
    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true); setShowPin(false); setPinInput(""); setPinError("");
    } else {
      setPinError("PIN이 틀렸습니다."); setPinInput("");
    }
  }

  const addFiles = useCallback(async (files) => {
    if (!isAdmin) return;
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;

    const items = valid.map(f => ({
      id: Date.now() + Math.random(),
      preview: URL.createObjectURL(f),
      file: f,
      result: null, loading: false, error: null,
    }));
    setImages(prev => [...prev, ...items]);
    setMergedResult(null);

    for (const item of items) {
      setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: true } : i));
      try {
        const base64 = await compressImage(item.file);
        const result = await analyzeImage(base64);
        setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: false, result } : i));
      } catch(e) {
        setImages(prev => prev.map(i => i.id === item.id ? { ...i, loading: false, error: "인식 실패: " + e.message } : i));
      }
    }
  }, [isAdmin]);

  async function saveResult() {
    const valid = images.filter(i => i.result).map(i => i.result);
    if (!valid.length) return;
    let final = valid[0];
    if (valid.length > 1) {
      setMerging(true);
      try { final = await mergeResults(valid); } catch {}
      setMerging(false);
    }
    setMergedResult(final);
    setSavedResult(final);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
    alert("✅ 저장 완료!");
  }

  function clearAll() {
    if (!window.confirm("저장된 기록을 삭제할까요?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setSavedResult(null); setMergedResult(null); setImages([]);
  }

  const display = mergedResult || savedResult;
  const allDone = images.length > 0 && images.every(i => !i.loading);
  const pc = (v) => v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#94a3b8";
  const ps = (v) => v > 0 ? "+" : "";
  const filtered = display?.stocks?.filter(s =>
    activeTab === "all" ? true : activeTab === "holding" ? s.currentHolding > 0 : s.currentHolding === 0
  );

  function shareText() {
    if (!display) return "";
    const lines = ["📊 내 주식 매매기록\n"];
    display.stocks?.forEach(s => {
      lines.push(`▶ ${s.ticker}`);
      lines.push(`  평균단가: ${s.avgBuyPrice?.toLocaleString()}원 | 보유: ${s.currentHolding}주`);
      if (s.realizedPnL) lines.push(`  실현손익: ${ps(s.realizedPnL)}${s.realizedPnL?.toLocaleString()}원`);
      s.trades?.forEach(t => lines.push(`  ${t.date} ${t.type} ${t.price?.toLocaleString()}원×${t.quantity}주`));
      lines.push("");
    });
    lines.push(`총투자금: ${display.totalStats?.totalInvested?.toLocaleString()}원`);
    lines.push(`실현손익: ${ps(display.totalStats?.totalRealized)}${display.totalStats?.totalRealized?.toLocaleString()}원`);
    lines.push("\n#주식 #매매기록 #포트폴리오");
    return lines.join("\n");
  }

  return (
    <div style={S.page}>
      {showPin && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalTitle}>🔐 관리자 PIN</div>
            <input style={S.pinInput} type="password" inputMode="numeric" maxLength={6}
              placeholder="PIN 입력" value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && checkPin()} autoFocus />
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
          <span style={{ fontSize: 26 }}>📸</span>
          <span style={S.logoText}>TradeMemo</span>
          <span style={S.verBadge}>{VERSION}</span>
          {isAdmin
            ? <button style={S.adminTag} onClick={() => setIsAdmin(false)}>관리자 ✕</button>
            : <button style={S.loginTag} onClick={() => setShowPin(true)}>관리자 로그인</button>}
        </div>
        <p style={S.sub}>{isAdmin ? "📤 이미지 올려서 분석 후 저장하세요" : "📊 최신 매매기록을 확인하세요"}</p>
      </div>

      {isAdmin && (
        <>
          <div style={{ ...S.drop, ...(dragOver ? S.dropOn : {}) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={e => addFiles(e.target.files)} />
            <div style={{ fontSize: 36, marginBottom: 8 }}>📱</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>캡처 이미지 업로드</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>스크롤 캡처도 OK · 여러 장 동시 가능</div>
          </div>

          {images.length > 0 && (
            <div style={S.grid}>
              {images.map(img => (
                <div key={img.id} style={S.card}>
                  <div style={{ position: "relative" }}>
                    <img src={img.preview} alt="" style={S.thumb} />
                    <button style={S.xBtn} onClick={() => { setImages(p => p.filter(i => i.id !== img.id)); setMergedResult(null); }}>✕</button>
                  </div>
                  <div style={{ padding: "8px 10px", fontSize: 12 }}>
                    {img.loading && <span style={{ color: "#f59e0b" }}>⏳ 분석 중…</span>}
                    {img.error && <span style={{ color: "#ef4444" }}>⚠️ {img.error}</span>}
                    {img.result && !img.loading && <span style={{ color: "#4ade80" }}>✅ {img.result.stocks?.length}개 종목</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {allDone && images.some(i => i.result) && (
            <button style={{ ...S.btnMain, width: "100%", marginBottom: 12 }} onClick={saveResult} disabled={merging}>
              {merging ? "통합 중…" : "💾 분석결과 저장 (지인 공개)"}
            </button>
          )}
          {savedResult && (
            <button style={{ ...S.btnDanger, width: "100%", marginBottom: 16 }} onClick={clearAll}>🗑️ 저장된 기록 삭제</button>
          )}
        </>
      )}

      {display ? (
        <>
          <div style={S.banner}>
            <span>💡</span>
            <span style={{ fontSize: 14, color: "#93c5fd", lineHeight: 1.6 }}>{display.summary}</span>
          </div>
          <div style={S.stats}>
            {[
              { label: "종목 수", val: `${display.totalStats?.stockCount ?? display.stocks?.length}개` },
              { label: "총 거래", val: `${display.totalStats?.tradeCount}회` },
              { label: "총 투자금", val: `${(display.totalStats?.totalInvested || 0).toLocaleString()}원` },
              { label: "실현손익", val: `${ps(display.totalStats?.totalRealized)}${(display.totalStats?.totalRealized || 0).toLocaleString()}원`, color: pc(display.totalStats?.totalRealized) },
            ].map((s, i) => (
              <div key={i} style={S.statBox}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.color || "#e2e8f0" }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={S.tabs}>
            {["all", "holding", "sold"].map(t => (
              <button key={t} style={{ ...S.tab, ...(activeTab === t ? S.tabOn : {}) }} onClick={() => setActiveTab(t)}>
                {t === "all" ? "전체" : t === "holding" ? "보유중" : "매도완료"}
              </button>
            ))}
          </div>
          {filtered?.map((stock, i) => (
            <div key={i} style={S.stockCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{stock.ticker}</span>
                  <span style={{ ...S.badge, background: stock.currentHolding > 0 ? "#1e3a5f" : "#2d1f3f", color: stock.currentHolding > 0 ? "#60a5fa" : "#a78bfa" }}>
                    {stock.currentHolding > 0 ? `${stock.currentHolding}주` : "매도완료"}
                  </span>
                </div>
                {!!stock.realizedPnL && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: pc(stock.realizedPnL), border: `1px solid ${pc(stock.realizedPnL)}`, borderRadius: 8, padding: "3px 8px" }}>
                    {ps(stock.realizedPnL)}{stock.realizedPnL?.toLocaleString()}원
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #1e293b" }}>
                {[
                  { l: "평균단가", v: `${stock.avgBuyPrice?.toLocaleString()}원` },
                  { l: "총투자", v: `${stock.totalInvested?.toLocaleString()}원` },
                  ...(stock.totalSold ? [{ l: "매도금", v: `${stock.totalSold?.toLocaleString()}원` }] : []),
                ].map((m, j) => (
                  <div key={j}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{m.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{m.v}</div>
                  </div>
                ))}
              </div>
              {stock.trades?.map((t, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.type === "매수" ? "#3b82f6" : "#a78bfa", flexShrink: 0 }} />
                  <span style={{ color: "#64748b", minWidth: 80 }}>{t.date}</span>
                  <span style={{ fontWeight: 700, color: t.type === "매수" ? "#60a5fa" : "#c084fc", minWidth: 28 }}>{t.type}</span>
                  <span style={{ color: "#94a3b8", flex: 1 }}>{t.price?.toLocaleString()}원×{t.quantity}주</span>
                  <span style={{ fontWeight: 600 }}>{t.total?.toLocaleString()}원</span>
                </div>
              ))}
              {stock.insight && <div style={S.insight}>💬 {stock.insight}</div>}
            </div>
          ))}
          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 20, marginTop: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>공유 텍스트</div>
            <pre style={{ background: "#0a0f1e", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#94a3b8", whiteSpace: "pre-wrap", marginBottom: 12, border: "1px solid #1e293b", fontFamily: "monospace" }}>{shareText()}</pre>
            <button style={S.btnMain} onClick={() => { navigator.clipboard.writeText(shareText()).then(() => { setShareMsg("✅ 복사됐어요!"); setTimeout(() => setShareMsg(""), 2500); }); }}>📋 텍스트 복사</button>
            {shareMsg && <p style={{ color: "#4ade80", fontSize: 13, marginTop: 8 }}>{shareMsg}</p>}
          </div>
        </>
      ) : !isAdmin && (
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
  page: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: "24px 16px 60px", maxWidth: 720, margin: "0 auto" },
  header: { textAlign: "center", marginBottom: 24 },
  logoRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" },
  logoText: { fontSize: 24, fontWeight: 700, background: "linear-gradient(90deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  verBadge: { background: "#1e293b", color: "#64748b", border: "1px solid #334155", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  loginTag: { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" },
  adminTag: { background: "#1e3a5f", color: "#60a5fa", border: "1px solid #3b82f6", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" },
  sub: { color: "#64748b", fontSize: 14, margin: 0 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 28, width: 280, textAlign: "center" },
  modalTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16 },
  pinInput: { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", fontSize: 22, padding: "12px", textAlign: "center", outline: "none", boxSizing: "border-box", letterSpacing: 10 },
  drop: { border: "2px dashed #1e293b", borderRadius: 16, padding: "32px 20px", textAlign: "center", cursor: "pointer", marginBottom: 16, background: "#0f172a" },
  dropOn: { borderColor: "#3b82f6", background: "#0f1f3a" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 14 },
  card: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" },
  thumb: { width: "100%", height: 120, objectFit: "cover", display: "block" },
  xBtn: { position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 10 },
  banner: { background: "linear-gradient(135deg,#1e3a5f,#1a1f3f)", border: "1px solid #2d4a7f", borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", gap: 10 },
  stats: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 14 },
  statBox: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "12px 14px" },
  tabs: { display: "flex", gap: 8, marginBottom: 12 },
  tab: { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#64748b", padding: "7px 14px", fontSize: 13, cursor: "pointer" },
  tabOn: { background: "#1e293b", borderColor: "#3b82f6", color: "#60a5fa" },
  stockCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 18, marginBottom: 10 },
  badge: { fontSize: 11, padding: "3px 8px", borderRadius: 20, fontWeight: 600 },
  insight: { marginTop: 12, padding: "9px 12px", background: "#0f172a", borderRadius: 8, fontSize: 13, color: "#94a3b8", borderLeft: "3px solid #6366f1" },
  btnMain: { background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnSub: { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 10, padding: "11px 16px", fontSize: 14, cursor: "pointer" },
  btnDanger: { background: "#2d1f1f", color: "#ef4444", border: "1px solid #7f1d1d", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};
