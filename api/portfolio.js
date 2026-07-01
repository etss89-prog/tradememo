export const config = { api: { bodySizeLimit: '15mb' } };

// tickerCode 자동 조회 함수 제거
// 국내주식 코드는 TICKER_MAP(수동 검증)만 사용
// 해외주식 코드는 이미지에서 AI가 직접 읽은 영문 티커만 사용

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
- 손익률 = return rate % (e.g. "18.91 %" or "-36.53 %")
- currentPrice 계산: avgBuyPrice × (1 + 손익률/100) 으로 역산

## LAYOUT TYPE 3: PENSION/DC FORMAT (e.g. 삼성증권 퇴직연금DC, 연금 계좌)
Table with columns: 상품명 | 매입원금/평가금액 | 수익률
- NO quantity or unit price shown
- Use this mapping:
  ticker = 상품명
  quantity = 1
  avgBuyPrice = 매입원금 (상단 숫자, 총 투자금액)
  currentPrice = 평가금액 (하단 숫자, 현재 총 가치)
  returnRate = 수익률 (빨간색=양수, 파란색=음수)
  currentValue = 평가금액
- "현금성자산", "예수금" 등은 포함하지 말 것
- "approximateData": true 필드 추가

## LAYOUT TYPE 4: OVERSEAS STOCK FORMAT (e.g. 삼성증권 해외주식)
Table with TWO rows per stock:
  Row 1: [한글 종목명]  [보유수량]  [매수단가 in USD]
  Row 2: [영문 티커]    [평가금액 in KRW]  [현재가 in USD]

For OVERSEAS FORMAT:
- ticker = 한글 종목명 (e.g. "글로벌파운드리", "알파벳 Class A")
- tickerCode = 영문 티커 (e.g. "GFS", "GOOGL", "MRVL") ← CRITICAL: extract from Row 2
- quantity = 보유수량 (integer from Row 1)
- avgBuyPrice = 매수단가 (USD, decimal number from Row 1)
- currentPrice = 현재가 (USD, decimal number from Row 2)
- currentValue = 평가금액 (KRW, from Row 2) ← use this directly, already in KRW
- isOverseas = true ← MUST set this flag
- approximateData = false

Example: "글로벌파운드리 / GFS / 76주 / 매수단가 40.1551 / 평가금액 9,543,650 / 현재가 81.3200"
→ { ticker: "글로벌파운드리", tickerCode: "GFS", quantity: 76, avgBuyPrice: 40.1551, currentPrice: 81.3200, currentValue: 9543650, isOverseas: true }

## CRITICAL RULES:
- Extract EVERY stock/ETF visible in the image (현금성자산 제외)
- Stock names: read EVERY character carefully
  ETF names like "TIGER", "KODEX", "HANARO", "RISE", "ACE", "SOL", "PLUS", "1Q" must be exact
- For overseas stocks: tickerCode is the English ticker (GOOGL, MRVL, GFS etc.) shown below Korean name
- All numbers must be pure numbers without commas
- If 수익률 is negative (파란색/blue): negative e.g. -12.27
- If 수익률 is positive (빨간색/red): positive e.g. 142.08
- currentValue = currentPrice × quantity (except overseas: use KRW 평가금액 directly)

Return ONLY valid JSON:
{
  "stocks": [
    {
      "ticker": "종목명",
      "quantity": 보유수량숫자,
      "avgBuyPrice": 매수단가숫자,
      "currentPrice": 현재가숫자,
      "currentValue": 현재가X수량숫자,
      "returnRate": 수익률숫자,
      "approximateData": false
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

    // 종목별 처리 (tickerCode 자동 조회 없음)
    const stocksWithCodes = (parsed.stocks || []).map(s => {
      if (s.approximateData) {
        // DC/연금 금액기준 종목
        return { ...s, currentValue: s.currentPrice };
      }
      if (s.isOverseas) {
        // 해외주식: tickerCode는 AI가 이미지에서 직접 읽은 영문 티커
        return { ...s };
      }
      // 국내 주식/ETF: tickerCode 자동 조회 안 함
      // 종목코드는 TICKER_MAP(수동 검증) 또는 수기입력에서만 설정
      return {
        ...s,
        currentValue: s.currentPrice * s.quantity,
      };
    });

    parsed.stocks = stocksWithCodes;
    parsed.totalValue = stocksWithCodes.reduce((sum, s) => sum + (s.currentValue || 0), 0);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
