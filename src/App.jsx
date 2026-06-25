import { useState, useRef, useCallback } from "react";

const VISION_SYSTEM_PROMPT = `당신은 주식 거래 내역 이미지 분석 전문가입니다.
사용자가 업로드한 증권 앱 화면 캡처에서 매수/매도 거래 내역을 추출하여 아래 형식의 JSON만 반환하세요.
마크다운 코드블록이나 설명 없이 순수 JSON만 출력하세요.

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
          "total": 총금액(숫자, price*quantity)
        }
      ],
      "avgBuyPrice": 평균매수단가(숫자, 가중평균),
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
  "readConfidence": "high" | "medium" | "low",
  "readIssues": "이미지가 불분명하거나 읽기 어려운 부분이 있으면 여기에 설명, 없으면 null"
}

이미지에서 날짜, 종목명, 매수/매도 구분, 체결가, 수량을 최대한 정확히 읽어내세요.
흐리거나 잘린 부분은 readIssues에 명시하고 readConfidence를 낮게 설정하세요.`;

export default function StockAgent() {
  const [images, setImages] = useState([]); // [{file, base64, preview, result, loading, error}]
  const [mergedResult, setMergedResult] = useState(null);
  const [merging, setMerging] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const toBase64 = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const analyzeImage = async (base64, mediaType) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: VISION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: "이 증권 앱 화면에서 매수/매도 거래 내역을 모두 추출해주세요.",
              },
            ],
          },
        ],
      }),
    });
    const data = await res.json();
    const text = data.content?.map((b) => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  };

  const addFiles = useCallback(async (files) => {
    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
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

    // Analyze each image
    for (const item of newItems) {
      setImages((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, loading: true } : i))
      );
      try {
        const result = await analyzeImage(item.base64, item.mediaType);
        setImages((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, loading: false, result } : i
          )
        );
      } catch (e) {
        setImages((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, loading: false, error: "이미지를 읽지 못했습니다. 더 선명한 캡처를 올려주세요." }
              : i
          )
        );
      }
    }
  }, []);

  const removeImage = (id) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    setMergedResult(null);
  };

  const mergeResults = async () => {
    const validResults = images.filter((i) => i.result).map((i) => i.result);
    if (!validResults.length) return;
    if (validResults.length === 1) {
      setMergedResult(validResults[0]);
      return;
    }

    setMerging(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `여러 이미지에서 추출된 주식 거래 데이터를 하나로 합산하세요. 중복 거래는 제거하고, 같은 종목의 거래를 통합하여 정확한 평균단가와 보유수량을 계산하세요. 순수 JSON만 반환하세요. 형식은 입력과 동일하게 유지하세요.`,
          messages: [
            {
              role: "user",
              content: `다음 여러 캡처에서 추출된 거래 데이터를 하나로 통합해주세요:\n${JSON.stringify(validResults, null, 2)}`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setMergedResult(JSON.parse(clean));
    } catch {
      // fallback: use first result
      setMergedResult(validResults[0]);
    } finally {
      setMerging(false);
    }
  };

  const result = mergedResult || (images.length === 1 && images[0].result ? images[0].result : null);
  const allDone = images.length > 0 && images.every((i) => !i.loading);
  const anyLoading = images.some((i) => i.loading);

  const pnlColor = (v) => (v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#94a3b8");
  const pnlSign = (v) => (v > 0 ? "+" : "");

  const filteredStocks = result?.stocks?.filter((s) =>
    activeTab === "all" ? true : activeTab === "holding" ? s.currentHolding > 0 : s.currentHolding === 0
  );

  function generateShareText() {
    if (!result) return "";
    const lines = ["📊 내 주식 거래 공유\n"];
    result.stocks?.forEach((s) => {
      lines.push(`▶ ${s.ticker}`);
      lines.push(`  평균단가: ${s.avgBuyPrice?.toLocaleString()}원 | 보유: ${s.currentHolding}주`);
      if (s.realizedPnL) {
        lines.push(`  실현손익: ${pnlSign(s.realizedPnL)}${s.realizedPnL?.toLocaleString()}원`);
      }
      s.trades?.forEach((t) => {
        lines.push(`  ${t.date} ${t.type} ${t.price?.toLocaleString()}원 × ${t.quantity}주`);
      });
      lines.push("");
    });
    lines.push(`총투자금: ${result.totalStats?.totalInvested?.toLocaleString()}원`);
    lines.push(`실현손익: ${pnlSign(result.totalStats?.totalRealized)}${result.totalStats?.totalRealized?.toLocaleString()}원`);
    lines.push(`\n#주식 #투자기록 #포트폴리오`);
    return lines.join("\n");
  }

  function copyShare() {
    navigator.clipboard.writeText(generateShareText()).then(() => {
      setShareMsg("✅ 클립보드에 복사됐어요!");
      setTimeout(() => setShareMsg(""), 2500);
    });
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logoRow}>
          <span style={S.logoIcon}>📸</span>
          <span style={S.logoText}>TradeMemo</span>
        </div>
        <p style={S.subtitle}>증권 앱 화면을 캡처해서 올리면 AI가 자동으로 분석해요</p>
      </div>

      {/* Upload Zone */}
      <div
        style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />
        <div style={S.dropIcon}>📱</div>
        <div style={S.dropTitle}>캡처 이미지를 올려주세요</div>
        <div style={S.dropSub}>여러 장 동시 업로드 가능 · 탭해서 선택 또는 드래그</div>
        <div style={S.dropHint}>삼성증권 · 키움 · 미래에셋 · 토스증권 등 모든 앱 지원</div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div style={S.previewGrid}>
          {images.map((img) => (
            <div key={img.id} style={S.previewCard}>
              <div style={S.previewImgWrap}>
                <img src={img.preview} alt="캡처" style={S.previewImg} />
                <button style={S.removeBtn} onClick={() => removeImage(img.id)}>✕</button>
              </div>
              <div style={S.previewStatus}>
                {img.loading && <span style={S.statusLoading}>⏳ 분석 중…</span>}
                {img.error && <span style={S.statusError}>⚠️ {img.error}</span>}
                {img.result && !img.loading && (
                  <span style={S.statusOk}>
                    ✅ {img.result.stocks?.length || 0}개 종목 인식
                    {img.result.readConfidence === "low" && " ⚠️ 화질 낮음"}
                  </span>
                )}
              </div>
              {img.result?.readIssues && (
                <div style={S.readIssue}>⚠️ {img.result.readIssues}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Merge Button (multiple images) */}
      {images.length > 1 && allDone && !mergedResult && (
        <button
          style={{ ...S.btnPrimary, width: "100%", marginBottom: 16 }}
          onClick={mergeResults}
          disabled={merging}
        >
          {merging ? "통합 중…" : `🔗 ${images.length}장 거래내역 통합하기`}
        </button>
      )}

      {/* Auto-show single result */}
      {images.length === 1 && images[0].result && !mergedResult && (
        <div style={S.autoMergeNote}>👇 분석 결과</div>
      )}

      {/* Results */}
      {result && (
        <>
          <div style={S.summaryBanner}>
            <span>💡</span>
            <span style={S.summaryText}>{result.summary}</span>
          </div>

          <div style={S.statsRow}>
            {[
              { label: "종목 수", value: `${result.totalStats?.stockCount ?? result.stocks?.length}개` },
              { label: "총 거래", value: `${result.totalStats?.tradeCount}회` },
              { label: "총 투자금", value: `${(result.totalStats?.totalInvested || 0).toLocaleString()}원` },
              {
                label: "실현손익",
                value: `${pnlSign(result.totalStats?.totalRealized)}${(result.totalStats?.totalRealized || 0).toLocaleString()}원`,
                color: pnlColor(result.totalStats?.totalRealized),
              },
            ].map((s, i) => (
              <div key={i} style={S.statCard}>
                <div style={S.statLabel}>{s.label}</div>
                <div style={{ ...S.statValue, color: s.color || "#e2e8f0" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={S.tabRow}>
            {["all", "holding", "sold"].map((t) => (
              <button
                key={t}
                style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }}
                onClick={() => setActiveTab(t)}
              >
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
                    <span style={{
                      ...S.badge,
                      background: stock.currentHolding > 0 ? "#1e3a5f" : "#2d1f3f",
                      color: stock.currentHolding > 0 ? "#60a5fa" : "#a78bfa",
                    }}>
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

                {stock.insight && (
                  <div style={S.insight}>💬 {stock.insight}</div>
                )}
              </div>
            ))}
          </div>

          {/* Share */}
          <div style={S.shareCard}>
            <div style={S.shareTitle}>공유하기</div>
            <pre style={S.sharePreview}>{generateShareText()}</pre>
            <button style={S.btnPrimary} onClick={copyShare}>📋 텍스트 복사</button>
            {shareMsg && <p style={{ color: "#4ade80", fontSize: 13, marginTop: 8 }}>{shareMsg}</p>}
          </div>
        </>
      )}

      {/* Tips */}
      {images.length === 0 && (
        <div style={S.tips}>
          <div style={S.tipsTitle}>📌 잘 찍는 팁</div>
          <div style={S.tipsList}>
            {[
              "매매내역 화면 전체가 나오도록 캡처하세요",
              "날짜, 종목명, 체결가, 수량이 모두 보여야 해요",
              "여러 페이지는 각각 캡처해서 함께 올리면 통합 분석해요",
              "스크롤 내려 여러 거래가 보이는 화면일수록 좋아요",
            ].map((t, i) => (
              <div key={i} style={S.tipItem}>
                <span style={S.tipDot} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#0a0f1e",
    color: "#e2e8f0",
    fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif",
    padding: "24px 16px 60px",
    maxWidth: 720,
    margin: "0 auto",
  },
  header: { textAlign: "center", marginBottom: 24 },
  logoRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 },
  logoIcon: { fontSize: 30 },
  logoText: {
    fontSize: 26, fontWeight: 700,
    background: "linear-gradient(90deg,#60a5fa,#a78bfa)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  subtitle: { color: "#64748b", fontSize: 14, margin: 0 },
  dropzone: {
    border: "2px dashed #1e293b",
    borderRadius: 16,
    padding: "36px 20px",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: 16,
    transition: "all 0.2s",
    background: "#0f172a",
  },
  dropzoneActive: { borderColor: "#3b82f6", background: "#0f1f3a" },
  dropIcon: { fontSize: 40, marginBottom: 10 },
  dropTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  dropSub: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  dropHint: { fontSize: 12, color: "#475569", marginTop: 8 },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  previewCard: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImgWrap: { position: "relative" },
  previewImg: { width: "100%", height: 140, objectFit: "cover", display: "block" },
  removeBtn: {
    position: "absolute", top: 6, right: 6,
    background: "rgba(0,0,0,0.7)", color: "#fff",
    border: "none", borderRadius: "50%",
    width: 24, height: 24, cursor: "pointer", fontSize: 11,
  },
  previewStatus: { padding: "8px 10px", fontSize: 12 },
  statusLoading: { color: "#f59e0b" },
  statusError: { color: "#ef4444" },
  statusOk: { color: "#4ade80" },
  readIssue: {
    padding: "6px 10px 8px",
    fontSize: 11,
    color: "#f59e0b",
    background: "#1a1200",
    borderTop: "1px solid #2a1e00",
  },
  autoMergeNote: { textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 8 },
  summaryBanner: {
    background: "linear-gradient(135deg,#1e3a5f,#1a1f3f)",
    border: "1px solid #2d4a7f",
    borderRadius: 12,
    padding: "14px 18px",
    marginBottom: 16,
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
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
  tips: { background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 20, marginTop: 8 },
  tipsTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#94a3b8" },
  tipsList: { display: "flex", flexDirection: "column", gap: 10 },
  tipItem: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#64748b" },
  tipDot: { width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 5 },
};
