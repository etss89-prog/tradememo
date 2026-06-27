export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(200).json({ records: [], portfolios: {} });

    const [r1, r2, r3] = await Promise.all([
      fetch(`${url}/get/tradememo_records`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_portfolios`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_portfolio`, { headers: { Authorization: `Bearer ${token}` } }), // 구버전 호환
    ]);

    const d1 = await r1.json();
    const d2 = await r2.json();
    const d3 = await r3.json();

    let records = [];
    if (d1.result) {
      try { records = Array.isArray(d1.result) ? d1.result : JSON.parse(d1.result); } catch { records = []; }
    }

    let portfolios = {};
    if (d2.result) {
      // 새 구조 (portfolios 복수)
      try { portfolios = typeof d2.result === 'object' && !Array.isArray(d2.result) ? d2.result : JSON.parse(d2.result); } catch { portfolios = {}; }
    } else if (d3.result) {
      // 구버전 호환 (portfolio 단수 → main 계좌로 변환)
      try {
        const old = typeof d3.result === 'object' ? d3.result : JSON.parse(d3.result);
        if (old && old.stocks) portfolios = { main: old };
      } catch { portfolios = {}; }
    }

    return res.status(200).json({ records: Array.isArray(records) ? records : [], portfolios });
  } catch (error) {
    return res.status(200).json({ records: [], portfolios: {} });
  }
}
