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
Return ONLY valid JSON, no other text. Use this exact format:
{
  "summary": "거래 요약",
  "stocks": [
    {
      "ticker": "종목명",
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
- do not include any text before or after the JSON`;

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
            { type: 'text', text: 'Extract all trading records from this Korean stock app screenshot. Return only valid JSON.' }
          ]
        }]
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content?.map(b => b.text || '').join('') || '';
    
    // Extract JSON more robustly
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON found in response', raw: text.substring(0, 200) });
    
    // Clean common JSON issues
    let jsonStr = jsonMatch[0]
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ') // remove control chars
      .replace(/,\s*}/g, '}')  // trailing commas in objects
      .replace(/,\s*]/g, ']'); // trailing commas in arrays

    const parsed = JSON.parse(jsonStr);
    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
