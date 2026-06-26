export const config = {
  api: { bodySizeLimit: '10mb' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const SYSTEM = `당신은 주식 매매내역 이미지 분석 전문가입니다. 날짜, 종목명, 매수/매도, 체결수량, 체결단가를 추출하세요. 순수 JSON만 반환하세요.
{"summary":"요약","stocks":[{"ticker":"종목명","trades":[{"date":"YYYY-MM-DD","type":"매수또는매도","price":숫자,"quantity":숫자,"total":숫자}],"avgBuyPrice":숫자,"currentHolding":숫자,"totalInvested":숫자,"totalSold":숫자,"realizedPnL":숫자,"insight":"인사이트"}],"totalStats":{"totalInvested":숫자,"totalRealized":숫자,"tradeCount":숫자,"stockCount":숫자}}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: '이 증권 앱 매매내역에서 모든 거래를 추출해주세요.' }
          ]
        }]
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    
   const text = data.content?.map(b => b.text || '').join('') || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/s);
    if (!jsonMatch) return res.status(500).json({ error: 'JSON not found', raw: text });
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.status(200).json(parsed);
    } catch(e) {
      return res.status(500).json({ error: e.message, raw: text.substring(0, 500) });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
