export const config = { api: { bodySizeLimit: '10mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { records, portfolios, accounts, mainText } = req.body;
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(500).json({ error: 'DB not configured' });

    const saves = [
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
      // 구버전 키 삭제
      fetch(`${url}/del/tradememo_portfolio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }),
    ];

    // accounts가 있을 때만 저장
    if (accounts !== undefined) {
      saves.push(fetch(`${url}/set/tradememo_accounts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(accounts || []),
      }));
    }

    // mainText가 있을 때만 저장
    if (mainText !== undefined) {
      saves.push(fetch(`${url}/set/tradememo_maintext`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(mainText),
      }));
    }

    await Promise.all(saves);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
