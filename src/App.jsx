import { useState, useRef, useCallback, useEffect } from "react";

const ADMIN_PIN = "4254";
const VIEWER_PIN = "2026";
const VERSION = "v8.9";

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
  "#15803d","#15803d","#86efac",
  "#f59e0b","#f59e0b","#fcd34d",
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
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 12, marginBottom: 12 }}>
      {title && <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>{title}</div>}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <svg viewBox="0 0 100 100" style={{ width: 80, height: 80, flexShrink: 0 }}>
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
          {centerText && (
            <>
              <text x="50" y="47" textAnchor="middle" fill="#1e293b" fontSize="6" fontWeight="700">{centerText.line1}</text>
              <text x="50" y="56" textAnchor="middle" fill="#94a3b8" fontSize="5">{centerText.line2}</text>
            </>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 5, paddingBottom: 4, borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ flex: 2, fontSize: 10, color: "#94a3b8" }}>{labelName || "종목명"}</span>
            <span style={{ flex: 1, fontSize: 10, color: "#94a3b8", textAlign: "center" }}>{labelPct || "비중"}</span>
            <span style={{ flex: 1, fontSize: 10, color: "#94a3b8", textAlign: "right" }}>{labelAvg || "평단"}</span>
          </div>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 2, minWidth: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ color: "#1e293b", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.ticker}</span>
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

function PortfolioChart({ data, isAdmin, showWealth, onEdit }) {
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
    // 해외주식은 USD 평단 vs KRW 현재가 혼용이라 수익률 직접 계산 불가 → returnRate 사용
    const ret = d.isOverseas
      ? (d.returnRate ?? null)
      : (d.avgBuy ? ((d.current - d.avgBuy) / d.avgBuy * 100) : null);
    return { ...d, path, color: COLORS[i % COLORS.length], pct: Math.round(pct * 1000) / 10, ret };
  });

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, marginBottom: 12 }}>
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
          <text x="50" y="58" textAnchor="middle" fill="#1e293b" fontSize="7" fontWeight="700">{slices.length}종목</text>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          {(() => {
            const MAX = 29;
            const shown = slices.slice(0, MAX);
            const rest = slices.slice(MAX);
            const restValue = rest.reduce((sum, r) => sum + r.value, 0);
            const restPct = total > 0 ? Math.round(restValue / total * 1000) / 10 : 0;
            const all = [...shown, ...(rest.length > 0 ? [{ ticker: `기타 ${rest.length}종목`, pct: restPct, color: "#94a3b8", isEtc: true }] : [])];
            const half = Math.ceil(all.length / 2);
            const col1 = all.slice(0, half);
            const col2 = all.slice(half);
            const ColItem = ({ s }) => (
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: s.isEtc ? "#94a3b8" : "#1e293b", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{s.ticker}</span>
                <span style={{ fontSize: 10, color: s.isEtc ? "#94a3b8" : "#94a3b8", fontWeight: 700, flexShrink: 0, marginLeft: 2 }}>{Number(s.pct).toFixed(1)}%</span>
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
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: showWealth ? "1.4fr 0.6fr 0.6fr 1fr 1.1fr" : "1.8fr 0.7fr 0.7fr 1.4fr", background: "#f1f5f9", padding: "8px 12px", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>종목명</span>
          <span style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>비중</span>
          <span style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>수익률</span>
          <span style={{ fontSize: 10, color: "#94a3b8", textAlign: "right" }}>평단/현재가</span>
          {showWealth && <span style={{ fontSize: 10, color: "#15803d", textAlign: "right" }}>수량/보유금액</span>}
        </div>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: showWealth ? "1.4fr 0.6fr 0.6fr 1fr 1.1fr" : "1.8fr 0.7fr 0.7fr 1.4fr", padding: "9px 12px", gap: 4, alignItems: "center", borderTop: "1px solid #e2e8f0", background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ color: "#1e293b", fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.ticker}</span>
              {isAdmin && onEdit && (
                <button onClick={() => onEdit(s)} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 11, cursor: "pointer", padding: "2px 3px", flexShrink: 0, lineHeight: 1 }}>✏️</button>
              )}
            </div>
            <span style={{ color: "#1e293b", fontWeight: 700, fontSize: 12, textAlign: "center" }}>{Number(s.pct).toFixed(1)}%</span>
            <span style={{ fontSize: 12, textAlign: "center", fontWeight: 700,
              color: s.ret === null ? "#94a3b8" : s.ret >= 0 ? "#ef4444" : "#3b82f6" }}>
              {s.ret !== null ? (s.ret >= 0 ? "+" : "") + s.ret.toFixed(1) + "%" : "-"}
            </span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.avgBuy?.toLocaleString()}원</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{s.current?.toLocaleString()}원</div>
            </div>
            {showWealth && (
              <div style={{ textAlign: "right" }}>
                {s.approximateData
                  ? <div style={{ fontSize: 10, color: "#f59e0b" }}>금액기준</div>
                  : <div style={{ fontSize: 11, color: "#15803d" }}>{s.qty?.toLocaleString()}주</div>
                }
                <div style={{ fontSize: 12, fontWeight: 700, color: s.approximateData ? "#f59e0b" : "#15803d" }}>{s.value?.toLocaleString()}원</div>
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
  // 다크/라이트 모드 - localStorage에 저장
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("jb_dark_mode") === "true";
  });
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("jb_dark_mode", String(next));
  };
  // 세션ID - 첫 접속 시 자동 생성, localStorage에 영구 저장
  const [mySessionId] = useState(() => {
    let id = localStorage.getItem("jb_session_id");
    if (!id) {
      id = "user_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("jb_session_id", id);
    }
    return id;
  });
  // 존버일기장 탭
  const [diaryPosts, setDiaryPosts] = useState([]);
  const [diaryText, setDiaryText] = useState("");
  const [diaryNickname, setDiaryNickname] = useState("");
  const [diaryPassword, setDiaryPassword] = useState("");
  const [diarySecret, setDiarySecret] = useState(false);
  const [diaryLinkUrl, setDiaryLinkUrl] = useState("");
  const [diaryReplyTo, setDiaryReplyTo] = useState(null); // { id, text, nickname }
  const [diaryWriting, setDiaryWriting] = useState(false); // 글쓰기 패널 열림
  const [linkPreviews, setLinkPreviews] = useState({}); // { postId: { title, description, image, domain } }
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDraft, setPreviewDraft] = useState(null); // 작성 중 링크 미리보기
  const [diaryEditModal, setDiaryEditModal] = useState(null); // { post, password? }
  const [diaryEditText, setDiaryEditText] = useState("");
  const [diaryEditPw, setDiaryEditPw] = useState("");
  const [diaryDeleteModal, setDiaryDeleteModal] = useState(null);
  const [diaryDeletePw, setDiaryDeletePw] = useState("");
  const [showWealth, setShowWealth] = useState(false); // 관리자 자산공개 토글
  const [editStockModal, setEditStockModal] = useState(null); // { accountId, stock }
  const [portfolioEditMode, setPortfolioEditMode] = useState(false); // 종목편집 모드 토글
  // 현재 테마
  const S = getTheme(darkMode);
  const [editStockQty, setEditStockQty] = useState("");
  const [editStockAvg, setEditStockAvg] = useState("");
  const [mainText, setMainText] = useState({
    emoji: "🐜",
    title: "존버일기장",
    subtitle: "존버는 승리한다.\n왜냐하면 승리하기 때문이다.",
    // html: null → null이면 기존 방식(emoji+title+subtitle), 있으면 HTML 렌더링
    html: null,
  });
  const [editingMain, setEditingMain] = useState(false);
  const [editDraft, setEditDraft] = useState({});
  // 동적 계좌 관리
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [addAccModal, setAddAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  // 수기입력 모달
  const [manualModal, setManualModal] = useState(null); // { accountId }
  const [manualTicker, setManualTicker] = useState("");
  const [manualTickerCode, setManualTickerCode] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [manualAvg, setManualAvg] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const fileRef = useRef(null);
  const richEditorRef = useRef(null);
  const portfolioRef = useRef(null);

  // 앱 로드 시 서버 버전 체크 → 새 배포 감지되면 자동 새로고침
  useEffect(() => {
    const stored = localStorage.getItem("tradememo_version");
    fetch("/api/version", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const serverVer = d.version;
        if (serverVer && serverVer !== "dev") {
          if (stored && stored !== serverVer) {
            // 새 버전 감지 → 캐시 무시하고 강제 새로고침
            localStorage.setItem("tradememo_version", serverVer);
            window.location.reload(true);
          } else {
            localStorage.setItem("tradememo_version", serverVer);
          }
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/load").then(r => r.json()).then(d => {
      if (d.records) setAllRecords(d.records);
      if (d.portfolios) {
        let portfoliosToSet = d.portfolios;
        // ✅ livePrices가 있으면 포트폴리오의 currentPrice를 즉시 업데이트
        // → 렌더링 시 항상 최신 가격이 반영됨 (타이밍 문제 해결)
        if (d.livePrices) {
          portfoliosToSet = Object.fromEntries(
            Object.entries(d.portfolios).map(([accId, p]) => [
              accId,
              {
                ...p,
                stocks: (p.stocks || []).map(s => {
                  const livePrice = d.livePrices[s.ticker];
                  if (!livePrice || s.approximateData || s.isOverseas) return s;
                  return {
                    ...s,
                    currentPrice: livePrice,
                    currentValue: livePrice * s.quantity,
                  };
                }),
              }
            ])
          );
        }
        setPortfolios(portfoliosToSet);
      }
      if (d.accounts && d.accounts.length > 0) setAccounts(d.accounts);
      if (d.mainText) setMainText(d.mainText);
      if (d.livePrices) setLivePrices(d.livePrices);
      if (d.priceUpdatedAt) setLastUpdated(d.priceUpdatedAt);
    }).catch(() => {});
    // 일기장 불러오기
    fetch("/api/diary-load").then(r => r.json()).then(d => {
      if (d.posts) {
        setDiaryPosts(d.posts);
        // 링크가 있는 포스트는 미리보기 조회
        d.posts.forEach(p => {
          if (p.linkUrl) fetchLinkPreview(p.linkUrl, p.id);
        });
      }
    }).catch(() => {});
  }, []);

  // richEditor DOM 초기화 - editingMain이 열릴 때 innerHTML 직접 세팅
  // dangerouslySetInnerHTML 대신 ref로 제어해서 리렌더링 충돌 방지
  useEffect(() => {
    if (editingMain && richEditorRef.current) {
      const defaultHtml = '<div style="text-align:center"><span style="font-size:40px">🐜</span><br/><span style="font-size:22px;font-weight:900;color:#e2e8f0">존버일기장</span><br/><br/><span style="font-size:18px;font-weight:700;color:#f59e0b">존버는 승리한다.<br/>왜냐하면 승리하기 때문이다.</span></div>';
      richEditorRef.current.innerHTML = editDraft.html || defaultHtml;
    }
  }, [editingMain]);

  // 링크 미리보기 조회
  async function fetchLinkPreview(url, postId) {
    if (!url) return;
    try {
      const res = await fetch("/api/link-preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (postId) {
        setLinkPreviews(prev => ({ ...prev, [postId]: data }));
      } else {
        setPreviewDraft(data);
      }
    } catch {}
  }

  // 일기장 글 추가
  async function addDiaryPost() {
    if (!diaryText.trim() && !diaryLinkUrl.trim()) return;
    const post = {
      text: diaryText.trim(),
      nickname: isAdmin ? "주인장" : (diaryNickname.trim() || "익명"),
      isAdmin,
      isSecret: diarySecret,
      password: isAdmin ? null : (diaryPassword || null),
      replyTo: diaryReplyTo?.id || null,
      replyPreview: diaryReplyTo ? `${diaryReplyTo.nickname}: ${diaryReplyTo.text.slice(0, 40)}${diaryReplyTo.text.length > 40 ? "..." : ""}` : null,
      linkUrl: diaryLinkUrl.trim() || null,
      sessionId: isAdmin ? "admin" : mySessionId,
    };
    const res = await fetch("/api/diary-save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", post })
    });
    const d = await res.json();
    if (d.posts) {
      setDiaryPosts(d.posts);
      // 새 글의 링크 미리보기 조회
      const newPost = d.posts[0];
      if (newPost?.linkUrl) fetchLinkPreview(newPost.linkUrl, newPost.id);
    }
    setDiaryText(""); setDiaryLinkUrl(""); setDiarySecret(false);
    setDiaryReplyTo(null); setDiaryPassword(""); setDiaryWriting(false);
    setPreviewDraft(null);
  }

  async function editDiaryPost() {
    const post = diaryEditModal;
    if (!post) return;
    // 관리자가 아닌 경우 비밀번호 확인
    if (!isAdmin && post.password && diaryEditPw !== post.password) {
      alert("비밀번호가 틀렸어요."); return;
    }
    const res = await fetch("/api/diary-save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", post: { id: post.id, text: diaryEditText } })
    });
    const d = await res.json();
    if (d.posts) setDiaryPosts(d.posts);
    setDiaryEditModal(null); setDiaryEditText(""); setDiaryEditPw("");
  }

  async function deleteDiaryPost() {
    const post = diaryDeleteModal;
    if (!post) return;
    if (!isAdmin && post.password && diaryDeletePw !== post.password) {
      alert("비밀번호가 틀렸어요."); return;
    }
    const res = await fetch("/api/diary-save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", post: { id: post.id } })
    });
    const d = await res.json();
    if (d.posts) setDiaryPosts(d.posts);
    setDiaryDeleteModal(null); setDiaryDeletePw("");
  }

  async function saveMainText(htmlContent) {
    // htmlContent: richEditorRef에서 직접 읽은 최신 innerHTML
    // setEditDraft가 비동기라 editDraft를 쓰면 옛날 값이 저장됨
    const finalMainText = { ...editDraft, html: htmlContent || null };
    setMainText(finalMainText);
    setEditingMain(false);
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: allRecords, portfolios, accounts, mainText: finalMainText })
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

  async function saveEditStock() {
    const { accountId, stock } = editStockModal;
    const qty = parseInt(editStockQty);
    const avg = parseInt(editStockAvg.replace(/,/g, ""));
    if (isNaN(qty) || isNaN(avg)) return alert("수량과 평단가를 올바르게 입력해주세요.");

    const existing = portfolios[accountId];
    if (!existing) return;

    const updatedStocks = existing.stocks.map(s =>
      s.ticker === stock.ticker
        ? { ...s, quantity: qty, avgBuyPrice: avg, currentValue: (livePrices[s.ticker] || s.currentPrice) * qty }
        : s
    );
    const totalValue = updatedStocks.reduce((sum, s) => sum + (s.currentValue || 0), 0);
    const newPortfolios = { ...portfolios, [accountId]: { ...existing, stocks: updatedStocks, totalValue } };
    setPortfolios(newPortfolios);
    setEditStockModal(null);
    setEditStockQty("");
    setEditStockAvg("");

    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts, mainText })
    });
    alert(`✅ ${stock.ticker} 수정 완료!`);
  }

  async function deleteStock(accountId, ticker) {
    if (!window.confirm(`"${ticker}" 종목을 삭제할까요?`)) return;
    const existing = portfolios[accountId];
    if (!existing) return;
    const updatedStocks = existing.stocks.filter(s => s.ticker !== ticker);
    const totalValue = updatedStocks.reduce((sum, s) => sum + (s.currentValue || 0), 0);
    const newPortfolios = { ...portfolios, [accountId]: { ...existing, stocks: updatedStocks, totalValue } };
    setPortfolios(newPortfolios);
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: allRecords, portfolios: newPortfolios, accounts, mainText })
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
      tickerCode: manualTickerCode.trim() || null, // 수기입력한 종목코드
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
    setManualTicker(""); setManualTickerCode(""); setManualQty(""); setManualAvg(""); setManualPrice("");
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
        // ✅ stocks 정보도 전송 → portfolio.js가 저장한 tickerCode 활용
        body: JSON.stringify({ tickers, stocks }),
      });
      const data = await res.json();
      if (data.prices) {
        // ✅ 해외주식은 KRW 환산가로 변환해서 저장
        const processedPrices = {};
        Object.entries(data.prices).forEach(([name, val]) => {
          if (val && typeof val === 'object' && val.isOverseas) {
            processedPrices[name] = val.krw; // KRW 환산가만 저장
          } else {
            processedPrices[name] = val;
          }
        });
        setLivePrices(processedPrices);
        const now = new Date().toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
        setLastUpdated(now);
        fetch("/api/save-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ livePrices: processedPrices, priceUpdatedAt: now })
        }).catch(() => {});

        // ℹ️ resolvedCodes 자동 캐싱 비활성화
        // 네이버 자동완성 API가 유사 종목을 잘못 매칭할 수 있어서
        // tickerCode는 portfolio.js가 이미지에서 직접 추출한 경우에만 신뢰함
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
      const allPortfolios = Object.values(portfolios);
      if (allPortfolios.length === 0) return null;

      // 수량기준 종목만 합산 (approximateData=true 계좌는 종목 제외)
      const allNormalStocks = allPortfolios
        .flatMap(p => (p.stocks || []).filter(s => !s.approximateData));

      const merged = Object.values(allNormalStocks.reduce((acc, s) => {
        if (s.isOverseas) {
          // 해외주식: KRW 평가금액 직접 사용
          const krwValue = livePrices[s.ticker]
            ? livePrices[s.ticker] * s.quantity
            : s.currentValue;
          if (!acc[s.ticker]) acc[s.ticker] = { ...s, currentValue: krwValue };
          else { acc[s.ticker].quantity += s.quantity; acc[s.ticker].currentValue += krwValue; }
          return acc;
        }
        const cur = livePrices[s.ticker] || s.currentPrice;
        if (!acc[s.ticker]) {
          acc[s.ticker] = { ...s, quantity: s.quantity, currentValue: cur * s.quantity };
        } else {
          const prevQty = acc[s.ticker].quantity;
          acc[s.ticker].quantity += s.quantity;
          acc[s.ticker].currentValue += cur * s.quantity;
          acc[s.ticker].avgBuyPrice = Math.round(
            (acc[s.ticker].avgBuyPrice * prevQty + s.avgBuyPrice * s.quantity) / acc[s.ticker].quantity
          );
        }
        return acc;
      }, {}));

      // 총액은 수량기준 + 금액기준(approximateData) 계좌 totalValue 모두 합산
      const normalTotal = merged.reduce((s, d) => s + (d.currentValue || 0), 0);
      const approxTotal = allPortfolios
        .filter(p => p.approximateData)
        .reduce((s, p) => s + (p.totalValue || 0), 0);

      return { stocks: merged, totalValue: normalTotal + approxTotal, approxTotal };
    }
    // 개별 계좌: livePrices 반영해서 totalValue 재계산
    const p = portfolios[activeAccount];
    if (!p) return null;
    if (p.approximateData) return p; // 금액기준 계좌는 그대로
    const stocks = (p.stocks || []).map(s => {
      const cur = livePrices[s.ticker] || s.currentPrice;
      return { ...s, currentValue: cur * s.quantity };
    });
    const totalValue = stocks.reduce((sum, s) => sum + s.currentValue, 0);
    return { ...p, stocks, totalValue };
  })();

  const allDone = images.length > 0 && images.every(i => !i.loading);

  function shareText() {
    const lines = ["📊 존버일기장 매매기록\n"];
    mergedStocks.forEach(s => {
      lines.push(`▶ ${s.ticker} | 평균 ${s.avgBuyPrice?.toLocaleString()}원`);
      s.trades.forEach(t => lines.push(`  ${t.date} ${t.type} ${t.price?.toLocaleString()}원`));
    });
    lines.push("\n#주식 #존버일기장 #포트폴리오");
    return lines.join("\n");
  }

  return (
    <div style={S.page}>
      {/* 메인화면 편집 모달 - contentEditable + Range API (모바일 안전) */}
      {editingMain && (
        <div style={S.overlay}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, width: "92vw", maxWidth: 480, textAlign: "left", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>✏️ 메인화면 편집</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>텍스트를 드래그해서 선택 후 아래 버튼으로 스타일 적용</div>

            {/* 툴바 */}
            <div style={{ background: "#f1f5f9", borderRadius: 10, padding: "10px", marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>

              {/* 1행: 폰트 크기 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 28 }}>크기</span>
                {[12,14,16,18,20,24,28,32,40].map(sz => (
                  <button key={sz} onClick={() => {
                    const el = document.getElementById("richEditor");
                    if (!el) return;
                    el.focus();
                    const sel = window.getSelection();
                    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
                    const range = sel.getRangeAt(0);
                    const frag = range.extractContents();
                    // 기존 중첩 span의 font-size를 모두 제거해서 새 크기가 정확히 적용되게
                    frag.querySelectorAll && frag.querySelectorAll("[style]").forEach(el2 => {
                      el2.style.removeProperty("font-size");
                    });
                    const wrapper = document.createElement("span");
                    wrapper.style.fontSize = sz + "px";
                    // lineHeight 제거 - 부모 요소와 충돌해서 공백처럼 보이는 원인
                    wrapper.appendChild(frag);
                    range.insertNode(wrapper);
                    range.setStartAfter(wrapper);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                  }} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 5, color: "#94a3b8", padding: "3px 6px", fontSize: 10, cursor: "pointer" }}>
                    {sz}
                  </button>
                ))}
              </div>

              {/* 2행: 스타일 + 정렬 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 28 }}>스타일</span>
                {[
                  { label: "B", tag: "strong" },
                  { label: "I", tag: "em" },
                  { label: "U", tag: "u" },
                ].map(b => (
                  <button key={b.label} onClick={() => {
                    const el = document.getElementById("richEditor");
                    if (!el) return; el.focus();
                    const sel = window.getSelection();
                    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
                    const range = sel.getRangeAt(0);
                    const frag = range.extractContents();
                    const wrapper = document.createElement(b.tag);
                    wrapper.appendChild(frag);
                    range.insertNode(wrapper);
                    range.setStartAfter(wrapper); range.collapse(true);
                    sel.removeAllRanges(); sel.addRange(range);
                  }} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 5, color: "#94a3b8", padding: "3px 10px", fontSize: 13, cursor: "pointer",
                    fontWeight: b.label === "B" ? 700 : "normal",
                    fontStyle: b.label === "I" ? "italic" : "normal",
                    textDecoration: b.label === "U" ? "underline" : "none",
                  }}>
                    {b.label}
                  </button>
                ))}
                <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>정렬</span>
                {[
                  { label: "◀좌", align: "left" },
                  { label: "■중", align: "center" },
                  { label: "▶우", align: "right" },
                ].map(a => (
                  <button key={a.align} onClick={() => {
                    const el = document.getElementById("richEditor");
                    if (!el) return; el.focus();
                    const sel = window.getSelection();
                    if (!sel || sel.rangeCount === 0) return;
                    const range = sel.getRangeAt(0);
                    let block = range.commonAncestorContainer;
                    if (block.nodeType === 3) block = block.parentElement;
                    while (block && block !== el && !["P","DIV","H1","H2","H3","LI"].includes(block.tagName)) block = block.parentElement;
                    if (block && block !== el) block.style.textAlign = a.align;
                    else el.style.textAlign = a.align;
                  }} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 5, color: "#94a3b8", padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>
                    {a.label}
                  </button>
                ))}
              </div>

              {/* 3행: 색깔 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 28 }}>색</span>
                {["#1e293b","#f59e0b","#16a34a","#60a5fa","#a78bfa","#ef4444","#f97316","#ec4899","#94a3b8"].map(c => (
                  <button key={c} title={c} onClick={() => {
                    const el = document.getElementById("richEditor");
                    if (!el) return; el.focus();
                    const sel = window.getSelection();
                    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
                    const range = sel.getRangeAt(0);
                    const frag = range.extractContents();
                    const wrapper = document.createElement("span");
                    wrapper.style.color = c;
                    wrapper.appendChild(frag);
                    range.insertNode(wrapper);
                    range.setStartAfter(wrapper); range.collapse(true);
                    sel.removeAllRanges(); sel.addRange(range);
                  }} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: "2px solid #334155", cursor: "pointer", flexShrink: 0 }} />
                ))}
                <input type="color" title="직접 선택" defaultValue="#ffffff"
                  onChange={e => {
                    const c = e.target.value;
                    const el = document.getElementById("richEditor");
                    if (!el) return; el.focus();
                    const sel = window.getSelection();
                    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
                    const range = sel.getRangeAt(0);
                    const frag = range.extractContents();
                    const wrapper = document.createElement("span");
                    wrapper.style.color = c;
                    wrapper.appendChild(frag);
                    range.insertNode(wrapper);
                    range.setStartAfter(wrapper); range.collapse(true);
                    sel.removeAllRanges(); sel.addRange(range);
                  }}
                  style={{ width: 22, height: 22, border: "2px solid #334155", borderRadius: "50%", cursor: "pointer", padding: 0, background: "none" }}
                />
              </div>



              {/* 4행: 이미지 + 초기화 */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <label style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, color: "#94a3b8", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                  🖼️ 이미지 업로드
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const el = document.getElementById("richEditor");
                        if (!el) return;
                        el.focus();
                        const img = document.createElement("img");
                        img.src = ev.target.result;
                        img.style.cssText = "max-width:100%;border-radius:8px;margin:8px 0;display:block;";
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0) {
                          const range = sel.getRangeAt(0);
                          range.collapse(false);
                          range.insertNode(img);
                        } else {
                          el.appendChild(img);
                        }
                        // 저장 시 innerHTML 읽음
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button onClick={() => {
                  const defaultHtml = '<div style="text-align:center"><span style="font-size:40px">🐜</span><br/><span style="font-size:22px;font-weight:900;color:#e2e8f0">존버일기장</span><br/><br/><span style="font-size:18px;font-weight:700;color:#f59e0b">존버는 승리한다.<br/>왜냐하면 승리하기 때문이다.</span></div>';
                  if (richEditorRef.current) richEditorRef.current.innerHTML = defaultHtml;
                  setEditDraft(d => ({ ...d, html: null }));
                }} style={{ background: "#fef2f2", border: "1px solid #7f1d1d", borderRadius: 6, color: "#ef4444", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                  🔄 기본값
                </button>
              </div>
            </div>

            {/* 편집 영역 */}
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>✍️ 여기서 직접 편집하세요</div>
            <div
              id="richEditor"
              ref={richEditorRef}
              contentEditable
              suppressContentEditableWarning
              style={{
                minHeight: 180,
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "20px 16px",
                color: "#1e293b",
                fontSize: 16,
                lineHeight: 1.7,
                outline: "none",
                marginBottom: 8,
                textAlign: "center",
              }}
            />
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 14 }}>
              💡 텍스트 드래그 선택 → 위 버튼으로 스타일 적용 / 직접 타이핑도 가능
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btnSub, flex: 1 }} onClick={() => setEditingMain(false)}>취소</button>
              <button style={{ ...S.btnMain, flex: 1 }} onClick={() => {
                const html = richEditorRef.current ? richEditorRef.current.innerHTML : null;
                saveMainText(html);
              }}>저장</button>
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

      {/* 종목 편집 모달 */}
      {editStockModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 300 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>✏️ 종목 수정</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>{editStockModal.stock.ticker}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>보유 수량 (주)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  type="number" placeholder="예: 100"
                  value={editStockQty} onChange={e => setEditStockQty(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>매수 평단가 (원)</div>
                <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  type="number" placeholder="예: 85000"
                  value={editStockAvg} onChange={e => setEditStockAvg(e.target.value)} />
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

      {addAccModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 300 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>➕ 계좌 추가</div>
            <div style={{ textAlign: "left", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>계좌명</div>
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
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
              {accounts.find(a => a.id === manualModal.accountId)?.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>종목명</div>
                <input
                  style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  placeholder="예: SK하이닉스"
                  value={manualTicker}
                  onChange={e => setManualTicker(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>종목코드 <span style={{ color: "#94a3b8" }}>(선택 — 입력하면 현재가 자동 갱신)</span></div>
                <input
                  style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  placeholder="예: 000660 (숫자 6자리)"
                  value={manualTickerCode}
                  onChange={e => setManualTickerCode(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>보유 수량 (주)</div>
                <input
                  style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  type="number" placeholder="예: 10"
                  value={manualQty}
                  onChange={e => setManualQty(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>매수 평단가 (원)</div>
                <input
                  style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                  type="number" placeholder="예: 185000"
                  value={manualAvg}
                  onChange={e => setManualAvg(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>현재가 (원, 선택)</div>
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
          {/* 다크/라이트 모드 토글 */}
          <button onClick={toggleDarkMode}
            style={{ background: darkMode ? "#1e293b" : "#ede8e0", border: `1px solid ${darkMode ? "#334155" : "#d6cfc4"}`, borderRadius: 8, padding: "4px 8px", fontSize: 14, cursor: "pointer", lineHeight: 1 }}
            title={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowWealth(v => !v)}
              style={{
                background: showWealth ? "#f0fdf4" : "#f1f5f9",
                border: showWealth ? "1px solid #22c55e" : "1px solid #cbd5e1",
                borderRadius: 8, color: showWealth ? "#15803d" : "#94a3b8",
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
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>여러 날짜 누적 저장 가능</div>
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
                    {img.result && !img.loading && <span style={{ color: "#16a34a" }}>✅ {img.result.stocks?.length}개 종목</span>}
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
              <div style={{ fontSize: 12, color: "#94a3b8" }}>📈 계좌별 포트폴리오 업로드</div>
              <button style={{ background: "#f0fdf4", border: "1px solid #166534", borderRadius: 8, color: "#16a34a", padding: "4px 10px", fontSize: 12, cursor: "pointer" }} onClick={() => setAddAccModal(true)}>➕ 계좌 추가</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{acc.name}</span>
                    {portfolios[acc.id] && (
                      <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 8 }}>
                        ✅ {portfolios[acc.id].stocks?.length}종목
                        {portfolios[acc.id].approximateData && (
                          <span style={{ fontSize: 10, color: "#f59e0b", marginLeft: 4 }}>⚠️ 금액기준</span>
                        )}
                      </span>
                    )}
                  </div>
                  <button
                    style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, color: "#94a3b8", padding: "5px 12px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                    disabled={portfolioLoading === acc.id}
                    onClick={() => { setUploadingAccount(acc.id); setTimeout(() => portfolioRef.current?.click(), 50); }}>
                    {portfolioLoading === acc.id ? "⏳" : "📤 업로드"}
                  </button>
                  <button
                    style={{ background: "#f0fdf4", border: "1px solid #166534", borderRadius: 8, color: "#16a34a", padding: "5px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                    onClick={() => { setManualModal({ accountId: acc.id }); setManualTicker(""); setManualQty(""); setManualAvg(""); setManualPrice(""); }}>
                    ✏️
                  </button>
                  {portfolios[acc.id] && (
                    <button
                      style={{ background: "#fef2f2", border: "1px solid #7f1d1d", borderRadius: 8, color: "#ef4444", padding: "5px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                      onClick={() => clearPortfolio(acc.id)}>
                      🗑️
                    </button>
                  )}
                  <button
                    style={{ background: "#fef2f2", border: "1px solid #7f1d1d", borderRadius: 8, color: "#94a3b8", padding: "5px 8px", fontSize: 11, cursor: "pointer", flexShrink: 0 }}
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
          {/* 메인 탭 3개 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setActiveTab("portfolio")}
              style={{ flex: 1, padding: "10px 4px", fontSize: 11, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                background: activeTab === "portfolio" ? (darkMode ? "#1a2a1a" : "#dcfce7") : S.tabInactive,
                borderColor: activeTab === "portfolio" ? "#15803d" : S.tabBorderInactive,
                color: activeTab === "portfolio" ? (darkMode ? "#22c55e" : "#15803d") : S.tabTextInactive,
              }}>
              📊 포트폴리오
            </button>
            <button onClick={() => {
              setActiveTab("history");
              if (allRecords.length > 0) {
                const allDates = allRecords.flatMap(r => r.result?.stocks || []).flatMap(s => s.trades || []).map(t => t.date).sort();
                const latest = allDates[allDates.length - 1];
                if (latest) {
                  const d = new Date(latest);
                  d.setDate(d.getDate() - 6);
                  setStartDate(d.toISOString().split("T")[0]);
                  setEndDate(latest);
                  setDateError("");
                }
              }
            }}
              style={{ flex: 1, padding: "10px 4px", fontSize: 11, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                background: activeTab === "history" ? (darkMode ? "#1a1a2a" : "#ede9fe") : S.tabInactive,
                borderColor: activeTab === "history" ? (darkMode ? "#6366f1" : "#7c3aed") : S.tabBorderInactive,
                color: activeTab === "history" ? (darkMode ? "#a78bfa" : "#6d28d9") : S.tabTextInactive,
              }}>
              📋 매매기록
            </button>
            <button onClick={() => setActiveTab("diary")}
              style={{ flex: 1, padding: "10px 4px", fontSize: 11, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                background: activeTab === "diary" ? (darkMode ? "#1a1500" : "#fef9c3") : S.tabInactive,
                borderColor: activeTab === "diary" ? (darkMode ? "#f59e0b" : "#ca8a04") : S.tabBorderInactive,
                color: activeTab === "diary" ? (darkMode ? "#f59e0b" : "#92400e") : S.tabTextInactive,
              }}>
              🐜 존버기록실
            </button>
          </div>

          {/* 포트폴리오 탭 */}
          {activeTab === "portfolio" && (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
                {[{ id: "all", name: "전체합산" }, ...accounts].map(acc => (
                  <button key={acc.id} onClick={() => { setActiveAccount(acc.id); setPortfolioEditMode(false); }}
                    style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "1px solid", whiteSpace: "nowrap", flexShrink: 0,
                      background: activeAccount === acc.id ? "#eff6ff" : "#ffffff",
                      borderColor: activeAccount === acc.id ? "#3b82f6" : "#f1f5f9",
                      color: activeAccount === acc.id ? "#60a5fa" : "#94a3b8",
                    }}>
                    {acc.name}
                    {acc.id !== "all" && portfolios[acc.id] && <span style={{ color: "#16a34a", marginLeft: 4 }}>●</span>}
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          {lastUpdated ? `📅 ${lastUpdated} 기준 주가를 갱신했습니다.` : ""}
                        </span>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          {isAdmin && activeAccount !== "all" && (
                            <button
                              onClick={() => setPortfolioEditMode(v => !v)}
                              style={{
                                background: portfolioEditMode ? "#eff6ff" : "#f1f5f9",
                                border: portfolioEditMode ? "1px solid #60a5fa" : "1px solid #cbd5e1",
                                borderRadius: 8, color: portfolioEditMode ? "#60a5fa" : "#94a3b8",
                                padding: "4px 10px", fontSize: 12, cursor: "pointer"
                              }}>
                              {portfolioEditMode ? "✏️ 편집 종료" : "✏️ 종목 편집"}
                            </button>
                          )}
                          <button
                            onClick={() => {
            const all = Object.values(portfolios).flatMap(p => p.stocks||[]);
            // ✅ approximateData 종목은 현재가 갱신 제외 (퇴직연금DC 등 금액기준 종목)
            const filtered = all.filter(s => !s.approximateData);
            const unique = [...new Map(filtered.map(s=>[s.ticker,s])).values()];
            fetchLivePrices(unique);
          }}
                            disabled={priceLoading}
                            style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, color: priceLoading ? "#60a5fa" : "#94a3b8", padding: "4px 12px", fontSize: 12, cursor: priceLoading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            {priceLoading ? <><span className="spinner" /><span>갱신 중...</span></> : "🔄 현재가 갱신"}
                          </button>
                        </div>
                      </div>
                      {priceLoading && (
                        <div style={{ fontSize: 11, color: "#60a5fa", marginTop: 6, textAlign: "right" }}>
                          잠시만 기다려주세요, 현재 가격을 갱신 중입니다.
                        </div>
                      )}
                    </div>
                    {showWealth && displayPortfolio && (
                      <div style={{ background: "#f0fdf4", border: "1px solid #166534", borderRadius: 12, padding: "12px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>🔓 총 보유금액</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: "#15803d" }}>
                          {(displayPortfolio.totalValue || 0).toLocaleString()}원
                        </span>
                      </div>
                    )}
                    {activeAccount === "all" && displayPortfolio.approxTotal > 0 && (
                      <div style={{ background: "#fffbeb", border: "1px solid #b45309", borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 11, color: "#f59e0b", display: "flex", justifyContent: "space-between" }}>
                        <span>⚠️ 금액기준 계좌(DC 등) 종목은 차트 제외</span>
                        <span style={{ fontWeight: 700 }}>+{displayPortfolio.approxTotal.toLocaleString()}원 포함</span>
                      </div>
                    )}
                    <PortfolioChart isAdmin={isAdmin} showWealth={showWealth}
                      onEdit={(activeAccount !== "all" && portfolioEditMode) ? (s) => {
                        // 원본 stock 데이터 찾기
                        const origStock = portfolios[activeAccount]?.stocks?.find(st => st.ticker === s.ticker);
                        if (origStock) {
                          setEditStockModal({ accountId: activeAccount, stock: origStock });
                          setEditStockQty(String(origStock.quantity || ""));
                          setEditStockAvg(String(origStock.avgBuyPrice || ""));
                        }
                      } : null}
                      data={displayPortfolio.stocks?.map(s => {
                        const currentPrice = livePrices[s.ticker] || s.currentPrice;
                        const value = s.isOverseas
                          ? (livePrices[s.ticker] ? livePrices[s.ticker] * s.quantity : s.currentValue)
                          : currentPrice * s.quantity;
                        return { ticker: s.ticker, value, avgBuy: s.isOverseas ? null : s.avgBuyPrice, current: s.isOverseas ? livePrices[s.ticker] || null : currentPrice, qty: s.quantity, isOverseas: s.isOverseas, returnRate: s.returnRate };
                      })} />
                  </>
                : <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>
                      {activeAccount === "all" ? "등록된 계좌가 없어요" : "아직 포트폴리오 등록이 되지 않았습니다."}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
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
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>📅 조회 기간 설정</div>
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
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>시작일</span>
                      <input type="date" value={startDate}
                        onChange={e => { const v = e.target.value; if (endDate && v > endDate) setDateError("시작일이 종료일보다 빠를 수 없습니다."); else { setDateError(""); setStartDate(v); } }}
                        style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, color: "#1e293b", padding: "6px 10px", fontSize: 13, outline: "none" }} />
                    </div>
                    <div style={{ color: "#94a3b8", paddingBottom: 8 }}>~</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>종료일</span>
                      <input type="date" value={endDate}
                        onChange={e => { const v = e.target.value; if (startDate && v < startDate) setDateError("시작일이 종료일보다 빠를 수 없습니다."); else { setDateError(""); setEndDate(v); } }}
                        style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, color: "#1e293b", padding: "6px 10px", fontSize: 13, outline: "none" }} />
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
                    background: historySubTab === "buy" ? "#fef2f2" : "#ffffff",
                    borderColor: historySubTab === "buy" ? "#ef4444" : "#f1f5f9",
                    color: historySubTab === "buy" ? "#ef4444" : "#94a3b8",
                  }}>
                  🔴 매수 기록
                </button>
                <button onClick={() => setHistorySubTab("sell")}
                  style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid",
                    background: historySubTab === "sell" ? "#eff6ff" : "#ffffff",
                    borderColor: historySubTab === "sell" ? "#3b82f6" : "#f1f5f9",
                    color: historySubTab === "sell" ? "#3b82f6" : "#94a3b8",
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
                  <div style={{ background: "#f0fdf4", border: "1px solid #166534", borderRadius: 12, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>🔓 총 {historySubTab === "buy" ? "매수" : "매도"}금액</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#15803d" }}>
                      {(historySubTab === "buy" ? totalBuy : totalSell).toLocaleString()}원
                    </span>
                  </div>
                );
              })()}

              {/* 데이터 없을 때 */}
              {allRecords.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 14 }}>아직 저장된 매매기록이 없어요</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>관리자 로그인 후 이미지를 업로드해주세요</div>
                </div>
              )}

              {allRecords.length > 0 && displayStocks.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: 14 }}>
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
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>종목명</div>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{stock.ticker}</span>
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>{historySubTab === "buy" ? "매수비중" : "매도비중"}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: historySubTab === "buy" ? "#ef4444" : "#3b82f6" }}>{Number(pct).toFixed(1)}%</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>{historySubTab === "buy" ? "매수평단" : "매도평단"}</div>
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
                              <span style={{ color: "#94a3b8", minWidth: 76 }}>{g.date}</span>
                              <span style={{ fontWeight: 700, color: g.type === "매수" ? "#ef4444" : "#3b82f6", minWidth: 24 }}>{g.type}</span>
                              <span style={{ color: "#94a3b8", flex: 1 }}>평단 {avgP?.toLocaleString()}원</span>
                              {showWealth && <span style={{ color: "#15803d", fontWeight: 600 }}>{g.totalQty}주 · {g.totalAmt?.toLocaleString()}원</span>}
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
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, marginTop: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>공유 텍스트</div>
                  <pre style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#94a3b8", whiteSpace: "pre-wrap", marginBottom: 10, border: "1px solid #e2e8f0", fontFamily: "monospace" }}>{shareText()}</pre>
                  <button style={S.btnMain} onClick={() => { navigator.clipboard.writeText(shareText()).then(() => { setShareMsg("✅ 복사됐어요!"); setTimeout(() => setShareMsg(""), 2500); }); }}>📋 텍스트 복사</button>
                  {shareMsg && <p style={{ color: "#16a34a", fontSize: 13, marginTop: 8 }}>{shareMsg}</p>}
                </div>
              )}
            </>
          )}

          {/* 🐜 존버일기장 탭 */}
          {activeTab === "diary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

              {/* 편집/삭제 모달 */}
              {diaryEditModal && (
                <div style={S.overlay}>
                  <div style={{ ...S.modal, width: 320, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>✏️ 글 수정</div>
                    {!isAdmin && diaryEditModal.password && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>비밀번호</div>
                        <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                          type="password" placeholder="작성 시 입력한 비밀번호"
                          value={diaryEditPw} onChange={e => setDiaryEditPw(e.target.value)} />
                      </div>
                    )}
                    <textarea style={{ width: "100%", minHeight: 100, background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, color: "#1e293b", fontSize: 13, padding: "10px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                      value={diaryEditText} onChange={e => setDiaryEditText(e.target.value)} />
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
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🗑️ 글 삭제</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>정말 삭제할까요? 되돌릴 수 없어요.</div>
                    {!isAdmin && diaryDeleteModal.password && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>비밀번호</div>
                        <input style={{ ...S.pinInput, fontSize: 14, letterSpacing: 0, textAlign: "left", padding: "8px 12px" }}
                          type="password" placeholder="작성 시 입력한 비밀번호"
                          value={diaryDeletePw} onChange={e => setDiaryDeletePw(e.target.value)} />
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setDiaryDeleteModal(null); setDiaryDeletePw(""); }}>취소</button>
                      <button style={{ ...S.btnDanger, flex: 1 }} onClick={deleteDiaryPost}>삭제</button>
                    </div>
                  </div>
                </div>
              )}

              {/* 메시지 목록 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, minHeight: 200 }}>
                {diaryPosts.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🐜</div>
                    <div style={{ fontSize: 13 }}>아직 작성된 글이 없어요</div>
                  </div>
                )}
                {diaryPosts.map(post => {
                  // 오른쪽 표시 조건:
                  // - 관리자로 로그인 중 + 관리자가 쓴 글
                  // - 내 세션ID로 작성한 글 (조회자 본인 글)
                  const isMine = (isAdmin && post.isAdmin) || post.sessionId === mySessionId;
                  const isSecretHidden = post.isSecret && !isAdmin;
                  const timeStr = new Date(post.createdAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
                  const editStr = post.editedAt ? new Date(post.editedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

                  return (
                    <div key={post.id} style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
                      {/* 아바타 */}
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: isMine ? "#eff6ff" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                        {post.isAdmin ? "🐜" : isMine ? "😊" : "👤"}
                      </div>
                      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 2 }}>
                        {/* 닉네임 */}
                        <div style={{ fontSize: 11, color: darkMode ? "#cbd5e1" : "#374151", fontWeight: 600, marginBottom: 2, paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0 }}>
                          {post.isSecret && <span style={{ marginRight: 4 }}>🔒</span>}
                          {post.nickname}
                        </div>
                        {/* 답글 미리보기 */}
                        {post.replyPreview && (
                          <div style={{ background: darkMode ? "#1e293b" : "#ede8e0", borderLeft: isMine ? "none" : "2px solid #6366f1", borderRight: isMine ? "2px solid #6366f1" : "none", padding: "4px 8px", borderRadius: 6, fontSize: 11, color: darkMode ? "#94a3b8" : "#374151", maxWidth: "100%" }}>
                            {post.replyPreview}
                          </div>
                        )}
                        {/* 말풍선 */}
                        <div style={{
                          background: isMine ? "#eff6ff" : "#ffffff",
                          border: `1px solid ${isMine ? "#3b82f6" : "#f1f5f9"}`,
                          borderRadius: isMine ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                          padding: "10px 14px",
                          fontSize: 13,
                          color: isSecretHidden ? "#9ca3af" : "#111827",
                          lineHeight: 1.6,
                          fontStyle: isSecretHidden ? "italic" : "normal",
                        }}>
                          {isSecretHidden ? "🔒 비밀글입니다" : post.text}
                          {!isSecretHidden && post.linkUrl && (() => {
                            const preview = linkPreviews[post.id];
                            if (preview?.title) {
                              return (
                                <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 8, textDecoration: "none" }}>
                                  <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                                    {preview.image && <img src={preview.image} alt="" style={{ width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />}
                                    <div style={{ padding: "8px 10px" }}>
                                      {preview.domain && <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 3 }}>{preview.domain}</div>}
                                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>{preview.title}</div>
                                      {preview.description && <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{preview.description}</div>}
                                    </div>
                                  </div>
                                </a>
                              );
                            }
                            return (
                              <a href={post.linkUrl} target="_blank" rel="noopener noreferrer"
                                style={{ display: "block", marginTop: 6, color: "#60a5fa", fontSize: 11, wordBreak: "break-all" }}>
                                🔗 {post.linkUrl}
                              </a>
                            );
                          })()}
                        </div>
                        {/* 시간 + 수정됨 + 액션 버튼 */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: isMine ? "row-reverse" : "row" }}>
                          <span style={{ fontSize: 10, color: darkMode ? "#94a3b8" : "#4b5563", fontWeight: 500 }}>{timeStr}{editStr ? ` · ${editStr} 수정됨` : ""}</span>
                          {/* 답글 버튼 */}
                          {isViewer && (
                            <button onClick={() => { setDiaryReplyTo(post); setDiaryWriting(true); }}
                              style={{ background: "none", border: "none", color: darkMode ? "#60a5fa" : "#2563eb", fontSize: 11, cursor: "pointer", padding: "0 2px", fontWeight: 600 }}>
                              ↩ 답글
                            </button>
                          )}
                          {/* 수정/삭제 - 관리자 또는 비밀번호 있는 글 작성자 */}
                          {(isAdmin || post.password) && !isSecretHidden && (
                            <>
                              <button onClick={() => { setDiaryEditModal(post); setDiaryEditText(post.text); }}
                                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 10, cursor: "pointer", padding: "0 2px" }}>
                                수정
                              </button>
                              <button onClick={() => setDiaryDeleteModal(post)}
                                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 10, cursor: "pointer", padding: "0 2px" }}>
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 글쓰기 영역 */}
              {isViewer && (
                <div style={{ position: "sticky", bottom: 0, background: "#f8fafc", paddingTop: 8 }}>
                  {!diaryWriting ? (
                    <button onClick={() => setDiaryWriting(true)}
                      style={{ ...S.btnMain, width: "100%", fontSize: 13 }}>
                      ✏️ 글 작성하기
                    </button>
                  ) : (
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 14 }}>
                      {/* 답글 미리보기 */}
                      {diaryReplyTo && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f1f5f9", borderLeft: "2px solid #6366f1", padding: "6px 10px", borderRadius: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>↩ {diaryReplyTo.nickname}: {diaryReplyTo.text.slice(0, 30)}...</span>
                          <button onClick={() => setDiaryReplyTo(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>✕</button>
                        </div>
                      )}
                      {/* 닉네임 + 비밀번호 (조회자만) */}
                      {!isAdmin && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <input style={{ ...S.pinInput, flex: 1, fontSize: 13, letterSpacing: 0, textAlign: "left", padding: "7px 10px" }}
                            placeholder="닉네임 (익명)" value={diaryNickname} onChange={e => setDiaryNickname(e.target.value)} />
                          <input style={{ ...S.pinInput, flex: 1, fontSize: 13, letterSpacing: 0, textAlign: "left", padding: "7px 10px" }}
                            type="password" placeholder="비밀번호 (수정/삭제용)" value={diaryPassword} onChange={e => setDiaryPassword(e.target.value)} />
                        </div>
                      )}
                      {/* 링크 (관리자만) */}
                      {isAdmin && (
                        <input style={{ ...S.pinInput, fontSize: 12, letterSpacing: 0, textAlign: "left", padding: "7px 10px", marginBottom: 4 }}
                          placeholder="🔗 링크 URL (선택)" value={diaryLinkUrl}
                          onChange={e => {
                            setDiaryLinkUrl(e.target.value);
                            setPreviewDraft(null);
                          }}
                          onBlur={e => { if (e.target.value) fetchLinkPreview(e.target.value, null); }}
                        />
                      )}
                      {/* 링크 미리보기 초안 */}
                      {isAdmin && previewDraft && (
                        <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
                          {previewDraft.image && <img src={previewDraft.image} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />}
                          <div style={{ padding: "8px 10px" }}>
                            {previewDraft.domain && <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>{previewDraft.domain}</div>}
                            {previewDraft.title && <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>{previewDraft.title}</div>}
                            {previewDraft.description && <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{previewDraft.description}</div>}
                          </div>
                        </div>
                      )}
                      {/* 본문 */}
                      <textarea style={{ width: "100%", minHeight: 80, background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, color: "#1e293b", fontSize: 13, padding: "10px", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6, marginBottom: 8 }}
                        placeholder="내용을 입력하세요..."
                        value={diaryText} onChange={e => setDiaryText(e.target.value)} />
                      {/* 비밀글 토글 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <button onClick={() => setDiarySecret(v => !v)}
                          style={{ background: diarySecret ? "#fffbeb" : "#f1f5f9", border: `1px solid ${diarySecret ? "#f59e0b" : "#cbd5e1"}`, borderRadius: 8, color: diarySecret ? "#f59e0b" : "#94a3b8", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                          {diarySecret ? "🔒 비밀글" : "🔓 공개글"}
                        </button>
                        {diarySecret && <span style={{ fontSize: 10, color: "#94a3b8" }}>주인장만 볼 수 있어요</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ ...S.btnSub, flex: 1 }} onClick={() => { setDiaryWriting(false); setDiaryText(""); setDiaryReplyTo(null); setDiaryNickname(""); setDiaryPassword(""); setDiaryLinkUrl(""); setDiarySecret(false); }}>취소</button>
                        <button style={{ ...S.btnMain, flex: 1 }} onClick={addDiaryPost}>올리기</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!isViewer && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          {mainText.html
            ? <div dangerouslySetInnerHTML={{ __html: mainText.html }} style={{ marginBottom: 24, lineHeight: 1.7 }} />
            : <>
                <div style={{ fontSize: 56, marginBottom: 8 }}>{mainText.emoji}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#1e293b", marginBottom: 4 }}>{mainText.title}</div>
                <div style={{ fontSize: 20, color: "#f59e0b", fontWeight: 900, marginBottom: 24, lineHeight: 1.7 }}>
                  {mainText.subtitle.split("\n").map((line, i) => <span key={i}>{line}{i < mainText.subtitle.split("\n").length - 1 && <br/>}</span>)}
                </div>
              </>
          }
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, maxWidth: 320, margin: "0 auto" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📋 조회 코드 입력</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>포트폴리오 및 매매 평단 리스트</div>
            <input style={{ ...S.pinInput, marginBottom: 12 }} type="password" inputMode="numeric" maxLength={6} placeholder="코드 입력"
              value={viewerPinInput} onChange={e => setViewerPinInput(e.target.value)} onKeyDown={e => e.key === "Enter" && checkViewerPin()} />
            {viewerPinError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{viewerPinError}</div>}
            <button style={{ ...S.btnMain, width: "100%" }} onClick={checkViewerPin}>입장하기</button>
          </div>
          <div style={{ marginTop: 40, fontSize: 11, color: "#cbd5e1" }}>관리자는 우측 상단 버튼을 이용하세요</div>
        </div>
      )}
    </div>
  );
}

// 다크모드/라이트모드 색상 팔레트
function getTheme(dark) {
  if (dark) return {
    // 다크모드 (v8.3 이전 원본)
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
    // 테마 식별용
    bg: "#0a0f1e", cardBg: "#111827", cardBorder: "#1e293b",
    text: "#e2e8f0", textSub: "#94a3b8", textMuted: "#64748b",
    border: "#334155", inputBg: "#0f172a",
    sectionBg: "#0f172a", tabInactive: "#111827", tabBorderInactive: "#1e293b",
    tabTextInactive: "#64748b",
  };
  return {
    // 라이트모드 (베이지 따뜻한 톤)
    page: { minHeight: "100vh", background: "#f5f0eb", color: "#1a1a2e", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: "20px 14px 60px", maxWidth: 720, margin: "0 auto" },
    header: { textAlign: "center", marginBottom: 20 },
    logoRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
    logoText: { fontSize: 22, fontWeight: 700, background: "linear-gradient(90deg,#2563eb,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    verBadge: { background: "#ede8e0", color: "#6b7280", border: "1px solid #d6cfc4", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 600 },
    loginTag: { background: "#ede8e0", color: "#374151", border: "1px solid #d6cfc4", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" },
    adminTag: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" },
    sub: { color: "#4b5563", fontSize: 13, margin: 0 },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modal: { background: "#faf7f3", border: "1px solid #d6cfc4", borderRadius: 16, padding: 24, width: 260, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" },
    pinInput: { width: "100%", background: "#ffffff", border: "2px solid #d6cfc4", borderRadius: 10, color: "#1a1a2e", fontSize: 20, padding: "10px", textAlign: "center", outline: "none", boxSizing: "border-box", letterSpacing: 8 },
    drop: { border: "2px dashed #c8bfb4", borderRadius: 14, padding: "24px 16px", textAlign: "center", cursor: "pointer", marginBottom: 12, background: "#ede8e0" },
    dropOn: { borderColor: "#2563eb", background: "#eff6ff" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8, marginBottom: 12 },
    card: { background: "#faf7f3", border: "1px solid #d6cfc4", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
    thumb: { width: "100%", height: 100, objectFit: "cover", display: "block" },
    xBtn: { position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 9 },
    stockCard: { background: "#faf7f3", border: "1px solid #d6cfc4", borderRadius: 12, padding: 14, marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
    insight: { marginTop: 8, padding: "6px 10px", background: "#ede8e0", borderRadius: 6, fontSize: 11, color: "#4b5563", borderLeft: "3px solid #7c3aed" },
    btnMain: { background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    btnSub: { background: "#ede8e0", color: "#374151", border: "1px solid #d6cfc4", borderRadius: 10, padding: "10px 14px", fontSize: 13, cursor: "pointer" },
    btnDanger: { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    // 테마 식별용
    bg: "#f5f0eb", cardBg: "#faf7f3", cardBorder: "#d6cfc4",
    text: "#1a1a2e", textSub: "#374151", textMuted: "#4b5563",
    border: "#d6cfc4", inputBg: "#ffffff",
    sectionBg: "#ede8e0", tabInactive: "#ede8e0", tabBorderInactive: "#d6cfc4",
    tabTextInactive: "#1a1a2e",
  };
}



