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

      // 환율
      let usdKrw = 1380;
      try {
        const fxRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const fxData = await fxRes.json();
        usdKrw = fxData?.chart?.result?.[0]?.meta?.regularMarketPrice || 1380;
      } catch {}

      const candles = ts.map((t, i) => ({
        date: new Date(t * 1000).toISOString().split('T')[0],
        open: Math.round((q.open?.[i] || 0) * usdKrw),
        high: Math.round((q.high?.[i] || 0) * usdKrw),
        low: Math.round((q.low?.[i] || 0) * usdKrw),
        close: Math.round((q.close?.[i] || 0) * usdKrw),
        volume: q.volume?.[i] || 0,
      })).filter(c => c.close > 0);

      return res.status(200).json({ candles });
    }

    // 국내주식: 네이버 금융
    const code = tickerCode || '';
    if (!code) return res.status(200).json({ candles: [], error: '종목코드 없음' });

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

    // 첫 행은 헤더, 나머지가 데이터 (최신 → 오래된 순)
    const candles = raw.slice(1).map(row => ({
      date: String(row[0]).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      open: Number(row[1]) || 0,
      high: Number(row[2]) || 0,
      low: Number(row[3]) || 0,
      close: Number(row[4]) || 0,
      volume: Number(row[5]) || 0,
    })).filter(c => c.close > 0).reverse(); // 오래된 순으로

    return res.status(200).json({ candles });
  } catch (error) {
    console.error('chart error:', error.message);
    return res.status(200).json({ candles: [], error: error.message });
  }
}
