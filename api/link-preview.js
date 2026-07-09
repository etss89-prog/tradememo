export const config = { api: { bodySizeLimit: '1mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL 필요' });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(5000),
    });

    const html = await response.text();

    // OG 태그 + 일반 메타태그 파싱
    const getMeta = (property) => {
      const patterns = [
        new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'),
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i'),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
      }
      return null;
    };

    const getTitle = () => {
      const og = getMeta('og:title') || getMeta('twitter:title');
      if (og) return og;
      const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return m?.[1]?.trim() || null;
    };

    const title = getTitle();
    const description = getMeta('og:description') || getMeta('description') || getMeta('twitter:description');
    const image = getMeta('og:image') || getMeta('twitter:image');
    const siteName = getMeta('og:site_name');

    // 도메인 추출
    const domain = new URL(url).hostname.replace('www.', '').replace('m.', '');

    return res.status(200).json({ title, description, image, siteName, domain, url });
  } catch (error) {
    return res.status(200).json({ title: null, description: null, image: null, domain: null, url });
  }
}
