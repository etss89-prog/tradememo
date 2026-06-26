export const config = { api: { bodySizeLimit: '10mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image' });

    const SYSTEM = `You are a Korean stock portfolio analyzer. Extract holdings from the image.
Return ONLY valid JSON:
{
  "stocks": [
    {
      "ticker": "종목명",
      "quantity": 보유수량숫자,
      "avgBuyPrice": 매수단가숫자,
      "currentPrice": 현재가숫자,
      "currentValue": 현재가X보유수량숫자,
      "returnRate": 수익률숫자(퍼센트)
    }
  ],
  "totalValue": 총평가금액숫자
}
- quantity = 매도가능수량 or 보유수량
- currentValue = currentPrice * quantity
- returnRate = (currentPrice - avgBuyPrice) / avgBuyPrice * 100
- all numbers must be numbers not strings`;

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
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: 'Extract all stock holdings from this Korean brokerage app screenshot.' }
        ]}]
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.content?.map(b => b.text || '').join('') || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON found' });
    const parsed = JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
