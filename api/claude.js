export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, user } = req.body;
  if (!system || !user) {
    return res.status(400).json({ error: 'system と user は必須です' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'サーバーの設定が不完全です' });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status}`;
    if (response.status === 429) return res.status(429).json({ error: '利用制限に達しました。しばらく待ってから再試行してください。' });
    return res.status(response.status).json({ error: msg });
  }

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  return res.json({ text });
}
