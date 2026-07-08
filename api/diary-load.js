export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(200).json({ posts: [] });

    const r = await fetch(`${url}/get/tradememo_diary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await r.json();
    let posts = [];
    if (d.result) {
      try { posts = typeof d.result === 'object' ? d.result : JSON.parse(d.result); } catch { posts = []; }
    }
    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(200).json({ posts: [] });
  }
}
