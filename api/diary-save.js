export const config = { api: { bodySizeLimit: '5mb' } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(500).json({ error: 'DB not configured' });

    const { action, post } = req.body;
    // action: 'add' | 'edit' | 'delete'

    // 기존 글 목록 불러오기
    const r = await fetch(`${url}/get/tradememo_diary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await r.json();
    let posts = [];
    if (d.result) {
      try { posts = typeof d.result === 'object' ? d.result : JSON.parse(d.result); } catch { posts = []; }
    }

    if (action === 'add') {
      const newPost = {
        id: Date.now().toString(),
        text: post.text || '',
        nickname: post.nickname || '익명',
        isAdmin: post.isAdmin || false,
        isSecret: post.isSecret || false,
        password: post.password || null, // 조회자 글 수정/삭제용
        replyTo: post.replyTo || null, // 답글 대상 id
        replyPreview: post.replyPreview || null, // 답글 미리보기 텍스트
        createdAt: new Date().toISOString(),
        editedAt: null,
        imageUrl: post.imageUrl || null,
        linkUrl: post.linkUrl || null,
        linkTitle: post.linkTitle || null,
      };
      posts = [newPost, ...posts]; // 최신순
    } else if (action === 'edit') {
      posts = posts.map(p => p.id === post.id
        ? { ...p, text: post.text, editedAt: new Date().toISOString() }
        : p
      );
    } else if (action === 'delete') {
      posts = posts.filter(p => p.id !== post.id);
    }

    await fetch(`${url}/set/tradememo_diary`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(posts),
    });

    return res.status(200).json({ ok: true, posts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
