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
      const interval = intervalMap[timeframe] || '1d';
      const range = rangeMap[timeframe] || '3mo';

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${tickerCode}?interval=${interval}&range=${range}`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      });
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      if (!result) return res.status(200).json({ candles: [], volume: [] });

      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const opens = quote.open || [];
      const highs = quote.high || [];
      const lows = quote.low || [];
      const closes = quote.close || [];
      const volumes = quote.volume || [];

      // 환율 가져오기
      const fxRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const fxData = await fxRes.json();
      const usdKrw = fxData?.chart?.result?.[0]?.meta?.regularMarketPrice || 1380;

      const candles = timestamps.map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        open: Math.round((opens[i] || 0) * usdKrw),
        high: Math.round((highs[i] || 0) * usdKrw),
        low: Math.round((lows[i] || 0) * usdKrw),
        close: Math.round((closes[i] || 0) * usdKrw),
        volume: volumes[i] || 0,
      })).filter(c => c.close > 0);

      return res.status(200).json({ candles, currency: 'KRW', usdKrw });
    }

    // 국내주식: 네이버 금융
    const code = tickerCode || ticker;
    const countMap = { day: 120, week: 100, month: 60 };
    const count = countMap[timeframe] || 120;
    const timeframeParam = timeframe === 'day' ? 'day' : timeframe === 'week' ? 'week' : 'month';

    // 네이버 금융 차트 API
    const naverUrl = `https://api.finance.naver.com/siseJson.naver?symbol=${code}&requestType=1&count=${count}&timeframe=${timeframeParam}`;
    const r = await fetch(naverUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.naver.com',
        'Accept': '*/*',
      }
    });

    const text = await r.text();
    // 네이버 응답 형식: [["날짜","시가","고가","저가","종가","거래량","외국인소진율"], ...]
    // 첫 줄은 헤더
    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      // 파싱 실패 시 빈 배열
      return res.status(200).json({ candles: [], volume: [] });
    }

    if (!Array.isArray(raw) || raw.length < 2) {
      return res.status(200).json({ candles: [], volume: [] });
    }

    // 첫 번째 행은 헤더
    const rows = raw.slice(1);
    const candles = rows.map(row => ({
      date: String(row[0]).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      open: Number(row[1]) || 0,
      high: Number(row[2]) || 0,
      low: Number(row[3]) || 0,
      close: Number(row[4]) || 0,
      volume: Number(row[5]) || 0,
    })).filter(c => c.close > 0).reverse(); // 최신 → 오래된 순으로 뒤집기

    return res.status(200).json({ candles, currency: 'KRW' });
  } catch (error) {
    console.error('chart error:', error.message);
    return res.status(200).json({ candles: [], volume: [], error: error.message });
  }
}
