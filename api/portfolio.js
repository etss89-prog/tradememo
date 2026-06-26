export const config = { api: { bodySizeLimit: '10mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image' });

    const SYSTEM = `You are a Korean stock portfolio analyzer. The image shows a brokerage app's holdings screen.

The table columns are typically:
- 종목명 (Stock name)
- 매도가능수량 or 보유수량 (Quantity held)
- 매수단가 (Average purchase price per share) ← THIS is the avgBuyPrice
- 매수금액 (Total purchase amount = avgBuyPrice × quantity) ← NOT the avgBuyPrice
- 현재가 (Current price per share) ← THIS is the currentPrice
- 현재가 shown in blue/red is the current market price per share

IMPORTANT:
- avgBuyPrice = 매수단가 (price per share, smaller number like 95,401)
- currentPrice = 현재가 (current market price per share)
- currentValue = currentPrice × quantity
- returnRate = (currentPrice - avgBuyPrice) / avgBuyPrice * 100
- Do NOT confuse 매수금액 (total amount) with 매수단가 (price per share)

Return ONLY valid JSON, no other text:
{
  "stocks": [
    {
      "ticker": "종목명",
      "quantity": 보유수량숫자,
      "avgBuyPrice": 매수단가숫자(주당가격),
      "currentPrice": 현재가숫자(주당가격),
      "currentValue": 현재가X수량숫자,
      "returnRate": 수익률숫자
    }
  ],
  "totalValue": 총평가금액숫자
}`;

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
          { type: 'text', text: 'Extract all stock holdings. Remember: avgBuyPrice is 매수단가(per share price), NOT 매수금액(total amount). currentPrice is 현재가(per share).' }
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
