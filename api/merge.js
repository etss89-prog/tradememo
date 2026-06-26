export const config = {
  api: { bodySizeLimit: '5mb' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { results } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: '다음 여러 거래 데이터를 하나로 통합하세요. 중복 제거, 같은 종목 합산, 가중평균 단가 계산. 순수 JSON만 반환:\n' + JSON.stringify(results)
        }]
      }),
    });
    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';
    return res.status(200).json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
