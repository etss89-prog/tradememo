export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ✅ 관리자 PIN만 허용
  const { pin, livePrices, priceUpdatedAt } = req.body || {};
  const ADMIN_PIN = process.env.ADMIN_PIN || "4254";
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: "Unauthorized" });

  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(500).json({ error: 'DB not configured' });

    await fetch(`${url}/set/tradememo_prices`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ livePrices, priceUpdatedAt }),
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
