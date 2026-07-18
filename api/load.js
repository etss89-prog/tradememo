export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(500).json({ error: 'DB not configured' });

    const [recRes, portRes, accRes, mainRes, priceRes] = await Promise.all([
      fetch(`${url}/get/tradememo_records`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_portfolios`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_accounts`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_main`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_prices`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const parse = async (r) => {
      const d = await r.json();
      if (!d.result) return null;
      try { return typeof d.result === 'object' ? d.result : JSON.parse(d.result); } catch { return null; }
    };

    const [records, portfolios, accounts, mainText, priceData] = await Promise.all(
      [recRes, portRes, accRes, mainRes, priceRes].map(parse)
    );

    return res.status(200).json({
      records: records || [],
      portfolios: portfolios || {},
      accounts: accounts || [],
      mainText: mainText || null,
      livePrices: priceData?.livePrices || {},
      priceUpdatedAt: priceData?.priceUpdatedAt || null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
