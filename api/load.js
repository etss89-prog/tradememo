export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(200).json({ records: [], portfolios: {} });

    const [r1, r2, r3, r4, r5, r6] = await Promise.all([
      fetch(`${url}/get/tradememo_records`,    { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_portfolios`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_portfolio`,  { headers: { Authorization: `Bearer ${token}` } }), // 구버전
      fetch(`${url}/get/tradememo_accounts`,   { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_maintext`,   { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_prices`,     { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const [d1, d2, d3, d4, d5, d6] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json(), r5.json(), r6.json()]);

    // records
    let records = [];
    if (d1.result) {
      try { records = Array.isArray(d1.result) ? d1.result : JSON.parse(d1.result); } catch { records = []; }
    }

    // portfolios
    let portfolios = {};
    if (d2.result) {
      try { portfolios = typeof d2.result === 'object' && !Array.isArray(d2.result) ? d2.result : JSON.parse(d2.result); } catch { portfolios = {}; }
    } else if (d3.result) {
      try {
        const old = typeof d3.result === 'object' ? d3.result : JSON.parse(d3.result);
        if (old && old.stocks) portfolios = { main: old };
      } catch { portfolios = {}; }
    }

    // accounts
    let accounts = null;
    if (d4.result) {
      try { accounts = Array.isArray(d4.result) ? d4.result : JSON.parse(d4.result); } catch { accounts = null; }
    }

    // mainText
    let mainText = null;
    if (d5.result) {
      try { mainText = typeof d5.result === 'object' ? d5.result : JSON.parse(d5.result); } catch { mainText = null; }
    }

    // livePrices (현재가 - save-prices.js로 별도 저장)
    let livePrices = null;
    let priceUpdatedAt = null;
    if (d6.result) {
      try {
        const p = typeof d6.result === 'object' ? d6.result : JSON.parse(d6.result);
        livePrices = p.livePrices || null;
        priceUpdatedAt = p.priceUpdatedAt || null;
      } catch {}
    }

    return res.status(200).json({
      records: Array.isArray(records) ? records : [],
      portfolios,
      ...(accounts ? { accounts } : {}),
      ...(mainText ? { mainText } : {}),
      ...(livePrices ? { livePrices } : {}),
      ...(priceUpdatedAt ? { priceUpdatedAt } : {}),
    });
  } catch (error) {
    return res.status(200).json({ records: [], portfolios: {} });
  }
}
