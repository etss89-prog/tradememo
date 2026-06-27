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

    const SYSTEM = `You are a Korean stock trading record analyzer. Extract ALL trading records from the image.

CRITICAL RULE - DATE EXTRACTION:
- The image shows a trading history table with dates in the FIRST column (매매일/대출일)
- Dates appear in format like "2026-06-22", "2026-06-23", "2026-06-24" etc.
- You MUST read the actual date shown in the image for each trade row
- NEVER use a placeholder date like "2024-01-01" - always use the real date from the image
- If a row shows "-" in the date column, use the date from the row above it (same trade group)
- The current year is 2026, so dates should be around 2026

TRADING TABLE STRUCTURE:
- Each trade occupies 2 rows in the table:
  Row 1: [매매일 date] | [종목명 stock name] | [체결수량 quantity]
  Row 2: [-] | [주문구분 order type: KOSDAQ매수/KOSDAQ매도/현금매수/현금매도/신주인수권증서매도] | [체결단가 price]
- 매수 (buy) keywords: KOSDAQ매수, 현금매수
- 매도 (sell) keywords: KOSDAQ매도, 현금매도, 신주인수권증서매도

Return ONLY valid JSON, no other text:
{
  "summary": "거래 요약",
  "stocks": [
    {
      "ticker": "종목명 exactly as shown",
      "trades": [
        { "date": "YYYY-MM-DD", "type": "매수", "price": 12345, "quantity": 10, "total": 123450 }
      ],
      "avgBuyPrice": 12345,
      "currentHolding": 10,
      "totalInvested": 123450,
      "totalSold": 0,
      "realizedPnL": 0,
      "insight": "인사이트"
    }
  ],
  "totalStats": {
    "totalInvested": 123450,
    "totalRealized": 0,
    "tradeCount": 1,
    "stockCount": 1
  }
}

Rules:
- type must be exactly "매수" or "매도"
- all number fields must be numbers not strings
- total = price × quantity
- do not include any text before or after the JSON
- extract EVERY trade row visible in the image`;

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
            { type: 'text', text: 'Extract ALL trading records from this Korean stock app screenshot. Read the actual dates from the 매매일 column carefully. Return only valid JSON.' }
          ]
        }]
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content?.map(b => b.text || '').join('') || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON found in response', raw: text.substring(0, 200) });

    let jsonStr = jsonMatch[0]
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    const parsed = JSON.parse(jsonStr);
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
