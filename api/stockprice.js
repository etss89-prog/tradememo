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
  "시지트로닉스": "049630",
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

// ✅ Yahoo Finance로 해외주식 현재가 조회 (API 키 불필요)
async function getOverseasPrice(ticker) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        }
      }
    );
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price ? Math.round(price * 10000) / 10000 : null; // 소수점 4자리
  } catch {
    return null;
  }
}

// ✅ USD → KRW 환율 조회
async function getUsdKrwRate() {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );
    const data = await res.json();
    const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return rate || 1380; // 기본값 1380원
  } catch {
    return 1380;
  }
}

async function getAccessToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('토큰 발급 실패');
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
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

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${yRange}`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
        const d = await r.json();
        const result = d?.chart?.result?.[0];
        if (!result?.timestamp) return res.status(200).json({ data: [] });

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

    // ✅ 시장 현황 조회 (코스피/코스닥 지수 + 시총순위 + 1일차트 + 맵차트)
    if (type === 'market') {
      const results = await Promise.all([
        fetchMarketIndex(),
        fetchMarketCap(0),
        fetchMarketCap(1),
        fetchIntraday('%5EKS11'),
        fetchIntraday('%5EKQ11'),
        getMarketCapFullTotal(0),
        getMarketCapFullTotal(1),
      ]);
      const kospiCap = results[1] || {};
      const kosdaqCap = results[2] || {};
      const kospiTop50Sum = kospiCap.totalMarketCap || 0;
      const kosdaqTop50Sum = kosdaqCap.totalMarketCap || 0;
      // 안전장치: 공식 전체 시총 파싱값이 "상위 50개 합"보다 작으면 파싱 실패/오류로 간주하고 버림
      // (전체 시총은 반드시 상위 50개 합 이상이어야 정상)
      const kospiOfficialTotal = (results[5] && results[5] >= kospiTop50Sum) ? results[5] : null;
      const kosdaqOfficialTotal = (results[6] && results[6] >= kosdaqTop50Sum) ? results[6] : null;
      return res.status(200).json({
        // ── 기존 필드 (그대로 유지, 기존 UI 영향 없음) ──
        indices: results[0],
        kospiTop: kospiCap.top10 || [],
        kosdaqTop: kosdaqCap.top10 || [],
        kospiChart: results[3],
        kosdaqChart: results[4],
        // ── 신규 필드 (맵차트용, 추가된 것만) ──
        kospiMap: kospiCap.mapList || [],
        kosdaqMap: kosdaqCap.mapList || [],
        kospiMapTotal: kospiCap.totalMarketCap ?? null,     // 상위 50개 합 (fallback용)
        kosdaqMapTotal: kosdaqCap.totalMarketCap ?? null,
        kospiTotalMarketCap: kospiOfficialTotal,            // ✅ 코스피 시장 전체 시가총액 (파싱 성공 시에만)
        kosdaqTotalMarketCap: kosdaqOfficialTotal,          // ✅ 코스닥 시장 전체 시가총액
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

// ✅ 코스피/코스닥 "시장 전체" 시가총액 조회
// v1.5.12에서 시도했던 "네이버 지수 상세페이지(sise_index.naver)의 시가총액 항목 파싱" 방식은
// 실제 배포 후 확인해보니 값을 못 찾아 계속 폴백("상위 50개 합")으로만 표시되는 것으로 확인됨.
// → 이미 정상 동작이 검증된 fetchMarketCap의 "시총순위 페이지" 파싱 로직을 그대로 재사용해서,
//   1페이지(상위 50개)만 보던 것을 전체 페이지로 확장해 실제 상장된 모든 종목의 시가총액을 합산하는
//   방식으로 교체함. 같은 파싱 방식이라 신뢰도가 더 높음.
// 페이지 수가 많아(코스피 약 20페이지, 코스닥 약 35페이지) 매 요청마다 다시 긁으면 느리고 부담이 커서
// 30분 서버 캐시를 둠 (Vercel 서버리스 특성상 콜드스타트 시엔 캐시가 비어 다시 전체 스크래핑이 일어날 수 있음).
const marketCapTotalCache = { 0: null, 1: null };
const marketCapTotalCachedAt = { 0: null, 1: null };
const MARKET_CAP_TOTAL_TTL = 30 * 60 * 1000; // 30분

async function getMarketCapFullTotal(sosok) {
  const now = Date.now();
  if (marketCapTotalCache[sosok] && marketCapTotalCachedAt[sosok] && now - marketCapTotalCachedAt[sosok] < MARKET_CAP_TOTAL_TTL) {
    return marketCapTotalCache[sosok];
  }
  const result = await fetchMarketCapFullTotal(sosok);
  if (result && result.total > 0) {
    marketCapTotalCache[sosok] = result.total;
    marketCapTotalCachedAt[sosok] = now;
    return result.total;
  }
  return marketCapTotalCache[sosok]; // 이번에 실패하면 이전 캐시라도(없으면 null) 반환
}

async function fetchMarketCapFullTotal(sosok) {
  try {
    const naverHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept-Charset': 'EUC-KR,utf-8;q=0.7,*;q=0.3',
      'Referer': 'https://finance.naver.com/sise/',
    };
    const fetchHtml = async (page) => {
      const url = `https://finance.naver.com/sise/sise_market_sum.naver?sosok=${sosok}&page=${page}`;
      const r = await fetch(url, { headers: naverHeaders });
      if (!r.ok) return '';
      const buf = await r.arrayBuffer();
      return new TextDecoder('euc-kr').decode(buf);
    };

    // 1페이지에서 하단 페이지네이션의 최대 page= 번호를 유추해서 총 페이지 수를 파악
    const html1 = await fetchHtml(1);
    if (!html1) return null;
    const pageNums = [...html1.matchAll(/sise_market_sum\.naver\?sosok=\d+&page=(\d+)/g)].map(m => Number(m[1]));
    const SAFETY_CAP = 45; // 코스닥(~1700개 종목 안팎)까지 넉넉히 커버하는 안전 상한
    const lastPage = Math.min(pageNums.length ? Math.max(...pageNums) : 1, SAFETY_CAP);

    const restPages = [];
    for (let p = 2; p <= lastPage; p++) restPages.push(p);
    const restHtmls = await Promise.allSettled(restPages.map(p => fetchHtml(p)));
    const htmls = [html1, ...restHtmls.map(r => r.status === 'fulfilled' ? r.value : '')];

    // fetchMarketCap과 동일한 행/셀 파싱 로직 재사용 (이미 검증된 방식)
    let total = 0, count = 0;
    for (const html of htmls) {
      if (!html) continue;
      const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
      let m;
      while ((m = rowPattern.exec(html)) !== null) {
        const row = m[0];
        const nameMatch = row.match(/href="[^"]*code=(\d{6})[^"]*"[^>]*>([^<]+)<\/a>/);
        if (!nameMatch) continue;
        const numberCells = [];
        const cellPattern = /<td[^>]*class="[^"]*number[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;
        let cellM;
        while ((cellM = cellPattern.exec(row)) !== null) {
          numberCells.push(cellM[1].replace(/<[^>]+>/g, '').replace(/[\s,]/g, '').trim());
        }
        if (numberCells.length > 4) {
          const cap = Number(numberCells[4]);
          if (cap > 0) { total += cap; count++; }
        }
      }
    }
    return total > 0 ? { total, count } : null;
  } catch (e) {
    console.error('fetchMarketCapFullTotal error:', e.message);
    return null;
  }
}

// ✅ 맵차트용으로 파싱 상한을 10 → 50으로 확대. top10은 기존과 100% 동일한 모양을 유지해서
// 기존 "시총 TOP10" UI에는 전혀 영향이 없고, mapList/totalMarketCap만 새로 추가됨.
const MAP_LIMIT = 50;

async function fetchMarketCap(sosok) {
  const market = sosok === 0 ? 'KOSPI' : 'KOSDAQ';
  try {
    // 네이버 시총순위 페이지 - EUC-KR 인코딩으로 가져오기
    const url = `https://finance.naver.com/sise/sise_market_sum.nhn?sosok=${sosok}&page=1`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Charset': 'EUC-KR,utf-8;q=0.7,*;q=0.3',
        'Referer': 'https://finance.naver.com/sise/',
        'Cache-Control': 'no-cache',
      }
    });
    if (!r.ok) return fetchMarketCapFallback(sosok);

    // EUC-KR 디코딩
    const buf = await r.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buf);

    const rows = [];
    // 종목명, 현재가, 전일비, 등락률, 시가총액 파싱
    // 테이블 행 패턴
    const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    let m;
    while ((m = rowPattern.exec(html)) !== null && rows.length < MAP_LIMIT) {
      const row = m[0];
      // 종목명
      const nameMatch = row.match(/href="[^"]*code=(\d{6})[^"]*"[^>]*>([^<]+)<\/a>/);
      if (!nameMatch) continue;
      const code = nameMatch[1];
      const name = nameMatch[2].trim();
      if (!name || !code) continue;

      // td.number 셀들 추출 (현재가, 전일비, 등락률, 거래량, 거래대금, 시가총액 순)
      const numberCells = [];
      const cellPattern = /<td[^>]*class="[^"]*number[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;
      let cellM;
      while ((cellM = cellPattern.exec(row)) !== null) {
        const val = cellM[1].replace(/<[^>]+>/g, '').replace(/[\s,]/g, '').trim();
        numberCells.push(val);
      }

      if (numberCells.length < 1) continue;
      const price = Number(numberCells[0]) || 0;
      if (price === 0) continue;

      // 등락률 - numberCells[2]에서 추출
      const pctRaw = numberCells[2] || '0';
      const pctNum = parseFloat(pctRaw.replace('%','')) || 0;
      const isUp = pctNum > 0;
      const pct = (pctNum > 0 ? '+' : '') + pctNum.toFixed(2) + '%';

      // 네이버 시총순위 테이블 컬럼 순서:
      // 0:현재가 1:전일비 2:등락률 3:액면가 4:거래량 5:시가총액 6:PER 7:ROE
      // 단위: 시가총액은 억원
      // 인덱스 4 = 시가총액 (억원 단위)
      // 컬럼순서: 0:현재가 1:전일비 2:등락률 3:액면가 4:시가총액 5:상장주식수 ...
      let marketCap = null;
      if (numberCells.length > 4) {
        const capRaw = Number(numberCells[4]);
        if (capRaw > 0) marketCap = capRaw;
      }

      // pctNum: 맵차트 색상 계산용 (부호 있는 숫자), pct: 기존 UI 표시용 문자열 - 둘 다 유지
      rows.push({ rank: rows.length + 1, name, price, pct, pctNum, isUp, marketCap, code });
    }

    if (rows.length >= 5) {
      const mapList = rows.map(({ code, ...rest }) => rest);
      const top10 = mapList.slice(0, 10); // ✅ 기존과 동일한 모양 (top10 UI는 영향 없음)
      const capSum = mapList.reduce((sum, s) => sum + (s.marketCap || 0), 0);
      const totalMarketCap = capSum > 0 ? capSum : null;
      return { top10, mapList, totalMarketCap };
    }

    // 파싱 실패 시 네이버 JSON API 시도 (이 경로는 marketCap을 못 채우므로 맵차트에는 부적합 → top10만 채움)
    const jsonUrl = `https://m.stock.naver.com/api/stock/marketValue/${market}?page=1&pageSize=10`;
    const jr = await fetch(jsonUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://m.stock.naver.com/' }
    });
    if (jr.ok) {
      const jd = await jr.json();
      const jStocks = jd?.stocks || jd?.list || (Array.isArray(jd) ? jd : null);
      if (jStocks && jStocks.length >= 5) {
        const list = jStocks.slice(0, 10).map((s, i) => {
          const p = Number(s.closePrice || s.currentPrice || 0);
          const prev = Number(s.compareToPreviousClosePrice || s.previousClose || 0);
          const chg = p - prev;
          const pctVal = prev > 0 ? (chg / prev * 100) : 0;
          const up = chg >= 0;
          return {
            rank: i + 1,
            name: s.stockName || s.name || '',
            price: p,
            change: Math.round(chg),
            pct: (up ? '+' : '') + pctVal.toFixed(2) + '%',
            pctNum: Math.round(pctVal * 100) / 100,
            isUp: up,
            marketCap: null,
          };
        }).filter(s => s.name && s.price > 0);
        return { top10: list, mapList: list, totalMarketCap: null };
      }
    }

    return fetchMarketCapFallback(sosok);
  } catch(e) {
    console.error('fetchMarketCap error:', e.message);
    return fetchMarketCapFallback(sosok);
  }
}

async function fetchMarketCapFallback(sosok) {
  const kospiCodes = ['005930.KS','000660.KS','373220.KS','207940.KS','005380.KS','000270.KS','068270.KS','105560.KS','055550.KS','006400.KS'];
  const kosdaqCodes = ['196170.KQ','247540.KQ','086520.KQ','028300.KQ','058470.KQ','068760.KQ','214150.KQ','240810.KQ','277810.KQ','003780.KQ'];
  const kospiNames = ['삼성전자','SK하이닉스','LG에너지솔루션','삼성바이오로직스','현대차','기아','셀트리온','KB금융','신한지주','삼성SDI'];
  const kosdaqNames = ['알테오젠','에코프로비엠','에코프로','HLB','리노공업','셀트리온헬스케어','클래시스','원익IPS','레인보우로보틱스','포스코DX'];
  const codes = sosok === 0 ? kospiCodes : kosdaqCodes;
  const names = sosok === 0 ? kospiNames : kosdaqNames;
  try {
    const results = await Promise.allSettled(codes.map(code =>
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${code}?interval=1d&range=5d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }).then(r => r.json())
    ));
    const list = results.map((r, i) => {
      if (r.status !== 'fulfilled') return { rank: i+1, name: names[i], price: 0, pct: '0%', pctNum: 0, isUp: false, marketCap: null };
      const result = r.value?.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta) return { rank: i+1, name: names[i], price: 0, pct: '0%', pctNum: 0, isUp: false, marketCap: null };
      const cur = Math.round(meta.regularMarketPrice);
      const prev = meta.chartPreviousClose || meta.previousClose || cur;
      const change = cur - prev;
      const pct = prev ? (change / prev * 100) : 0;
      const isUp = change >= 0;
      // 시가총액: regularMarketVolume * regularMarketPrice 대신 직접 계산
      const sharesOut = meta.sharesOutstanding || null;
      const mktCap = sharesOut ? Math.round(sharesOut * cur / 100000000) : null; // 억원
      return {
        rank: i+1,
        name: names[i],
        price: cur,
        change: Math.round(change),
        pct: (isUp?'+':'') + pct.toFixed(2) + '%',
        pctNum: Math.round(pct * 100) / 100,
        isUp,
        marketCap: mktCap,
      };
    });
    const capSum = list.reduce((sum, s) => sum + (s.marketCap || 0), 0);
    return { top10: list, mapList: list, totalMarketCap: capSum > 0 ? capSum : null };
  } catch { return { top10: [], mapList: [], totalMarketCap: null }; }
}

async function fetchIntraday(symbol) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await r.json();
    const result = data?.chart?.result?.[0];
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
