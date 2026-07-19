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

    // 국내주식
    const code = tickerCode || TICKER_MAP[ticker];
    if (!code) return res.status(200).json({ candles: [], scale: 1, error: `종목코드 없음: ${ticker}` });

    const suffixes = KOSDAQ_CODES.has(code) ? ['.KQ', '.KS'] : ['.KS', '.KQ'];

    let candles = [];
    let scale = 1; // 보정 비율 (1 = 정상, 0.1 = 10배였음)

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
        if (!result?.timestamp || result.timestamp.length < 2) continue;

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

        if (parsed.length < 5) continue;

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
      } catch {}
    }

    // scale 응답에 포함 → App.jsx에서 avgBuy 보정에 사용
    return res.status(200).json({ candles, scale });
  } catch (error) {
    return res.status(200).json({ candles: [], scale: 1, error: error.message });
  }
}
