export const config = { api: { bodySizeLimit: '15mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image' });

    const SYSTEM = `You are a Korean stock portfolio analyzer. Extract holdings from brokerage app screenshots.

The image may have different column layouts. Identify each column by its HEADER NAME:
- 종목명: Stock name
- 보유수량 or 매도가능수량: Quantity held (number of shares)
- 현재가: Current market price per share
- 매수단가 or 평균단가: Average purchase price per share
- 매수금액 or 평가금액: Total amount (DO NOT use as per-share price)

CRITICAL: Read stock names very carefully character by character:
- "기가비스" not "가가비스"
- "원익QnC" not "일익QnC"
- "SK하이닉스" not "SX하이닉스"
- ETF names like "TIGER", "KODEX" must be exact
- Double-check FIRST character of every name

Calculate:
- currentValue = currentPrice × quantity
- returnRate = (currentPrice - avgBuyPrice) / avgBuyPrice × 100

Return ONLY valid JSON:
{
  "stocks": [
    {
      "ticker": "정확한종목명",
      "quantity": 보유수량숫자,
      "avgBuyPrice": 매수단가숫자,
      "currentPrice": 현재가숫자,
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
          { type: 'text', text: '이 증권앱 보유종목 화면에서 모든 종목을 추출해줘. 컬럼 헤더를 먼저 확인하고 각 값을 정확히 매핑해줘. 종목명 첫 글자를 특히 주의해서 읽어줘.' }
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
