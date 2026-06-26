export const config = { api: { bodySizeLimit: '5mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { records } = req.body;
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) return res.status(500).json({ error: 'DB not configured' });

    // Upstash REST API: SET key value
    const r = await fetch(`${url}/set/tradememo_records`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(records),
    });

    const result = await r.json();
    return res.status(200).json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
