export const config = { api: { bodySizeLimit: '10mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ✅ 저장은 관리자 PIN만 허용
  const { pin, records, portfolios, accounts, mainText } = req.body || {};
  const ADMIN_PIN = process.env.ADMIN_PIN || "4254";

  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Unauthorized - Admin only" });
  }

  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(500).json({ error: 'DB not configured' });

    const saves = [];
    if (records !== undefined) saves.push(fetch(`${url}/set/tradememo_records`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(records) }));
    if (portfolios !== undefined) saves.push(fetch(`${url}/set/tradememo_portfolios`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(portfolios) }));
    if (accounts !== undefined) saves.push(fetch(`${url}/set/tradememo_accounts`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(accounts) }));
    if (mainText !== undefined) saves.push(fetch(`${url}/set/tradememo_main`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(mainText) }));

    await Promise.all(saves);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
