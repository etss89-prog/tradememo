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

    // ✅ 시장 현황 조회 (코스피/코스닥 지수 + 시총순위 + 1일차트)
    if (type === 'market') {
      const results = await Promise.all([
        fetchMarketIndex(),
        fetchMarketCap(0),
        fetchMarketCap(1),
        fetchIntraday('%5EKS11'),
        fetchIntraday('%5EKQ11'),
      ]);
      return res.status(200).json({
        indices: results[0],
        kospiTop: results[1],
        kosdaqTop: results[2],
        kospiChart: results[3],
        kosdaqChart: results[4],
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
    const [ks, kq] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?interval=1d&range=2d', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EKQ11?interval=1d&range=2d', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    ]);
    const [ksd, kqd] = await Promise.all([ks.json(), kq.json()]);
    const parse = (d) => {
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta) return null;
      const cur = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose || meta.previousClose;
      const change = cur - prev;
      const pct = (change / prev) * 100;
      return { price: Math.round(cur * 100) / 100, change: Math.round(change * 100) / 100, pct: Math.round(pct * 100) / 100 };
    };
    return { kospi: parse(ksd), kosdaq: parse(kqd) };
  } catch { return { kospi: null, kosdaq: null }; }
}

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
    while ((m = rowPattern.exec(html)) !== null && rows.length < 10) {
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

      // 등락률
      const pctMatch = row.match(/class="(up|down)"[^>]*>[\s\S]*?<span[^>]*>([\d.]+)<\/span>/);
      const isUp = pctMatch?.[1] === 'up';
      const pct = pctMatch ? (isUp ? '+' : '-') + pctMatch[2] + '%' : '0%';

      // 시가총액 (억 단위) - numberCells에서 6번째 (인덱스 5)
      // 네이버 컬럼 순서: 현재가, 전일비, 등락률, 거래량, 거래대금, 시가총액, PER, ROE...
      let marketCap = null;
      if (numberCells.length >= 6) {
        const capRaw = Number(numberCells[5]);
        if (capRaw > 0) marketCap = capRaw; // 이미 억 단위
      }

      rows.push({ rank: rows.length + 1, name, price, pct, isUp, marketCap, code });
    }

    if (rows.length >= 5) {
      return rows.slice(0, 10).map(({ code, ...rest }) => rest);
    }

    // 파싱 실패 시 네이버 JSON API 시도
    const jsonUrl = `https://m.stock.naver.com/api/stock/marketValue/${market}?page=1&pageSize=10`;
    const jr = await fetch(jsonUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://m.stock.naver.com/' }
    });
    if (jr.ok) {
      const jd = await jr.json();
      const jStocks = jd?.stocks || jd?.list || (Array.isArray(jd) ? jd : null);
      if (jStocks && jStocks.length >= 5) {
        return jStocks.slice(0, 10).map((s, i) => {
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
            isUp: up,
            marketCap: null,
          };
        }).filter(s => s.name && s.price > 0);
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
    return results.map((r, i) => {
      if (r.status !== 'fulfilled') return { rank: i+1, name: names[i], price: 0, pct: '0%', isUp: false, marketCap: null };
      const result = r.value?.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta) return { rank: i+1, name: names[i], price: 0, pct: '0%', isUp: false, marketCap: null };
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
        isUp,
        marketCap: mktCap,
      };
    });
  } catch { return []; }
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
