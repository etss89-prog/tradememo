// ⚠️ 주의: 이 맵은 최후순위 폴백으로만 사용됨 (네이버 API 우선)
// 일부 코드는 검증되지 않았을 수 있음. 가격이 이상하면 종목코드를 다시 확인할 것.
const TICKER_MAP = {
  // 정확한 종목명
  "SK하이닉스": "000660",
  "LG전자우": "066575",
  "한솔테크닉스": "004710",
  "기가비스": "420770",
  "그리드위즈": "453450",
  "OCI홀딩스": "010060",
  "한화솔루션": "009830",
  "유니테스트": "086390",
  "대한전선": "001440",
  "SK오션플랜트": "100090",
  "아톤": "158430",
  "원익QnC": "074600",
  "해성디에스": "195870",
  "산일전기": "062040",
  "현대차": "005380",
  "마이크로컨텍솔": "098120",
  "티에프피": "149530",
  "한화솔루션우": "009835",
  "에이엘티": "172670",
  "지투파워": "388050",
  "상아프론테크": "089980",
  "시지트로닉스": "429270", // ✅ 오매핑 수정: 049630(재영솔루텍)로 잘못 연결되어 있었음 - 이 잘못된 코드의 실제 가격(7,030원)이 화면에 나오고 있었음
  "켐트로닉스": "089010",
  "현대차2우B": "005387",
  "가온칩스": "399720",
  "SK이노베이션우": "096775",
  "한솔테크닉스39R": "004717",
  "펄어비스": "263750",
  "SK이노베이션": "096770",
  "티에스이": "131290",
  "뉴로메카": "348340",
  "일진하이솔루스": "271940",
  "서울바이오시스": "328130",
  // "아이엠씨"는 비상장 기업이라 종목코드 없음 (101390은 별개 회사 "아이엠"의 코드였음, 오매핑 제거)
  "누리플렉스": "040160",
  "뉴프렉스": "085670",
  "대덕1우": "008045",
  "대덕": "008060",
  "RF머트리얼즈": "327260",
  "삼성전자": "005930",
  "삼성전자우": "005935",
  "SK텔레콤": "017670",
  "카카오": "035720",
  "네이버": "035420",
  "NAVER": "035420",
  "LG에너지솔루션": "373220",
  "삼성SDI": "006400",
  "현대모비스": "012330",
  "POSCO홀딩스": "005490",
  "셀트리온": "068270",
  "기아": "000270",
  "KB금융": "105560",
  "신한지주": "055550",
  "하나금융지주": "086790",
  "삼성바이오로직스": "207940",

  // ETF - 정확한 종목코드로 수정
  "TIGER 코스닥150 레버리지": "233740",
  "TIGER코스닥150레버리지": "233740",
  "KODEX SK하이닉스단일종목레버리지": "472870",

  // 연금저축/IRP/DC 계좌 ETF ✅ 수정됨
  "TIGER 코리아AI전력기기TOP3플러스": "0117V0",
  "SOL AI반도체TOP2플러스": "0167A0",
  "RISE 삼성전자SK하이닉스채권혼합50": "0162Z0",
  "1Q 코스닥150채권혼합50액티브": "0186S0",
  "1Q 200채권혼합50액티브": "0184E0",
  "KODEX 차이나A50": "302190",
  "RISE 네트워크인프라": "367760",
  "TIGER 차이나전기차SOLACTIVE": "371460",
  "TIGER 차이나전기차솔액티브": "371460",
  "KODEX 차이나항셍테크": "371150",
  "HANARO Fn친환경에너지": "381570",   // ✅ 381180 → 381570 수정
  "HANARO 증권고배당TOP3플러스": "0111J0", // ✅ 추가
  "HANARO 전력설비투자": "491820",     // ✅ 추가
  "PLUS 태양광&ESS": "457990",         // ✅ 423160 → 457990 수정
  "PLUS 글로벌히토류&전략자원생산기업": "415920",
  "KODEX 삼성전자채권혼합": "448330",
  "KODEX 삼성전자채권혼합50": "448330",
  "SOL AI반도체소부장": "455850",
  "ACE 테슬라밸류체인인액티브": "457480",
  "ACE 테슬라밸류체인액티브": "457480",
  "PLUS 태양광&ESS": "457990",
  "RISE 2차전지TOP10": "465330",
  "ACE 마이크로소프트밸류체인인액티브": "483330",
  "KODEX AI전력핵심설비": "487240",
  "HANARO 전력설비투자": "491820",
  "UNICORN SK하이닉스밸류체인액티브": "494220",
  "ACE 국고채10년": "365780",
  "KODEX 삼성전자SK하이닉스채권혼합50": "0177N0",
  "SOL AI반도체소부장": "455850",

  // DC 계좌 ETF (새로 추가)
  "SOL 반도체전공정": "475300",
  "KODEX AI반도체핵심장비": "471990",
  "ACE K휴머노이드로봇산업TOP2+": "0177X0",
  "RISE 현대차고정피지컬AI": "0190C0",
  "ACE 엔비디아채권혼합": "448540",
  "ACE 미국30년국채액티브(H)": "461680",
  "KODEX SK하이닉스단일종목레버리지": "0193T0",
  "티에프이": "425420",
  "아이앤씨": "052860",
  "티에프피": "149530",
  "ACE 마이크로소프트밸류체인인액티브": "483330",
  "ACE 마이크로소프트밸류체인액티브": "483330",
  "PLUS 글로벌희토류&전략자원생산기업": "415920",
  "PLUS 글로벌히토류&전략자원생산기업": "415920",

  "HD현대에너지솔루션": "322000",

  // 오인식 대비 매핑
  "가가비스": "420770",
  "가비스": "420770",
  "일익QnC": "074600",
  "원익QNC": "074600",
  "일익QNC": "074600",
  "SX하이닉스": "000660",
  "SK 하이닉스": "000660",
  "한솔테크닉스 39R": "004717",
  "마이크로컨텍솔루션": "098120",
  "마이크로 컨텍솔": "098120",
  "RF 머트리얼즈": "327260",
  "HANARO Fn 친환경에너지": "381570",
  "PLUS 태양광 ESS": "457990",
};

const dynamicCache = {};
let cachedToken = null;
let tokenExpiry = null;

// ✅ KRX 전체 종목 캐시 - 한 번 로드하면 메모리에 유지
let krxStockMap = null; // { 종목명: 종목코드 }
let krxLoadedAt = null;

// KRX에서 전체 상장 종목 목록 가져오기
async function loadKrxStockMap() {
  // 1시간마다 갱신
  if (krxStockMap && krxLoadedAt && Date.now() - krxLoadedAt < 3600000) {
    return krxStockMap;
  }
  try {
    // KRX 전체 종목 리스트 (코스피+코스닥+ETF)
    const res = await fetch('https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://kind.krx.co.kr' }
    });
    const text = await res.text();
    // HTML 테이블 파싱
    const map = {};
    const rows = text.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const row of rows) {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length >= 2) {
        const name = cells[0]?.replace(/<[^>]+>/g, '').trim();
        const code = cells[1]?.replace(/<[^>]+>/g, '').trim();
        if (name && code && /^\d{6}$/.test(code)) {
          map[name] = code;
        }
      }
    }
    if (Object.keys(map).length > 100) {
      krxStockMap = map;
      krxLoadedAt = Date.now();
      console.log(`KRX 종목 로드 완료: ${Object.keys(map).length}개`);
      return map;
    }
  } catch (e) {
    console.error('KRX 로드 실패:', e.message);
  }
  return null;
}

// 종목명으로 KRX에서 코드 검색 (정확 일치 우선, 없으면 포함 검색)
async function findCodeFromKrx(tickerName) {
  const map = await loadKrxStockMap();
  if (!map) return null;

  // 1. 정확히 일치
  if (map[tickerName]) return map[tickerName];

  // 2. 공백 제거 후 일치
  const norm = tickerName.replace(/\s/g, '');
  for (const [name, code] of Object.entries(map)) {
    if (name.replace(/\s/g, '') === norm) return code;
  }

  return null;
}

// ===== 업종별 맵차트용 - 네이버 "업종별 시세" 스크래핑 =====
// ⚠️ 이 섹션 전체는 실제 배포 환경에서 아직 검증되지 않았음 (샌드박스는 외부 네트워크 접근 불가라 직접 테스트 불가).
// 업종 개수가 많아(수십~백 개 가능) 요청이 많이 나갈 수 있어서, 결과를 1시간 캐시해 재요청 비용을 줄임.
// 실패하더라도 항상 {}(빈 맵)을 반환하도록 방어해서, 업종별 맵차트가 실패해도 기존 평면 맵차트/앱 전체에는 영향 없음.
let sectorMapCache = null;
let sectorMapLoadedAt = null;

// 네이버 "업종별 시세" 목록 페이지에서 업종명 + 그룹번호(no) 목록 추출
async function fetchUpjongList() {
  try {
    const url = 'https://finance.naver.com/sise/sise_group.naver?type=upjong';
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Charset': 'EUC-KR,utf-8;q=0.7,*;q=0.3',
        'Referer': 'https://finance.naver.com/sise/',
      }
    });
    if (!r.ok) return [];
    const buf = await r.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);

    const groups = [];
    const seen = new Set();
    const re = /href="\/sise\/sise_group_detail\.naver\?type=upjong&no=(\d+)"[^>]*>([^<]+)<\/a>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const no = m[1];
      const name = m[2].trim();
      if (no && name && !seen.has(no)) { seen.add(no); groups.push({ no, name }); }
    }
    return groups;
  } catch (e) {
    console.error('fetchUpjongList error:', e.message);
    return [];
  }
}

// 특정 업종 그룹의 상세페이지에서 소속 종목명 목록 추출
async function fetchUpjongMembers(no) {
  try {
    const url = `https://finance.naver.com/sise/sise_group_detail.naver?type=upjong&no=${no}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Charset': 'EUC-KR,utf-8;q=0.7,*;q=0.3',
        'Referer': 'https://finance.naver.com/sise/',
      }
    });
    if (!r.ok) return [];
    const buf = await r.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);

    const names = [];
    const re = /href="[^"]*code=(\d{6})[^"]*"[^>]*>([^<]+)<\/a>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const name = m[2].trim();
      if (name) names.push(name);
    }
    return names;
  } catch {
    return [];
  }
}

// 업종 목록 + 각 업종 상세를 모두 모아 { 종목명: 업종명 } 맵을 구성 (1시간 캐시)
async function loadSectorMap() {
  if (sectorMapCache && sectorMapLoadedAt && Date.now() - sectorMapLoadedAt < 3600000) {
    return sectorMapCache;
  }
  try {
    const groups = await fetchUpjongList();
    if (!groups.length) return sectorMapCache || {};

    // 파싱 오류 등으로 비정상적으로 많은 그룹이 잡히는 경우를 대비한 안전 상한
    const SECTOR_GROUP_LIMIT = 150;
    const targetGroups = groups.slice(0, SECTOR_GROUP_LIMIT);

    const results = await Promise.allSettled(targetGroups.map(g => fetchUpjongMembers(g.no)));
    const map = {};
    results.forEach((r, i) => {
      if (r.status !== 'fulfilled') return;
      const groupName = targetGroups[i].name;
      (r.value || []).forEach(name => {
        if (!map[name]) map[name] = groupName; // 이미 배정된 종목은 최초 매칭 유지 (중복 업종 방지)
      });
    });

    if (Object.keys(map).length > 0) {
      sectorMapCache = map;
      sectorMapLoadedAt = Date.now();
      return map;
    }
    return sectorMapCache || {};
  } catch (e) {
    console.error('loadSectorMap error:', e.message);
    return sectorMapCache || {};
  }
}

// ✅ Yahoo Finance 차트 API 공용 래퍼 (2026-09 대응)
// 며칠 전부터 query1.finance.yahoo.com 쪽에서 종종 정상 응답(특히 meta.sharesOutstanding 포함)을
// 못 받아오는 현상이 관찰됨(집중도 차트 "상장주식수 조회 실패" 등). Yahoo는 query1/query2 두 호스트가
// 같은 API를 제공하므로, query1이 비정상(에러/빈 결과)이면 query2로 한 번 더 자동 재시도한다.
// 그래도 둘 다 실패하면 { ok:false, error } 형태로 실패 사유를 그대로 돌려줘서, 호출부에서
// "그냥 데이터 없음"이 아니라 구체적인 원인을 파악할 수 있게 함.
async function fetchYahooChart(symbol, { interval = '1d', range = '1d' } = {}) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  };
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
  let lastError = 'unknown';
  for (const host of hosts) {
    try {
      const url = `https://${host}/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
      const r = await fetch(url, { headers });
      const data = await r.json().catch(() => null);
      const result = data?.chart?.result?.[0];
      if (result) return { ok: true, data, result };
      lastError = data?.chart?.error?.description || `HTTP ${r.status} (${host})`;
    } catch (e) {
      lastError = `${e.message} (${host})`;
    }
  }
  return { ok: false, data: null, result: null, error: lastError };
}

// ✅ Yahoo Finance로 해외주식 현재가 조회 (API 키 불필요)
async function getOverseasPrice(ticker) {
  const { result } = await fetchYahooChart(ticker, { interval: '1d', range: '1d' });
  const price = result?.meta?.regularMarketPrice;
  return price ? Math.round(price * 10000) / 10000 : null; // 소수점 4자리
}

// ✅ USD → KRW 환율 조회
async function getUsdKrwRate() {
  const { result } = await fetchYahooChart('USDKRW=X', { interval: '1d', range: '1d' });
  const rate = result?.meta?.regularMarketPrice;
  return rate || 1380; // 기본값 1380원
}

// ⚠️⚠️ 중요 (원인 발견): 이 함수에 "동시에 여러 곳에서 부르면 락 없이 각자 새 토큰을 발급받는" 버그가 있었음.
// KIS는 토큰을 새로 발급할 때마다 보안 알림(카카오톡)을 보내는데, market 응답 하나를 만들 때
// fetchMarketCap(코스피)/fetchMarketCap(코스닥)/집중도차트가 Promise.all로 동시에 실행되면서
// 각자 getAccessToken()을 호출 → cachedToken이 아직 비어있는 순간에 3곳이 동시에 토큰 발급을 시도 →
// KIS 서버가 짧은 시간 내 중복 발급 요청을 거부(그래서 "토큰 발급 실패"가 남) + 새로 발급될 때마다 알림 발송.
// → "로그인 새로고침만 해도 카톡이 온다"의 직접적인 원인. single-flight 락으로 완전히 해결.
let tokenFetchPromise = null;
async function getAccessToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) return cachedToken;
  if (tokenFetchPromise) return tokenFetchPromise; // 이미 발급 진행 중이면 새로 시도하지 않고 그 결과를 같이 기다림
  tokenFetchPromise = (async () => {
    try {
      const res = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: process.env.KIS_APP_KEY,
          appsecret: process.env.KIS_APP_SECRET,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.access_token) throw new Error(data?.error_description || data?.msg1 || `토큰 발급 실패 (HTTP ${res.status})`);
      cachedToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      return cachedToken;
    } finally {
      tokenFetchPromise = null; // 성공/실패와 무관하게 락 해제 - 다음 만료 시 다시 시도 가능
    }
  })();
  return tokenFetchPromise;
}

async function getCurrentPrice(token, code) {
  // 마켓 코드 판별
  // 순수 6자리 숫자 = 코스피/코스닥 주식 → J
  // 영숫자 혼합 (0117V0 등 신규 ETF) → ETF
  // 6자리 숫자지만 ETF인 경우 (069500, 233740 등) → J로 조회해도 됨 (한투 API가 처리)
  const isNewETF = /[A-Za-z]/.test(code); // 영문자 포함 여부로 판별
  const marketCode = isNewETF ? 'ETF' : 'J';

  const res = await fetch(
    `https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=${marketCode}&fid_input_iscd=${code}`,
    {
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        appkey: process.env.KIS_APP_KEY,
        appsecret: process.env.KIS_APP_SECRET,
        tr_id: 'FHKST01010100',
      },
    }
  );
  const data = await res.json();
  const price = parseInt(data.output?.stck_prpr || 0);

  // ETF 마켓으로 0 나오면 J로 재시도
  if (price === 0 && isNewETF) {
    const res2 = await fetch(
      `https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=${code}`,
      {
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
          appkey: process.env.KIS_APP_KEY,
          appsecret: process.env.KIS_APP_SECRET,
          tr_id: 'FHKST01010100',
        },
      }
    );
    const data2 = await res2.json();
    const price2 = parseInt(data2.output?.stck_prpr || 0);
    return price2 > 0 ? price2 : null;
  }

  return price > 0 ? price : null;
}

async function guessTickerCode(tickerName) {
  if (dynamicCache[tickerName]) return dynamicCache[tickerName];

  // 1순위: KRX 전체 종목 목록에서 정확히 검색 (가장 신뢰도 높음, 모든 상장 종목 포함)
  try {
    const krxCode = await findCodeFromKrx(tickerName);
    if (krxCode) {
      dynamicCache[tickerName] = krxCode;
      return krxCode;
    }
  } catch {}

  // 2순위: 네이버 자동완성 - 정확히 일치하는 경우에만 반환 (유사 종목 절대 사용 안 함)
  try {
    const res = await fetch(
      `https://ac.finance.naver.com/ac?q=${encodeURIComponent(tickerName)}&q_enc=UTF-8&st=111&frm=stock&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );
    const text = await res.text();
    const data = JSON.parse(text);
    const names = data?.items?.[0] || [];
    const codes = data?.items?.[1] || [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i]?.[0]?.replace(/<[^>]+>/g, '').trim();
      const code = codes[i]?.[0];
      if (name && code) {
        const normName = name.replace(/\s/g, '').toLowerCase();
        const normTicker = tickerName.replace(/\s/g, '').toLowerCase();
        if (normName === normTicker) return code;
      }
    }
  } catch {}

  return null;
}



export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { type, tickers, stocks } = req.body;

    // ✅ 지수 기간 차트 조회 (투자성과 대시보드용)
    if (type === 'indexChart') {
      const { symbol, range, firstPerfDate } = req.body;
      if (!symbol) return res.status(400).json({ error: 'symbol 필요' });
      try {
        // range: '1m'|'3m'|'6m'|'all' → Yahoo Finance range 변환
        let yRange = '1mo';
        if (range === '1m') yRange = '1mo';
        else if (range === '3m') yRange = '3mo';
        else if (range === '6m') yRange = '6mo';
        else if (range === 'all') {
          if (firstPerfDate) {
            const daysDiff = Math.ceil((Date.now() - new Date(firstPerfDate)) / (1000*60*60*24));
            yRange = daysDiff > 365 ? '2y' : daysDiff > 180 ? '1y' : daysDiff > 90 ? '6mo' : daysDiff > 30 ? '3mo' : '1mo';
          } else {
            yRange = '1y';
          }
        }

        const { result, error: yErr } = await fetchYahooChart(encodeURIComponent(symbol), { interval: '1d', range: yRange });
        if (!result?.timestamp) return res.status(200).json({ data: [], error: yErr || 'Yahoo 데이터 없음' });

        const ts = result.timestamp;
        const closes = result.indicators?.quote?.[0]?.close || [];

        // 코스피/코스닥 지수는 Yahoo Finance에서 10배로 옴 → /10 보정
        // regularMarketPrice로 실제 값 확인 후 비율 계산
        const metaPrice = result.meta?.regularMarketPrice || 0;
        const rawCloses = closes.filter(c => c !== null);
        const lastRaw = rawCloses[rawCloses.length - 1] || 0;
        const needsDivide = metaPrice > 0 && lastRaw > 0 && (lastRaw / metaPrice) > 5;

        const data = ts.map((t, i) => ({
          date: new Date(t * 1000).toISOString().split('T')[0],
          close: closes[i] ? Math.round((needsDivide ? closes[i] / 10 : closes[i]) * 100) / 100 : null,
        })).filter(c => c.close !== null);

        return res.status(200).json({ data });
      } catch(e) {
        return res.status(200).json({ data: [], error: e.message });
      }
    }

    // ✅ 업종별 맵차트용 - 종목명 → 업종명 매핑 (서버에서 1시간 캐시, 최초 "업종별 보기" 토글 시에만 호출됨)
    // ⚠️ 실제 배포 환경에서 아직 검증되지 않은 스크래핑 경로임 (샌드박스는 외부 네트워크 접근 불가라 직접 테스트 불가).
    if (type === 'sectorMap') {
      try {
        const map = await loadSectorMap();
        return res.status(200).json({ sectorMap: map || {} });
      } catch (e) {
        return res.status(200).json({ sectorMap: {}, error: e.message });
      }
    }

    // ✅ 삼성전자(+우선주)+SK하이닉스 시총 집중도 히스토리 (코스피 전체 시총 대비 비율, 날짜별)
    // ⚠️ 근사치 계산임 - "오늘" 시총 스냅샷만 구할 수 있고 과거 일별 시총은 구할 방법이 없어서, 다음 방식으로 근사함:
    //  · 삼성전자/삼성전자우/SK하이닉스: "오늘" KIS 시가총액(fetchMarketCap 재사용) ÷ 오늘 종가로 상장주식수를 역산하고
    //    (상장주식수는 기간 내 거의 불변으로 가정), 이를 그날그날의 종가(Yahoo 과거 시세)에 곱해서 그날의 시가총액을 계산
    //  · 코스피 전체: "오늘" 코스피 전체 시가총액 근사값(fetchMarketCap의 KIS 시장비중 역산치) × (그날 지수 ÷ 오늘 지수)로 근사
    //    (지수 산출용 나눗값이 종목 교체 등으로 미세하게 바뀔 수 있어 100% 정확하진 않음)
    // ✅ 삼성전자 우선주(삼성전자우, 005935)를 포함해서 계산함 - 실제 언론 보도(2026.6.25 피크 기준 보통주만 57.11%,
    // 우선주 포함 59.69%)와 비교했을 때 우선주를 빼면 실제보다 낮게 나온다는 걸 확인하고 사용자 요청으로 포함시킴.
    if (type === 'concentrationHistory') {
      try {
        const range = req.body.range || '6mo';
        const [samsungR, samsungPrefR, hynixR, kospiR, kospiCapNow] = await Promise.all([
          fetchYahooChart('005930.KS', { interval: '1d', range }),
          fetchYahooChart('005935.KS', { interval: '1d', range }), // ✅ 삼성전자우
          fetchYahooChart('000660.KS', { interval: '1d', range }),
          fetchYahooChart('%5EKS11', { interval: '1d', range }),
          fetchMarketCap(0), // ✅ 코스피 시총 TOP30 스냅샷 재사용 (삼성전자/삼성전자우/SK하이닉스는 항상 top30 안에 있음)
        ]);
        const samsungData = samsungR.data, samsungPrefData = samsungPrefR.data, hynixData = hynixR.data, kospiData = kospiR.data;

        const parseSeries = (d) => {
          const result = d?.chart?.result?.[0];
          if (!result?.timestamp) return { series: [] };
          const ts = result.timestamp;
          const closes = result.indicators?.quote?.[0]?.close || [];
          const series = ts.map((t, i) => ({
            date: new Date(t * 1000).toISOString().split('T')[0],
            close: closes[i] != null ? closes[i] : null,
          })).filter(d => d.close !== null);
          return { series };
        };

        const samsung = parseSeries(samsungData);
        const samsungPref = parseSeries(samsungPrefData);
        const hynix = parseSeries(hynixData);
        const kospi = parseSeries(kospiData);

        // ✅ 상장주식수를 오늘 시가총액(억원) ÷ 오늘 종가로 역산
        const kospiRows = kospiCapNow?.mapList || [];
        const samsungRow = kospiRows.find(s => s.name === '삼성전자');
        const samsungPrefRow = kospiRows.find(s => s.name === '삼성전자우');
        const hynixRow = kospiRows.find(s => s.name === 'SK하이닉스');
        const samsungShares = (samsungRow?.marketCap && samsungRow.price) ? samsungRow.marketCap * 100000000 / samsungRow.price : null;
        const samsungPrefShares = (samsungPrefRow?.marketCap && samsungPrefRow.price) ? samsungPrefRow.marketCap * 100000000 / samsungPrefRow.price : null;
        const hynixShares = (hynixRow?.marketCap && hynixRow.price) ? hynixRow.marketCap * 100000000 / hynixRow.price : null;

        if (!samsungShares || !hynixShares) {
          return res.status(200).json({ data: [], error: `상장주식수 조회 실패 (${kospiCapNow?.error || 'KIS 데이터 없음'})` });
        }
        // 삼성전자우는 top30 밖으로 밀려나거나 일시적으로 못 잡힐 수 있으니, 그 경우엔 그냥 0으로 두고 계속 진행
        // (전체를 에러로 막지 않음 - 보통주+하이닉스만이라도 보여주는 게 나음)
        if (!samsungPrefShares) {
          console.error('삼성전자우 상장주식수 조회 실패 - 우선주 제외하고 계산');
        }
        if (kospi.series.length === 0) {
          return res.status(200).json({ data: [], error: `코스피 지수 데이터 조회 실패 (${kospiR.error || 'Yahoo 데이터 없음'})` });
        }

        // 코스피 지수는 Yahoo에서 10배로 오는 경우가 있어 보정 (기존 indexChart 로직과 동일)
        const kospiMetaPrice = kospiData?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
        const kospiRawLast = kospi.series[kospi.series.length - 1]?.close || 0;
        const needsDivide = kospiMetaPrice > 0 && kospiRawLast > 0 && (kospiRawLast / kospiMetaPrice) > 5;
        const kospiSeriesAdj = kospi.series.map(d => ({ date: d.date, close: needsDivide ? d.close / 10 : d.close }));
        const kospiIndexLast = kospiSeriesAdj[kospiSeriesAdj.length - 1]?.close;

        // ✅ 코스피 "전체" 시가총액 오늘 값 - fetchMarketCap(0)이 KIS의 "시장 전체 대비 비중" 필드를 거꾸로 풀어
        // 이미 근사 계산해서 돌려줌 (kospiCapNow.totalMarketCap, 억원 단위).
        const kospiTotalNow = kospiCapNow?.totalMarketCap;
        if (!kospiTotalNow || !kospiIndexLast) {
          return res.status(200).json({ data: [], error: `코스피 전체 시총 기준값 조회 실패 (${kospiCapNow?.error || ''})` });
        }

        const samsungMap = {}; samsung.series.forEach(d => { samsungMap[d.date] = d.close; });
        const samsungPrefMap = {}; samsungPref.series.forEach(d => { samsungPrefMap[d.date] = d.close; });
        const hynixMap = {}; hynix.series.forEach(d => { hynixMap[d.date] = d.close; });

        const data = kospiSeriesAdj.map(kd => {
          const sPrice = samsungMap[kd.date];
          const hPrice = hynixMap[kd.date];
          if (sPrice == null || hPrice == null || !kd.close) return null;
          const samsungCap = samsungShares * sPrice / 100000000; // 억원
          const hynixCap = hynixShares * hPrice / 100000000;
          const sPrefPrice = samsungPrefMap[kd.date];
          const samsungPrefCap = (samsungPrefShares && sPrefPrice != null) ? samsungPrefShares * sPrefPrice / 100000000 : 0;
          const kospiTotalEst = kospiTotalNow * (kd.close / kospiIndexLast);
          const ratio = kospiTotalEst > 0 ? (samsungCap + samsungPrefCap + hynixCap) / kospiTotalEst * 100 : null;
          return ratio !== null ? { date: kd.date, ratio: Math.round(ratio * 100) / 100 } : null;
        }).filter(Boolean);

        return res.status(200).json({ data });
      } catch (e) {
        return res.status(200).json({ data: [], error: e.message });
      }
    }

    // ✅ 시장 현황 조회 (코스피/코스닥 지수 + 시총순위 + 1일차트 + 맵차트)
    // fetchMarketCap이 KIS 시가총액 순위 API로 시장당 1번의 호출로 TOP30을 받아오므로 별도 스크래핑이 필요 없음.
    if (type === 'market') {
      const results = await Promise.all([
        fetchMarketIndex(),
        fetchMarketCap(0),
        fetchMarketCap(1),
        fetchIntraday('%5EKS11'),
        fetchIntraday('%5EKQ11'),
      ]);
      const kospiCap = results[1] || {};
      const kosdaqCap = results[2] || {};
      // ✅ 진단용: 맵차트(mapList)가 비었거나, 항목은 있어도 전부 marketCap이 null이라 트리맵을
      // 실제로 그릴 수 없는 상태일 때 실패 사유를 그대로 노출. 정상일 땐 undefined.
      const kospiMapUsable = (kospiCap.mapList || []).some(s => s.marketCap);
      const kosdaqMapUsable = (kosdaqCap.mapList || []).some(s => s.marketCap);
      const kospiMapError = !kospiMapUsable ? (kospiCap.error || '알 수 없는 오류 (marketCap 전부 null)') : undefined;
      const kosdaqMapError = !kosdaqMapUsable ? (kosdaqCap.error || '알 수 없는 오류 (marketCap 전부 null)') : undefined;
      return res.status(200).json({
        // ── 기존 필드 (그대로 유지, 기존 UI 영향 없음) ──
        indices: results[0],
        kospiTop: kospiCap.top10 || [],
        kosdaqTop: kosdaqCap.top10 || [],
        kospiChart: results[3],
        kosdaqChart: results[4],
        // ── 맵차트용 필드 (TOP 30) ──
        kospiMap: kospiCap.mapList || [],
        kosdaqMap: kosdaqCap.mapList || [],
        // ⚠️ otherCount는 항상 null: KIS 랭킹 API가 최대 30건까지만 줘서 31위 이후 "종목 수"는 알 수 없음
        // (합산 시가총액은 시장 전체 비중 필드로 근사 가능해서 otherMarketCap엔 값이 들어감)
        kospiMapOtherCount: kospiCap.otherCount,
        kosdaqMapOtherCount: kosdaqCap.otherCount,
        kospiMapOtherCap: kospiCap.otherMarketCap ?? null,   // ✅ "기타" 종목들의 시가총액 합 (억원, 근사치)
        kosdaqMapOtherCap: kosdaqCap.otherMarketCap ?? null,
        kospiMapTotal: kospiCap.totalMarketCap ?? null,      // 하위호환용 (기존 필드명 유지)
        kosdaqMapTotal: kosdaqCap.totalMarketCap ?? null,
        kospiTotalMarketCap: kospiCap.totalMarketCap ?? null, // ✅ 코스피 시장 전체 시가총액 (근사, 비중 필드 기반 역산)
        kosdaqTotalMarketCap: kosdaqCap.totalMarketCap ?? null,
        kospiMapError,                                        // ✅ 맵차트 데이터가 비었을 때만 채워지는 진단 메시지
        kosdaqMapError,
      });
    }

    // 기존 주가 조회
    if (!tickers || !Array.isArray(tickers)) return res.status(400).json({ error: 'tickers 배열 필요' });

    // stocks 배열에서 tickerCode, isOverseas 맵 생성
    const savedCodes = {};
    const overseasMap = {}; // 해외주식 티커 맵 { 한글명: 영문티커 }
    if (stocks && Array.isArray(stocks)) {
      stocks.forEach(s => {
        if (s.ticker && s.tickerCode) savedCodes[s.ticker] = s.tickerCode;
        if (s.ticker && s.isOverseas && s.tickerCode) overseasMap[s.ticker] = s.tickerCode;
      });
    }

    // ✅ 해외주식 현재가 조회 (Yahoo Finance) + 환율
    const usdKrwRate = await getUsdKrwRate();
    const prices = {};

    // 해외주식 먼저 처리
    const overseasTickers = tickers.filter(name => overseasMap[name]);
    for (const name of overseasTickers) {
      const yahooTicker = overseasMap[name];
      try {
        const usdPrice = await getOverseasPrice(yahooTicker);
        // KRW로 환산해서 저장 (앱에서 KRW로 표시)
        prices[name] = usdPrice ? {
          usd: usdPrice,
          krw: Math.round(usdPrice * usdKrwRate),
          isOverseas: true,
          rate: usdKrwRate,
        } : null;
        await new Promise(r => setTimeout(r, 50));
      } catch { prices[name] = null; }
    }

    // 국내주식 처리 (한투 API)
    const domesticTickers = tickers.filter(name => !overseasMap[name]);
    const token = await getAccessToken();

    for (const name of domesticTickers) {
      // ✅ 최종 우선순위:
      // 1) TICKER_MAP: 사람이 검증한 코드 (가장 신뢰)
      // 2) savedCodes: 이미지에서 추출한 코드 (오염 가능성 있어서 2순위로)
      // 3) dynamicCache: 이전 조회 캐시
      // 4) KRX/네이버 API: 완전히 새로운 종목에만
      let code = TICKER_MAP[name] || savedCodes[name] || dynamicCache[name];

      if (!code) {
        code = await guessTickerCode(name); // 네이버 API는 완전 새 종목에만
      }
      if (code) dynamicCache[name] = code;
      if (!code) { prices[name] = null; continue; }

      try {
        prices[name] = await getCurrentPrice(token, code);
        await new Promise(r => setTimeout(r, 100));
      } catch { prices[name] = null; }
    }

    // resolvedCodes: 이번에 실제로 사용한 종목코드 매핑 (App.jsx가 다음 저장 시 tickerCode로 캐싱하도록)
    const resolvedCodes = {};
    for (const name of domesticTickers) {
      const c = dynamicCache[name];
      if (c) resolvedCodes[name] = c;
    }

    return res.status(200).json({ prices, usdKrwRate, resolvedCodes });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ===== 시장 현황 헬퍼 함수들 =====

async function fetchMarketIndex() {
  try {
    const [ksRes, kqRes] = await Promise.all([
      fetch('https://m.stock.naver.com/api/index/KOSPI/basic', {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://m.stock.naver.com/' }
      }),
      fetch('https://m.stock.naver.com/api/index/KOSDAQ/basic', {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://m.stock.naver.com/' }
      }),
    ]);
    const [ksd, kqd] = await Promise.all([ksRes.json(), kqRes.json()]);

    const parse = (d) => {
      if (!d) return null;
      // 네이버 API 응답 구조: indexNm, closePrice, compareToPreviousClosePrice, fluctuationsRatio
      const price = parseFloat(String(d.closePrice || d.currentPrice || 0).replace(/,/g, ''));
      const change = parseFloat(String(d.compareToPreviousClosePrice || d.changePrice || 0).replace(/,/g, ''));
      const pct = parseFloat(String(d.fluctuationsRatio || d.changeRate || 0).replace(/,/g, ''));
      if (!price) return null;
      return { price, change, pct };
    };

    return { kospi: parse(ksd), kosdaq: parse(kqd) };
  } catch { return { kospi: null, kosdaq: null }; }
}

// ✅ v: 3번째 재설계. 네이버(스크래핑 사망) → Yahoo(상장주식수 불안정) → KIS 개별종목 반복호출(토큰 경쟁+알림 스팸)
// → data.krx.co.kr 공개 API(HTTP 400 - 세션/파라미터 요구사항이 문서와 달라 즉시 실패, 살아있는 서비스 아니었음)
// 순서로 전부 실패. → 이번엔 KIS(한국투자증권) Open API 안에 있는 "국내주식 시가총액 상위" 전용 순위 조회
// 엔드포인트(TR_ID: FHPST01740000)로 교체. 이미 이 앱에서 검증되어 잘 동작 중인 토큰 발급(getAccessToken)을
// 그대로 재사용하고, 종목별로 반복 호출하지 않고 시장(코스피/코스닥)당 딱 1번 호출로 상위 30개를 한 번에 받음
// (이 API 자체가 최대 30건까지만 주는 구조라 "TOP30" 요구사항과 정확히 맞음) → KIS 토큰 경쟁/알림 스팸 문제
// 원천 차단, TOP10/맵차트가 항상 같은 배열에서 나와 서로 어긋날 일도 없음.
async function fetchMarketCap(sosok) {
  const iscd = sosok === 0 ? '0001' : '1001'; // 0001=코스피(거래소), 1001=코스닥
  try {
    const token = await getAccessToken();
    const url = `https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/ranking/market-cap?fid_cond_mrkt_div_code=J&fid_cond_scr_div_code=20174&fid_div_cls_code=0&fid_input_iscd=${iscd}&fid_trgt_cls_code=0&fid_trgt_exls_cls_code=0&fid_input_price_1=&fid_input_price_2=&fid_vol_cnt=`;
    const res = await fetch(url, {
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        appkey: process.env.KIS_APP_KEY,
        appsecret: process.env.KIS_APP_SECRET,
        tr_id: 'FHPST01740000',
      },
    });
    const data = await res.json().catch(() => null);
    const rows = data?.output;
    if (!Array.isArray(rows) || rows.length === 0) {
      const reason = data?.msg1 || `HTTP ${res.status}`;
      return { top10: [], mapList: [], otherCount: null, otherMarketCap: null, totalMarketCap: null, error: reason };
    }

    // KIS 표준 등락 부호 코드: 1=상한 2=상승 3=보합 4=하락 5=하한 (raw 필드 자체엔 부호가 없을 수 있어 이걸로 재적용)
    const parsed = rows.map(r => {
      const signCode = String(r.prdy_vrss_sign || '');
      const isDown = signCode === '4' || signCode === '5';
      const changeAbs = Math.abs(parseInt(r.prdy_vrss) || 0);
      const pctAbs = Math.abs(parseFloat(r.prdy_ctrt) || 0);
      const change = isDown ? -changeAbs : changeAbs;
      const pctNum = isDown ? -pctAbs : pctAbs;
      // ⚠️ stck_avls 단위는 억원으로 추정(공식 문서에서 이 필드 하나만 콕 집어 확인은 못함, 같은 API 계열의
      // 다른 필드들이 억원 단위인 사례로 유추). 배포 후 삼성전자 시총이 대략 400만(=400조원) 근처로 보이는지 확인 필요.
      const marketCap = r.stck_avls ? Math.round(Number(r.stck_avls)) : null;
      const marketShare = r.mrkt_whol_avls_rlim ? parseFloat(r.mrkt_whol_avls_rlim) : null; // 시장 전체 대비 비중(%)
      return {
        rank: Number(r.data_rank) || 0,
        name: r.hts_kor_isnm || '',
        price: parseInt(r.stck_prpr) || 0,
        change,
        pct: (pctNum >= 0 ? '+' : '') + pctNum.toFixed(2) + '%',
        pctNum,
        isUp: pctNum >= 0,
        marketCap,
        _marketShare: marketShare,
      };
    }).filter(s => s.name && s.price > 0)
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .map((s, i) => ({ ...s, rank: i + 1 }));

    const mapList = parsed.slice(0, 30).map(({ _marketShare, ...rest }) => rest);
    const top10 = mapList.slice(0, 10);

    // ✅ "시장 전체 시가총액"은 이 API가 안 주지만, mrkt_whol_avls_rlim(이 종목이 시장 전체에서 차지하는 비중 %)를
    // 거꾸로 풀면 유추 가능: 전체 = 이 종목 시총 ÷ (비중/100). 여러 종목으로 각각 구해 평균 내서 오차를 줄임.
    const totalEstimates = parsed.filter(s => s.marketCap && s._marketShare).map(s => s.marketCap / (s._marketShare / 100));
    const totalMarketCap = totalEstimates.length ? Math.round(totalEstimates.reduce((a, b) => a + b, 0) / totalEstimates.length) : null;
    const top30Sum = mapList.reduce((sum, s) => sum + (s.marketCap || 0), 0);
    const otherMarketCap = (totalMarketCap && totalMarketCap > top30Sum) ? totalMarketCap - top30Sum : null;
    // ✅ 이 API는 최대 30건만 주기 때문에 31위 이후 "종목 수"는 알 수 없음(합계 시총만 근사 가능) - null로 명시
    const errOut = mapList.every(s => !s.marketCap)
      ? `KIS 응답에 시가총액 필드 없음 (샘플: ${JSON.stringify(rows[0]).slice(0, 200)})`
      : undefined;

    return { top10, mapList, otherCount: null, otherMarketCap, totalMarketCap, error: errOut };
  } catch (e) {
    return { top10: [], mapList: [], otherCount: null, otherMarketCap: null, totalMarketCap: null, error: `예외: ${e.message}` };
  }
}

async function fetchIntraday(symbol) {
  try {
    const { result } = await fetchYahooChart(symbol, { interval: '5m', range: '1d' });
    if (!result?.timestamp) return [];
    const ts = result.timestamp;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const prevClose = result.meta?.chartPreviousClose || result.meta?.previousClose;
    return ts.map((t, i) => ({
      time: new Date(t * 1000).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }),
      close: closes[i] ? Math.round(closes[i] * 100) / 100 : null,
      prevClose,
    })).filter(c => c.close !== null);
  } catch { return []; }
}
