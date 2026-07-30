export const config = {
  api: { bodySizeLimit: '5mb' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { results } = req.body;

    // ⚠️ 예전 방식(AI에게 병합/중복제거/가중평균 계산까지 통째로 맡기는 방식)은
    // max_tokens 제한과 AI의 누락/오류 가능성 때문에 종목이 사라지는 문제가 있었음.
    // → 순수 코드로 "종목 배열 합치기"만 결정적으로 처리. 중복제거·가중평균 등은
    //   어차피 App.jsx 화면단에서 allRecords 전체를 볼 때마다 다시 계산하므로 불필요.
    const byTicker = {};
    for (const r of (Array.isArray(results) ? results : [])) {
      for (const s of (r?.stocks || [])) {
        if (!s || !s.ticker) continue;
        if (!byTicker[s.ticker]) byTicker[s.ticker] = { ...s, trades: [] };
        for (const t of (s.trades || [])) {
          byTicker[s.ticker].trades.push(t);
        }
      }
    }

    // 완전히 동일한 거래(종목+날짜+매매구분+가격+수량)만 중복으로 간주해 제거
    // (같은 이미지를 실수로 두 번 올렸을 때를 대비한 안전장치)
    Object.entries(byTicker).forEach(([ticker, s]) => {
      const seen = new Set();
      s.trades = s.trades.filter(t => {
        const key = [ticker, t.date, t.type, t.price, t.quantity].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    const stocks = Object.values(byTicker);
    return res.status(200).json({ stocks });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
