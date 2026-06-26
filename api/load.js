export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(200).json({ records: [], portfolio: null });

    const [r1, r2] = await Promise.all([
      fetch(`${url}/get/tradememo_records`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/tradememo_portfolio`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const d1 = await r1.json();
    const d2 = await r2.json();

    let records = [];
    if (d1.result) {
      try { records = Array.isArray(d1.result) ? d1.result : JSON.parse(d1.result); } catch { records = []; }
    }

    let portfolio = null;
    if (d2.result) {
      try { portfolio = typeof d2.result === 'object' ? d2.result : JSON.parse(d2.result); } catch { portfolio = null; }
    }

    return res.status(200).json({ records: Array.isArray(records) ? records : [], portfolio });
  } catch (error) {
    return res.status(200).json({ records: [], portfolio: null });
  }
}
