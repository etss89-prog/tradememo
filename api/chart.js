// ✅ 종목코드 자동 조회 (v1.5.30)
// 예전에는 아래 TICKER_MAP에 없는 종목은 "종목코드 없음"으로 바로 실패했음 → 새로 매수한 종목마다
// 코드를 직접 추가해야 했던 원인. 이제 TICKER_MAP(검증된 코드) → 메모리 캐시 → 네이버 자동완성 →
// KRX 상장종목 목록 순으로 종목명을 직접 검색해서 코드를 찾는다. TICKER_MAP은 "빠른 길"일 뿐 필수가 아님.
const TICKER_MAP = {
  "SK하이닉스": "000660", "LG전자우": "066575", "한솔테크닉스": "004710",
  "기가비스": "420770", "그리드위즈": "453450", "OCI홀딩스": "010060",
  "한화솔루션": "009830", "유니테스트": "086390", "대한전선": "001440",
  "SK오션플랜트": "100090", "아톤": "158430", "원익QnC": "074600",
  "해성디에스": "195870", "산일전기": "062040", "현대차": "005380",
  "마이크로컨텍솔": "098120", "티에프피": "149530", "한화솔루션우": "009835",
  "에이엘티": "172670", "지투파워": "388050", "상아프론테크": "089980",
  "시지트로닉스": "049630", "켐트로닉스": "089010", "현대차2우B": "005387",
  "가온칩스": "399720", "SK이노베이션우": "096775", "펄어비스": "263750",
  "SK이노베이션": "096770", "티에스이": "131290", "뉴로메카": "348340",
  "누리플렉스": "040160", "뉴프렉스": "085670", "RF머트리얼즈": "327260",
  "삼성전자": "005930", "삼성전자우": "005935", "SK텔레콤": "017670",
  "카카오": "035720", "네이버": "035420", "NAVER": "035420",
  "LG에너지솔루션": "373220", "삼성SDI": "006400", "현대모비스": "012330",
  "POSCO홀딩스": "005490", "셀트리온": "068270", "기아": "000270",
  "KB금융": "105560", "신한지주": "055550", "하나금융지주": "086790",
  "삼성바이오로직스": "207940", "HD현대에너지솔루션": "322000",
  "아이앤씨": "052860", "티에프이": "425420",
};

const KOSDAQ_CODES = new Set([
  "086390","420770","453450","004710","158430","074600","195870","098120",
  "149530","172670","388050","089980","049630","089010","399720","263750",
  "131290","348340","271940","328130","040160","085670","327260","068270",
  "052860","425420","100090",
]);

// ===== 종목명 → 종목코드 자동 검색 =====
const dynamicCache = {}; // 서버 인스턴스가 살아있는 동안 유지 (찾은 코드 재사용)
const normName = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s/g, '').toLowerCase();

// 네이버 자동완성: 응답 구조가 불확실해서(항목 순서가 [이름,코드] 또는 [코드,이름]일 수 있음)
// 항목 안의 모든 문자열을 펼쳐서 "6자리 숫자 = 코드", "종목명과 정확히 일치하는 문자열 = 이름"으로 판별.
// 유사 종목은 절대 사용하지 않고 이름이 정확히 일치할 때만 반환.
function pickCodeFromNaverAc(data, tickerName) {
  const target = normName(tickerName);
  const groups = Array.isArray(data?.items) ? data.items : [];
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const entry of group) {
      const strs = (Array.isArray(entry) ? entry.flat(Infinity) : [entry]).filter(v => typeof v === 'string');
      const code = strs.find(v => /^\d{6}$/.test(v));
      if (code && strs.some(v => v !== code && normName(v) === target)) return code;
    }
  }
  // 이전 stockprice.js 방식: items[0]=이름 목록, items[1]=코드 목록
  const names = groups[0], codes = groups[1];
  if (Array.isArray(names) && Array.isArray(codes)) {
    for (let i = 0; i < names.length; i++) {
      const n = Array.isArray(names[i]) ? names[i][0] : names[i];
      const c = Array.isArray(codes[i]) ? codes[i][0] : codes[i];
      if (n && c && /^\d{6}$/.test(String(c)) && normName(n) === target) return String(c);
    }
  }
  return null;
}

async function findCodeFromNaver(tickerName) {
  const url = `https://ac.finance.naver.com/ac?q=${encodeURIComponent(tickerName)}&q_enc=UTF-8&st=111&frm=stock&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://finance.naver.com/' },
    signal: AbortSignal.timeout(6000),
  });
  const data = JSON.parse(await res.text());
  return pickCodeFromNaverAc(data, tickerName);
}

// KRX KIND 상장종목 목록 (한글 인코딩이 EUC-KR인 경우가 많아 바이트로 받아 직접 디코딩)
let krxMap = null, krxLoadedAt = 0;
async function loadKrxMap() {
  if (krxMap && Date.now() - krxLoadedAt < 3600000) return krxMap;
  const res = await fetch('https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://kind.krx.co.kr' },
    signal: AbortSignal.timeout(8000),
  });
  const buf = await res.arrayBuffer();
  const ct = res.headers.get('content-type') || '';
  const charset = (ct.match(/charset=([\w-]+)/i) || [])[1] || 'euc-kr';
  let text;
  try { text = new TextDecoder(charset).decode(buf); } catch { text = new TextDecoder('utf-8').decode(buf); }
  const map = {};
  const rows = text.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length >= 2) {
      const name = cells[0].replace(/<[^>]+>/g, '').trim();
      const code = cells[1].replace(/<[^>]+>/g, '').trim();
      if (name && /^\d{6}$/.test(code)) map[normName(name)] = code;
    }
  }
  if (Object.keys(map).length > 100) { krxMap = map; krxLoadedAt = Date.now(); return map; }
  return null;
}
async function findCodeFromKrx(tickerName) {
  const map = await loadKrxMap();
  return map ? (map[normName(tickerName)] || null) : null;
}

async function resolveCode(ticker, tickerCode) {
  if (tickerCode) return { code: tickerCode, how: 'given' };
  if (TICKER_MAP[ticker]) return { code: TICKER_MAP[ticker], how: 'map' };
  if (dynamicCache[ticker]) return { code: dynamicCache[ticker], how: 'cache' };
  const reasons = [];
  try {
    const c = await findCodeFromNaver(ticker);
    if (c) { dynamicCache[ticker] = c; return { code: c, how: 'naver' }; }
    reasons.push('네이버: 일치 종목 없음');
  } catch (e) { reasons.push(`네이버: ${e.message}`); }
  try {
    const c = await findCodeFromKrx(ticker);
    if (c) { dynamicCache[ticker] = c; return { code: c, how: 'krx' }; }
    reasons.push('KRX: 일치 종목 없음');
  } catch (e) { reasons.push(`KRX: ${e.message}`); }
  return { code: null, reasons };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker, tickerCode, timeframe = 'day', range, isOverseas = false, currentPrice } = req.body || {};
  if (!ticker) return res.status(400).json({ error: 'ticker 필요' });

  const intervalMap = { 'day': '1d', 'week': '1wk', 'month': '1mo' };
  const defaultRange = { 'day': '3mo', 'week': '1y', 'month': '1y' };
  const yInterval = intervalMap[timeframe] || '1d';
  const yRange = range || defaultRange[timeframe] || '3mo';

  try {
    // 해외주식
    if (isOverseas && tickerCode) {
      const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${tickerCode}?interval=${yInterval}&range=${yRange}`;
      const yRes = await fetch(yUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const yData = await yRes.json();
      const result = yData?.chart?.result?.[0];
      if (!result) return res.status(200).json({ candles: [], scale: 1 });
      const ts = result.timestamp || [];
      const q = result.indicators?.quote?.[0] || {};
      let usdKrw = 1380;
      try {
        const fxRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const fxData = await fxRes.json();
        usdKrw = fxData?.chart?.result?.[0]?.meta?.regularMarketPrice || 1380;
      } catch {}
      const candles = ts.map((t, i) => ({
        date: new Date(t * 1000).toISOString().split('T')[0],
        open: Math.round((q.open?.[i]||0)*usdKrw), high: Math.round((q.high?.[i]||0)*usdKrw),
        low: Math.round((q.low?.[i]||0)*usdKrw), close: Math.round((q.close?.[i]||0)*usdKrw),
        volume: q.volume?.[i]||0,
      })).filter(c => c.close > 0);
      return res.status(200).json({ candles, scale: 1 });
    }

    // 국내주식 - 코드가 없으면 종목명으로 자동 검색
    const resolved = await resolveCode(ticker, tickerCode);
    const code = resolved.code;
    if (!code) {
      return res.status(200).json({
        candles: [], scale: 1,
        error: `종목코드를 찾지 못했어요: ${ticker} (${(resolved.reasons || []).join(' / ')})`,
      });
    }

    const suffixes = KOSDAQ_CODES.has(code) ? ['.KQ', '.KS'] : ['.KS', '.KQ'];

    let candles = [];
    let scale = 1; // 보정 비율 (1 = 정상, 0.1 = 10배였음)
    const tried = [];

    for (const suffix of suffixes) {
      const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${code}${suffix}?interval=${yInterval}&range=${yRange}`;
      try {
        const yRes = await fetch(yUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        const yData = await yRes.json();
        const result = yData?.chart?.result?.[0];
        if (!result?.timestamp || result.timestamp.length < 2) { tried.push(`${code}${suffix}: 데이터 없음`); continue; }

        const ts = result.timestamp;
        const q = result.indicators?.quote?.[0] || {};

        const parsed = ts.map((t, i) => ({
          date: new Date(t * 1000).toISOString().split('T')[0],
          open: Math.round(q.open?.[i]||0),
          high: Math.round(q.high?.[i]||0),
          low: Math.round(q.low?.[i]||0),
          close: Math.round(q.close?.[i]||0),
          volume: q.volume?.[i]||0,
        })).filter(c => c.close > 0);

        if (parsed.length < 5) { tried.push(`${code}${suffix}: 캔들 ${parsed.length}개뿐`); continue; }

        // currentPrice(실제 현재가)와 마지막 캔들 비교로 배율 감지
        if (currentPrice && currentPrice > 0) {
          const lastClose = parsed[parsed.length - 1].close;
          const ratio = lastClose / currentPrice;

          if (ratio > 5 && ratio < 20) {
            // 10배로 오고 있음 → 보정
            scale = 0.1;
            candles = parsed.map(c => ({
              ...c,
              open: Math.round(c.open * scale),
              high: Math.round(c.high * scale),
              low: Math.round(c.low * scale),
              close: Math.round(c.close * scale),
            }));
          } else {
            scale = 1;
            candles = parsed;
          }
        } else {
          candles = parsed;
        }
        break;
      } catch (e) { tried.push(`${code}${suffix}: ${e.message}`); }
    }

    // scale 응답에 포함 → App.jsx에서 avgBuy 보정에 사용
    if (candles.length === 0) {
      return res.status(200).json({ candles: [], scale: 1, error: `시세 조회 실패 (코드 ${code}): ${tried.join(' / ')}` });
    }
    return res.status(200).json({ candles, scale, code });
  } catch (error) {
    return res.status(200).json({ candles: [], scale: 1, error: error.message });
  }
}
