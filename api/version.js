export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 캐시 완전 비활성화 - 항상 최신값 반환
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.status(200).json({ version: process.env.VERCEL_GIT_COMMIT_SHA || 'dev' });
}
