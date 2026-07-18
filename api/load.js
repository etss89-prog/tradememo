export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ✅ 서버에서 PIN 검증
  const { pin } = req.body || {};
  const ADMIN_PIN = process.env.ADMIN_PIN || "4254";
  const VIEWER_PIN = process.env.VIEWER_PIN || "2026";

  if (pin !== ADMIN_PIN && pin !== VIEWER_PIN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const isAdmin = pin === ADMIN_PIN;

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

    const parse = async (r) => { const d = await r.json(); if (!d.result) return null; try { return typeof d.result === 'object' ? d.result : JSON.parse(d.result); } catch { return null; } };
    const [records, portfolios, accounts, mainText, priceData] = await Promise.all([recRes, portRes, accRes, mainRes, priceRes].map(parse));

    const responseData = {
      records: records || [],
      portfolios: portfolios || {},
      accounts: accounts || [],
      mainText: mainText || null,
      livePrices: priceData?.livePrices || {},
      priceUpdatedAt: priceData?.priceUpdatedAt || null,
    };

    // 조회자에게는 수량/보유금액 관련 민감 데이터 마스킹
    if (!isAdmin) {
      // 매매기록의 수량 정보 제거
      if (responseData.records) {
        responseData.records = responseData.records.map(r => ({
          ...r,
          result: r.result ? {
            ...r.result,
            stocks: (r.result.stocks || []).map(s => ({
              ...s,
              trades: (s.trades || []).map(t => ({ ...t, quantity: null, total: null }))
            }))
          } : null
        }));
      }
    }

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
