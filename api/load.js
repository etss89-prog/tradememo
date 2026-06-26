export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(200).json({ records: [] });
    }

    const r = await fetch(`${KV_URL}/get/tradememo_records`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const data = await r.json();
    const records = data.result ? JSON.parse(data.result) : [];
    return res.status(200).json({ records });
  } catch (error) {
    return res.status(200).json({ records: [] });
  }
}
