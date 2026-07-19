// stockprice.js와 동일한 TICKER_MAP - tickerCode 없을 때 폴백으로 사용
const TICKER_MAP = {
  "SK하이닉스": "000660", "LG전자우": "066575", "한솔테크닉스": "004710",
  "기가비스": "420770", "그리드위즈": "453450", "OCI홀딩스": "010060",
  "한화솔루션": "009830", "유니테스트": "086390", "대한전선": "001440",
  "SK오션플랜트": "100090", "아톤": "158430", "원익QnC": "074600",
  "해성디에스": "195870", "산일전기": "062040", "현대차": "005380",
  "마이크로컨텍솔": "098120", "티에프피": "149530", "한화솔루션우": "009835",
  "에이엘티": "172670", "지투파워": "388050", "상아프론테크": "089980",
  "시지트로닉스": "049630", "켐트로닉스": "089010", "현대차2우B": "005387",
  "가온칩스": "399720", "SK이노베이션우": "096775", "한솔테크닉스39R": "004717",
  "펄어비스": "263750", "SK이노베이션": "096770", "티에스이": "131290",
  "뉴로메카": "348340", "일진하이솔루스": "271940", "서울바이오시스": "328130",
  "누리플렉스": "040160", "뉴프렉스": "085670", "대덕1우": "008045",
  "대덕": "008060", "RF머트리얼즈": "327260", "삼성전자": "005930",
  "삼성전자우": "005935", "SK텔레콤": "017670", "카카오": "035720",
  "네이버": "035420", "NAVER": "035420", "LG에너지솔루션": "373220",
  "삼성SDI": "006400", "현대모비스": "012330", "POSCO홀딩스": "005490",
  "셀트리온": "068270", "기아": "000270", "KB금융": "105560",
  "신한지주": "055550", "하나금융지주": "086790", "삼성바이오로직스": "207940",
  "HD현대에너지솔루션": "322000", "아이앤씨": "052860", "티에프이": "425420",
  "TIGER 코스닥150 레버리지": "233740", "TIGER코스닥150레버리지": "233740",
  "KODEX SK하이닉스단일종목레버리지": "472870",
  "SOL 반도체전공정": "475300", "KODEX AI반도체핵심장비": "471990",
  "ACE 엔비디아채권혼합": "448540", "ACE 미국30년국채액티브(H)": "461680",
  "ACE 국고채10년": "365780",
};

// 네이버 자동완성으로 종목코드 검색
async function findCodeByName(name) {
  if (TICKER_MAP[name]) return TICKER_MAP[name];
  try {
    const r = await fetch(
      `https://ac.finance.naver.com/ac?q=${encodeURIComponent(name)}&q_enc=UTF-8&st=111&frm=stock&r_format=json&r_enc=UTF-8`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://finance.naver.com' } }
    );
    const data = await r.json();
    const names = data?.items?.[0] || [];
    const codes = data?.items?.[1] || [];
    for (let i = 0; i < names.length; i++) {
      const n = names[i]?.[0]?.replace(/<[^>]+>/g, '').trim();
      const c = codes[i]?.[0];
      if (n && c && n.replace(/\s/g,'').toLowerCase() === name.replace(/\s/g,'').toLowerCase()) return c;
    }
  } catch {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker, tickerCode, timeframe = 'day', isOverseas = false } = req.body || {};
  if (!ticker) return res.status(400).json({ error: 'ticker 필요' });

  try {
    // 해외주식: Yahoo Finance
    if (isOverseas && tickerCode) {
      const intervalMap = { day: '1d', week: '1wk', month: '1mo' };
      const rangeMap = { day: '3mo', week: '1y', month: '3y' };
      const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${tickerCode}?interval=${intervalMap[timeframe]||'1d'}&range=${rangeMap[timeframe]||'3mo'}`;
      const yRes = await fetch(yUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const yData = await yRes.json();
      const result = yData?.chart?.result?.[0];
      if (!result) return res.status(200).json({ candles: [] });
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
      return res.status(200).json({ candles });
    }

    // 국내주식: tickerCode 없으면 TICKER_MAP 또는 네이버에서 찾기
    const code = tickerCode || await findCodeByName(ticker);
    if (!code) return res.status(200).json({ candles: [], error: `종목코드를 찾을 수 없음: ${ticker}` });

    const tfParam = timeframe === 'week' ? 'week' : timeframe === 'month' ? 'month' : 'day';
    const count = timeframe === 'day' ? 120 : timeframe === 'week' ? 100 : 60;

    const url = `https://api.finance.naver.com/siseJson.naver?symbol=${code}&requestType=1&count=${count}&timeframe=${tfParam}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.naver.com',
      }
    });

    const text = await r.text();
    let raw;
    try { raw = JSON.parse(text); } catch { return res.status(200).json({ candles: [] }); }
    if (!Array.isArray(raw) || raw.length < 2) return res.status(200).json({ candles: [] });

    const candles = raw.slice(1).map(row => ({
      date: String(row[0]).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      open: Number(row[1])||0, high: Number(row[2])||0,
      low: Number(row[3])||0, close: Number(row[4])||0,
      volume: Number(row[5])||0,
    })).filter(c => c.close > 0).reverse();

    return res.status(200).json({ candles });
  } catch (error) {
    return res.status(200).json({ candles: [], error: error.message });
  }
}
