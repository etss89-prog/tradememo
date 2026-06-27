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

COLUMN IDENTIFICATION - Read the header row first:
The image has these columns (may appear in any order):
- 종목명: Stock name
- 보유수량 or 매도가능수량: Number of shares held
- 현재가: Current market price per share (THIS IS THE CURRENT PRICE - usually the LARGER number shown in blue or red)
- 매수단가 or 평균단가: Average purchase price per share (usually the smaller number below current price)
- 매수금액: Total purchase amount = avgBuyPrice × quantity (DO NOT use as price)

CRITICAL - Reading the values correctly:
In many Korean brokerage apps, each row shows TWO numbers per cell:
- Top number = 보유수량 (quantity)  
- Bottom number = 매도가능수량 (also quantity, usually same)

For price column showing TWO numbers:
- Top number = 현재가 (current price) ← USE THIS
- Bottom number = 매수단가 (average buy price) ← USE THIS

Example: if you see "2,700,000 / 95,401" then currentPrice=2700000, avgBuyPrice=95401

Stock name rules:
- Read EVERY character extremely carefully
- "기가비스" NOT "가가비스"
- "원익QnC" NOT "일익QnC"
- ETF names like "TIGER", "KODEX" must be exact

Calculate:
- currentValue = currentPrice × quantity (always recalculate)
- returnRate = (currentPrice - avgBuyPrice) / avgBuyPrice × 100

Return ONLY valid JSON:
{
  "stocks": [
    {
      "ticker": "종목명",
      "quantity": 보유수량숫자,
      "avgBuyPrice": 매수단가숫자,
      "currentPrice": 현재가숫자,
      "currentValue": 현재가X수량숫자,
      "returnRate": 수익률숫자
    }
  ],
  "totalValue": 모든currentValue합계
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
        max_tokens: 8192,
        system: SYSTEM,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: '이 증권앱 보유종목 화면에서 모든 종목을 추출해줘. 헤더를 먼저 읽고 현재가와 매수단가를 정확히 구분해줘. currentValue는 반드시 currentPrice × quantity로 계산해줘.' }
        ]}]
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.content?.map(b => b.text || '').join('') || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON found' });
    let parsed = JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
    
    // 서버에서도 currentValue 재계산 (AI 오류 방지)
    parsed.stocks = parsed.stocks.map(s => ({
      ...s,
      currentValue: s.currentPrice * s.quantity,
    }));
    parsed.totalValue = parsed.stocks.reduce((sum, s) => sum + s.currentValue, 0);
    
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
