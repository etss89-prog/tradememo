const TICKER_MAP = {
  // 정확한 종목명
  "SK하이닉스": "000660",
  "LG전자우": "066575",
  "한솔테크닉스": "004710",
  "기가비스": "420770",
  "그리드위즈": "453440",
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
  "에이엘티": "200470",
  "지투파워": "344490",
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
  "뉴로메카": "348740",
  "일진하이솔루스": "271940",
  "서울바이오시스": "328130",
  "아이엠씨": "101390",
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
  "1Q 코스닥150채권혼합50액티브": "0145J0",
  "1Q 200채권혼합50액티브": "0137R0",
  "KODEX 차이나A50": "302190",
  "RISE 네트워크인프라": "0053M0",
  "TIGER 차이나전기차SOLACTIVE": "371460",
  "TIGER 차이나전기차솔액티브": "371460",
  "KODEX 차이나항셍테크": "371150",
  "HANARO Fn친환경에너지": "381570",   // ✅ 381180 → 381570 수정
  "HANARO 증권고배당TOP3플러스": "0111J0", // ✅ 추가
  "HANARO 전력설비투자": "491820",     // ✅ 추가
  "PLUS 태양광&ESS": "457990",         // ✅ 423160 → 457990 수정
  "PLUS 글로벌히토류&전략자원생산기업": "0072R0",
  "KODEX 삼성전자채권혼합": "0135K0",
  "KODEX 삼성전자채권혼합50": "0135K0",
  "SOL AI반도체소부장": "0130Z0",
  "ACE 테슬라밸류체인인액티브": "0060J0",
  "ACE 테슬라밸류체인액티브": "0060J0",
  "PLUS 태양광&ESS": "457990",
  "RISE 2차전지TOP10": "0072S0",
  "ACE 마이크로소프트밸류체인인액티브": "0072T0",
  "KODEX AI전력핵심설비": "0117T0",
  "HANARO 전력설비투자": "491820",
  "UNICORN SK하이닉스밸류체인액티브": "0117W0",
  "ACE 국고채10년": "461680",
  "KODEX 삼성전자SK하이닉스채권혼합50": "0135L0",
  "SOL AI반도체소부장": "0130Z0",

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
  // ETF 코드 형식 판별 (숫자 6자리 = 주식/ETF, 영숫자 혼합 = 신규ETF)
  const marketCode = /^\d{6}$/.test(code) ? 'J' : 'ETF';
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
  return price > 0 ? price : null;
}

async function guessTickerCode(tickerName) {
  if (dynamicCache[tickerName]) return dynamicCache[tickerName];
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 50,
        messages: [{ role: 'user', content: `한국 주식 종목명 "${tickerName}"의 6자리 종목코드를 숫자만 답해줘. 모르면 "모름"이라고만 답해.` }]
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() || '';
    const match = text.match(/\d{6}/);
    if (match) { dynamicCache[tickerName] = match[0]; return match[0]; }
  } catch {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { tickers } = req.body;
    if (!tickers || !Array.isArray(tickers)) return res.status(400).json({ error: 'tickers 배열 필요' });

    const token = await getAccessToken();
    const prices = {};

    for (const name of tickers) {
      let code = TICKER_MAP[name] || dynamicCache[name];
      if (!code) code = await guessTickerCode(name);
      if (!code) { prices[name] = null; continue; }
      try {
        prices[name] = await getCurrentPrice(token, code);
        await new Promise(r => setTimeout(r, 100));
      } catch { prices[name] = null; }
    }

    return res.status(200).json({ prices });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
