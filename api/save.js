export const config = { api: { bodySizeLimit: '10mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { records, portfolios } = req.body;
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(500).json({ error: 'DB not configured' });

    await Promise.all([
      // 새 구조 저장
      fetch(`${url}/set/tradememo_records`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(records || []),
      }),
      fetch(`${url}/set/tradememo_portfolios`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolios || {}),
      }),
      // 구버전 키 삭제 (마이그레이션)
      fetch(`${url}/del/tradememo_portfolio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
