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
    if (data.result !== null && data.result !== undefined) {
      if (Array.isArray(data.result)) {
        records = data.result;
      } else if (typeof data.result === 'string') {
        try { records = JSON.parse(data.result); } catch { records = []; }
      } else if (typeof data.result === 'object') {
        records = Array.isArray(data.result) ? data.result : [];
      }
    }

    return res.status(200).json({ records: Array.isArray(records) ? records : [] });
  } catch (error) {
    return res.status(200).json({ records: [] });
  }
}
