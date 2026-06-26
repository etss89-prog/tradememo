export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) return res.status(200).json({ records: [] });

    const r = await fetch(`${url}/get/tradememo_records`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json();
    
    let records = [];
    if (data.result) {
      try {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        records = Array.isArray(parsed) ? parsed : [];
      } catch { records = []; }
    }
    return res.status(200).json({ records });
  } catch (error) {
    return res.status(200).json({ records: [] });
  }
}
