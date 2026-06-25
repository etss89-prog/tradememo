import { useState, useRef, useCallback, useEffect } from "react";

// ✅ 여기서 PIN 번호를 바꿀 수 있어요
const ADMIN_PIN = "4254";

const STORAGE_KEY = "tradememo_results";

const VISION_SYSTEM_PROMPT = `당신은 주식 거래 내역 이미지 분석 전문가입니다.
사용자가 업로드한 증권 앱 화면 캡처에서 매수/매도 거래 내역을 추출하여 아래 형식의 JSON만 반환하세요.
마크다운 코드블록이나 설명 없이 순수 JSON만 출력하세요.
이미지가 길거나 작은 글씨여도 최대한 모든 거래 내역을 빠짐없이 읽어내세요.

{
  "summary": "이미지에서 읽은 내용 요약 (한국어)",
  "stocks": [
    {
      "ticker": "종목명",
      "trades": [
        {
          "date": "YYYY-MM-DD",
          "type": "매수" 또는 "매도",
          "price": 체결단가(숫자),
          "quantity": 수량(숫자),
          "total": 총금액(숫자)
        }
      ],
      "avgBuyPrice": 평균매수단가(숫자),
      "currentHolding": 현재보유수량(숫자),
      "totalInvested": 총투자금(숫자),
      "totalSold": 총매도금(숫자, 없으면 0),
      "realizedPnL": 실현손익(숫자, 없으면 0),
      "insight": "이 종목 거래 패턴에 대한 한 줄 인사이트"
    }
  ],
  "totalStats": {
    "totalInvested": 총투자금합계,
    "totalRealized": 총실현손익,
    "tradeCount": 총거래횟수,
    "stockCount": 종목수
  },
  "readConfidence": "high",
  "readIssues": null
}`;

const MERGE_PROMPT = `여러 이미지에서 추출된 주식 거래 데이터를 하나로 합산하세요.
중복 거래는 제거하고, 같은 종목의 거래를 통합하여 정확한 평균단가와 보유수량을 계산하세요.
순수 JSON만 반환하세요.`;

// 긴 이미지를 세로로 분할하는 함수
function splitLongImage(base64, mediaType) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      // 세로가 가로의 2배 이상이면 분할
      if (height < width * 2) {
        resolve([{ base64, mediaType }]);
        return;
      }
      const sliceCount = Math.min(Math.ceil(height / (width * 1.5)), 5);
      const sliceHeight = Math.ceil(height / sliceCount);
      const chunks = [];
      for (let i = 0; i < sliceCount; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = Math.min(sliceHeight, height - i * sliceHeight);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, -i * sliceHeight);
        const sliceBase64 = canvas.toDataURL(mediaType).split(",")[1];
        chunks.push({ base64: sliceBase64, mediaType });
      }
      resolve(chunks);
    };
    img.src = `data:${mediaType};base64,${base64}`;
  });
}

async function callClaude(messages, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages,
    }),
  });
  const data = await res.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function analyzeImageChunks(base64, mediaType) {
  const chunks = await splitLongImage(base64, mediaType);
  if (chunks.length === 1) {
    return await callClaude([
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "이 증권 앱 화면에서 매수/매도 거래 내역을 모두 추출해주세요." },
        ],
      },
    ], VISION_SYSTEM_PROMPT);
  }
  // 여러 조각 각각 분석
  const results = await Promise.all(
    chunks.map((chunk) =>
      callClaude([
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: chunk.mediaType, data: chunk.base64 } },
            { type: "text", text: "이 증권 앱 화면에서 매수/매도 거래 내역을 모두 추출해주세요." },
          ],
        },
      ], VISION_SYSTEM_PROMPT)
    )
  );
  // 조각 결과 병합
  return await callClaude([
    {
      role: "user",
      content: `다음 여러 캡처 조각에서 추출된 거래 데이터를 하나로 통합해주세요:\n${JSON.stringify(results, null, 2)}`,
    },
  ], MERGE_PROMPT);
}

export default function StockAgent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);

  const [images, setImages] = useState([]);
  const [savedResult, setSavedResult] = useState(null);
  const [mergedResult, setMergedResult] = useState(null);
  const [merging, setMerging] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // 저장된 결과 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSavedResult(JSON.parse(saved));
    } catch {}
  }, []);

  const toBase64 = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  function checkPin() {
    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError("PIN이 틀렸습니다.");
      setPinInput("");
    }
  }

  const addFiles = useCallback(async (files) => {
    if (!isAdmin) return;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!validFiles.length) return;

    const newItems = await Promise.all(
      validFiles.map(async (file) => {
        const base64 = await toBase64(file);
        return {
          id: Date.now() + Math.random(),
          file,
          base64,
          mediaType: file.type,
          preview: URL.createObjectURL(file),
          result: null,
          loading: false,
          error: null,
        };
      })
    );

    setImages((prev) => [...prev, ...newItems]);
    setMergedResult(null);

    for (const item of newItems) {
      setImages((prev) => prev.map((i) => (i.id === item.id ? { ...i, loading: true } : i)));
      try {
        const result = await analyzeImageChunks(item.base64, item.mediaType);
        setImages((prev) => prev.map((i) => (i.id === item.id ? { ...i, loading: false, result } : i)));
      } catch (e) {
        setImages((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, loading: false, error: "이미지를 읽지 못했습니다. 다시 시도해주세요." } : i
          )
        );
      }
    }
  }, [isAdmin]);

  const removeImage = (id) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    setMergedResult(null);
  };

  const mergeAndSave = async () => {
    const validResults = images.filter((i) => i.result).map((i) => i.result);
    if (!validResults.length) return;
    let final = validResults[0];
    if (validResults.length > 1) {
      setMerging(true);
      try {
        final = await callClaude([
          { role: "user", content: `다음 거래 데이터를 하나로 통합해주세요:\n${JSON.stringify(validResults, null, 2)}` },
        ], MERGE_PROMPT);
      } catch {}
      setMerging(false);
    }
    setMergedResult(final);
    setSavedResult(final);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
    alert("✅ 저장 완료! 지인들이 링크에서 바로 볼 수 있어요.");
  };

  const clearAll = () => {
    if (!window.confirm("저장된 매매기록을 모두 삭제할까요?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setSavedResult(null);
    setMergedResult(null);
    setImages([]);
  };

  const displayResult = mergedResult || savedResult;
  const allDone = images.length > 0 && images.every((i) => !i.loading);
  const pnlColor = (v) => (v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#94a3b8");
  const pnlSign = (v) => (v > 0 ? "+" : "");

  const filteredStocks = displayResult?.stocks?.filter((s) =>
    activeTab === "all" ? true : activeTab === "holding" ? s.currentHolding > 0 : s.currentHolding === 0
  );

  function generateShareText() {
    if (!displayResult) return "";
    const lines = ["📊 내 주식 거래 공유\n"];
    displayResult.stocks?.forEach((s) => {
      lines.push(`▶ ${s.ticker}`);
      lines.push(`  평균단가: ${s.avgBuyPrice?.toLocaleString()}원 | 보유: ${s.currentHolding}주`);
      if (s.realizedPnL) lines.push(`  실현손익: ${pnlSign(s.realizedPnL)}${s.realizedPnL?.toLocaleString()}원`);
      s.trades?.forEach((t) => lines.push(`  ${t.date} ${t.type} ${t.price?.toLocaleString()}원 × ${t.quantity}주`));
      lines.push("");
    });
    lines.push(`총투자금: ${displayResult.totalStats?.totalInvested?.toLocaleString()}원`);
    lines.push(`실현손익: ${pnlSign(displayResult.totalStats?.totalRealized)}${displayResult.totalStats?.totalRealized?.toLocaleString()}원`);
    lines.push(`\n#주식 #투자기록 #포트폴리오`);
    return lines.join("\n");
  }

  function copyShare() {
    navigator.clipboard.writeText(generateShareText()).then(() => {
      setShareMsg("✅ 복사됐어요!");
      setTimeout(() => setShareMsg(""), 2500);
    });
  }

  return (
    <div style={S.page}>
      {/* PIN 모달 */}
      {showPinModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <div style={S.modalTitle}>🔐 관리자 PIN 입력</div>
            <input
              style={S.pinInput}
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN 번호"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkPin()}
              autoFocus
            />
            {pinError && <div style={S.pinError}>{pinError}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={S.btnSecondary} onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(""); }}>취소</button>
              <button style={S.btnPrimary} onClick={checkPin}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div style={S.header}>
        <div style={S.logoRow}>
          <span style={S.logoIcon}>📸</span>
          <span style={S.logoText}>TradeMemo</span>
          {isAdmin
            ? <button style={S.adminBadge} onClick={() => setIsAdmin(false)}>관리자 ✕</button>
            : <button style={S.loginBtn} onClick={() => setShowPinModal(true)}>관리자 로그인</button>
          }
        </div>
        <p style={S.subtitle}>
          {isAdmin ? "📤 이미지를 올려 분석하고 저장하세요" : "📊 최신 매매기록을 확인하세요"}
        </p>
      </div>

      {/* 관리자: 업로드 영역 */}
      {isAdmin && (
        <>
          <div
            style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
            <div style={S.dropIcon}>📱</div>
            <div style={S.dropTitle}>캡처 이미지 업로드</div>
            <div style={S.dropSub}>길쭉한 스크롤 캡처도 자동 분할 분석 가능</div>
          </div>

          {images.length > 0 && (
            <div style={S.previewGrid}>
              {images.map((img) => (
                <div key={img.id} style={S.previewCard}>
                  <div style={S.previewImgWrap}>
                    <img src={img.preview} alt="캡처" style={S.previewImg} />
                    <button style={S.removeBtn} onClick={() => removeImage(img.id)}>✕</button>
                  </div>
                  <div style={S.previewStatus}>
                    {img.loading && <span style={{ color: "#f59e0b" }}>⏳ 분석 중…</span>}
                    {img.error && <span style={{ color: "#ef4444" }}>⚠️ {img.error}</span>}
                    {img.result && !img.loading && <span style={{ color: "#4ade80" }}>✅ {img.result.stocks?.length}개 종목 인식</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {allDone && images.some((i) => i.result) && (
            <button
              style={{ ...S.btnPrimary, width: "100%", marginBottom: 16 }}
              onClick={mergeAndSave}
              disabled={merging}
            >
              {merging ? "통합 중…" : `💾 분석결과 저장하기 (지인 공개)`}
            </button>
          )}

          {savedResult && (
            <button style={{ ...S.btnDanger, width: "100%", marginBottom: 16 }} onClick={clearAll}>
              🗑️ 저장된 기록 삭제
            </button>
          )}
        </>
      )}

      {/* 결과 표시 (관리자 + 조회자 모두) */}
      {displayResult ? (
        <>
          <div style={S.summaryBanner}>
            <span>💡</span>
            <span style={S.summaryText}>{displayResult.summary}</span>
          </div>

          <div style={S.statsRow}>
            {[
              { label: "종목 수", value: `${displayResult.totalStats?.stockCount ?? displayResult.stocks?.length}개` },
              { label: "총 거래", value: `${displayResult.totalStats?.tradeCount}회` },
              { label: "총 투자금", value: `${(displayResult.totalStats?.totalInvested || 0).toLocaleString()}원` },
              { label: "실현손익", value: `${pnlSign(displayResult.totalStats?.totalRealized)}${(displayResult.totalStats?.totalRealized || 0).toLocaleString()}원`, color: pnlColor(displayResult.totalStats?.totalRealized) },
            ].map((s, i) => (
              <div key={i} style={S.statCard}>
                <div style={S.statLabel}>{s.label}</div>
                <div style={{ ...S.statValue, color: s.color || "#e2e8f0" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={S.tabRow}>
            {["all", "holding", "sold"].map((t) => (
              <button key={t} style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }} onClick={() => setActiveTab(t)}>
                {t === "all" ? "전체" : t === "holding" ? "보유중" : "매도완료"}
              </button>
            ))}
          </div>

          <div style={S.stockList}>
            {filteredStocks?.map((stock, idx) => (
              <div key={idx} style={S.stockCard}>
                <div style={S.stockHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={S.ticker}>{stock.ticker}</span>
                    <span style={{ ...S.badge, background: stock.currentHolding > 0 ? "#1e3a5f" : "#2d1f3f", color: stock.currentHolding > 0 ? "#60a5fa" : "#a78bfa" }}>
                      {stock.currentHolding > 0 ? `${stock.currentHolding}주 보유` : "매도완료"}
                    </span>
                  </div>
                  {!!stock.realizedPnL && (
                    <div style={{ ...S.pnlBadge, color: pnlColor(stock.realizedPnL), borderColor: pnlColor(stock.realizedPnL) }}>
                      {pnlSign(stock.realizedPnL)}{stock.realizedPnL?.toLocaleString()}원
                    </div>
                  )}
                </div>
                <div style={S.stockMeta}>
                  {[
                    { label: "평균단가", value: `${stock.avgBuyPrice?.toLocaleString()}원` },
                    { label: "총 투자", value: `${stock.totalInvested?.toLocaleString()}원` },
                    ...(stock.totalSold ? [{ label: "매도금", value: `${stock.totalSold?.toLocaleString()}원` }] : []),
                  ].map((m, i) => (
                    <div key={i} style={S.metaItem}>
                      <span style={S.metaLabel}>{m.label}</span>
                      <span style={S.metaValue}>{m.value}</span>
                    </div>
                  ))}
                </div>
                <div style={S.timeline}>
                  {stock.trades?.map((t, ti) => (
                    <div key={ti} style={S.tradeRow}>
                      <div style={{ ...S.tradeDot, background: t.type === "매수" ? "#3b82f6" : "#a78bfa" }} />
                      <span style={S.tradeDate}>{t.date}</span>
                      <span style={{ ...S.tradeType, color: t.type === "매수" ? "#60a5fa" : "#c084fc" }}>{t.type}</span>
                      <span style={S.tradeDetail}>{t.price?.toLocaleString()}원 × {t.quantity}주</span>
                      <span style={S.tradeTotal}>{t.total?.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
                {stock.insight && <div style={S.insight}>💬 {stock.insight}</div>}
              </div>
            ))}
          </div>

          <div style={S.shareCard}>
            <div style={S.shareTitle}>공유 텍스트</div>
            <pre style={S.sharePreview}>{generateShareText()}</pre>
            <button style={S.btnPrimary} onClick={copyShare}>📋 텍스트 복사</button>
            {shareMsg && <p style={{ color: "#4ade80", fontSize: 13, marginTop: 8 }}>{shareMsg}</p>}
          </div>
        </>
      ) : (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>📭</div>
          <div style={S.emptyTitle}>아직 등록된 매매기록이 없어요</div>
          <div style={S.emptySub}>관리자가 기록을 업로드하면 여기서 확인할 수 있어요</div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: "24px 16px 60px", maxWidth: 720, margin: "0 auto" },
  header: { textAlign: "center", marginBottom: 24 },
  logoRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" },
  logoIcon: { fontSize: 28 },
  logoText: { fontSize: 24, fontWeight: 700, background: "linear-gradient(90deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  loginBtn: { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" },
  adminBadge: { background: "#1e3a5f", color: "#60a5fa", border: "1px solid #3b82f6", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" },
  subtitle: { color: "#64748b", fontSize: 14, margin: 0 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 28, width: 280, textAlign: "center" },
  modalTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16 },
  pinInput: { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", fontSize: 20, padding: "12px", textAlign: "center", outline: "none", boxSizing: "border-box", letterSpacing: 8 },
  pinError: { color: "#ef4444", fontSize: 13, marginTop: 8 },
  dropzone: { border: "2px dashed #1e293b", borderRadius: 16, padding: "32px 20px", textAlign: "center", cursor: "pointer", marginBottom: 16, background: "#0f172a" },
  dropzoneActive: { borderColor: "#3b82f6", background: "#0f1f3a" },
  dropIcon: { fontSize: 36, marginBottom: 8 },
  dropTitle: { fontSize: 15, fontWeight: 700, marginBottom: 4 },
  dropSub: { fontSize: 13, color: "#64748b" },
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 16 },
  previewCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" },
  previewImgWrap: { position: "relative" },
  previewImg: { width: "100%", height: 130, objectFit: "cover", display: "block" },
  removeBtn: { position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 11 },
  previewStatus: { padding: "8px 10px", fontSize: 12 },
  summaryBanner: { background: "linear-gradient(135deg,#1e3a5f,#1a1f3f)", border: "1px solid #2d4a7f", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" },
  summaryText: { fontSize: 14, color: "#93c5fd", lineHeight: 1.6 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 },
  statCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 16px" },
  statLabel: { fontSize: 11, color: "#64748b", marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 700 },
  tabRow: { display: "flex", gap: 8, marginBottom: 14 },
  tab: { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#64748b", padding: "7px 16px", fontSize: 13, cursor: "pointer" },
  tabActive: { background: "#1e293b", borderColor: "#3b82f6", color: "#60a5fa" },
  stockList: { display: "flex", flexDirection: "column", gap: 12 },
  stockCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 20 },
  stockHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  ticker: { fontSize: 18, fontWeight: 700 },
  badge: { fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600 },
  pnlBadge: { fontSize: 14, fontWeight: 700, border: "1px solid", borderRadius: 8, padding: "4px 10px" },
  stockMeta: { display: "flex", gap: 20, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #1e293b" },
  metaItem: { display: "flex", flexDirection: "column", gap: 3 },
  metaLabel: { fontSize: 11, color: "#64748b" },
  metaValue: { fontSize: 15, fontWeight: 600 },
  timeline: { display: "flex", flexDirection: "column", gap: 8 },
  tradeRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  tradeDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  tradeDate: { color: "#64748b", minWidth: 90 },
  tradeType: { fontWeight: 700, minWidth: 30 },
  tradeDetail: { color: "#94a3b8", flex: 1 },
  tradeTotal: { color: "#e2e8f0", fontWeight: 600 },
  insight: { marginTop: 14, padding: "10px 14px", background: "#0f172a", borderRadius: 8, fontSize: 13, color: "#94a3b8", borderLeft: "3px solid #6366f1" },
  shareCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 20, marginTop: 16 },
  shareTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  sharePreview: { background: "#0a0f1e", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#94a3b8", overflowX: "auto", whiteSpace: "pre-wrap", marginBottom: 14, border: "1px solid #1e293b", fontFamily: "monospace" },
  btnPrimary: { background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnSecondary: { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 10, padding: "10px 16px", fontSize: 14, cursor: "pointer" },
  btnDanger: { background: "#2d1f1f", color: "#ef4444", border: "1px solid #7f1d1d", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  emptyState: { textAlign: "center", padding: "60px 20px" },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#64748b" },
};
