export const config = { api: { bodySizeLimit: '15mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image' });

    const SYSTEM = `You are a Korean stock portfolio analyzer. Extract holdings from ANY Korean brokerage app screenshot.

## LAYOUT TYPE 1: TABLE FORMAT (e.g. 삼성증권)
Columns in a table: 종목명 | 보유수량 | 현재가 | 매수단가 | 매수금액 etc.
- Read header row first to identify column order
- currentPrice = 현재가 column value
- avgBuyPrice = 매수단가 or 매수평균단가 column value
- quantity = 보유수량 or 매도가능수량 column value

## LAYOUT TYPE 2: CARD FORMAT (e.g. KB증권, 카카오페이증권)
Each stock appears as a card with:
  [종목명]                     현금
  ·평가손익    [손익금액]   ·매도가능   [수량]
  ·손익률      [수익률%]    ·평균단가   [단가]
  [자동주문]  [매수]  [매도]

For CARD FORMAT:
- ticker = 종목명 (top left of card, bold text)
- quantity = 매도가능 value (number on the right)
- avgBuyPrice = 평균단가 value (number on the right)
- 평가손익 = unrealized P&L amount
- 손익률 = return rate % (e.g. "18.91 %" or "-36.53 %")
- currentPrice 계산: avgBuyPrice × (1 + 손익률/100) 으로 역산
  예: 평균단가 9,660원, 손익률 18.91% → currentPrice = round(9660 × 1.1891) = 11,487원
  예: 평균단가 16,571원, 손익률 -17.00% → currentPrice = round(16571 × 0.83) = 13,754원

## CRITICAL RULES:
- Extract EVERY stock card/row visible in the image
- Stock names: read EVERY character carefully
  "기가비스" NOT "가가비스", "원익QnC" NOT "일익QnC"
  ETF names like "TIGER", "KODEX", "HANARO", "RISE", "ACE" must be exact
- quantity must be a NUMBER (integer), NOT a string
- avgBuyPrice must be a NUMBER, NOT a string  
- Remove all commas from numbers: "16,571" → 16571
- If 손익률 is negative (파란색/blue), the number is negative: "-36.53%" → -36.53
- If 손익률 is positive (빨간색/red), the number is positive: "18.91%" → 18.91
- currentValue = currentPrice × quantity (always recalculate)

Return ONLY valid JSON, no other text:
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
          { type: 'text', text: '이 증권앱 보유종목 화면에서 모든 종목을 추출해줘. 카드형 레이아웃이면 평균단가와 손익률로 현재가를 역산해줘. 모든 숫자는 쉼표 없는 순수 숫자로 반환해줘.' }
        ]}]
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content?.map(b => b.text || '').join('') || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON found' });

    let parsed = JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));

    // 서버에서 currentValue 재계산 + 숫자 타입 보정
    parsed.stocks = parsed.stocks.map(s => ({
      ...s,
      quantity: Number(s.quantity),
      avgBuyPrice: Number(s.avgBuyPrice),
      currentPrice: Number(s.currentPrice),
      currentValue: Number(s.currentPrice) * Number(s.quantity),
      returnRate: Number(s.returnRate),
    }));
    parsed.totalValue = parsed.stocks.reduce((sum, s) => sum + s.currentValue, 0);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
