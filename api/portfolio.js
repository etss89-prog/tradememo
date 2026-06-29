export const config = { api: { bodySizeLimit: '15mb' } };

// 종목명으로 한국거래소 KIND API에서 종목코드 조회
async function fetchTickerCode(tickerName) {
  try {
    // KIND API - 종목명 검색 (무료, 인증 불필요)
    const res = await fetch(
      `https://kind.krx.co.kr/common/searchCmpltList.do?method=searchCmpltList&searchText=${encodeURIComponent(tickerName)}&marketType=ALL`,
      { headers: { 'Accept': 'application/json, text/javascript, */*' } }
    );
    const data = await res.json();
    if (data?.result?.length > 0) {
      // 종목명이 정확히 일치하는 것 우선
      const exact = data.result.find(r => r.shrtCd && 
        (r.itemNm === tickerName || r.itemNm?.replace(/\s/g,'') === tickerName.replace(/\s/g,''))
      );
      const match = exact || data.result[0];
      if (match?.shrtCd) return match.shrtCd;
    }
  } catch {}

  // KIND API 실패 시 Claude AI로 폴백
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 100,
        messages: [{ role: 'user', content: 
          `한국 주식/ETF 종목명 "${tickerName}"의 종목코드를 알려줘. 숫자 6자리 또는 영숫자 혼합 7자리(예: 0117V0)만 답해. 모르면 "모름"만 답해.`
        }]
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() || '';
    const match = text.match(/[A-Z0-9]{6,7}/i);
    if (match && match[0] !== '모름') return match[0];
  } catch {}

  return null;
}

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

## CRITICAL RULES:
- Extract EVERY stock/ETF visible in the image (현금성자산 제외)
- Stock names: read EVERY character carefully
  ETF names like "TIGER", "KODEX", "HANARO", "RISE", "ACE", "SOL", "PLUS", "1Q" must be exact
- All numbers must be pure numbers without commas
- If 수익률 is negative (파란색/blue): negative e.g. -12.27
- If 수익률 is positive (빨간색/red): positive e.g. 142.08
- currentValue = currentPrice × quantity

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

    // ✅ 종목코드 자동 조회 - 각 종목에 대해 KIND API로 코드 조회
    const stocksWithCodes = await Promise.all(
      (parsed.stocks || []).map(async (s) => {
        if (s.approximateData) {
          // DC/연금 금액기준 종목은 코드 조회 불필요
          return { ...s, currentValue: s.currentPrice };
        }
        // 종목코드 조회
        const code = await fetchTickerCode(s.ticker);
        return {
          ...s,
          currentValue: s.currentPrice * s.quantity,
          tickerCode: code || null, // 코드 저장
        };
      })
    );

    parsed.stocks = stocksWithCodes;
    parsed.totalValue = stocksWithCodes.reduce((sum, s) => sum + (s.currentValue || 0), 0);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
