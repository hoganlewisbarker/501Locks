// pages/api/analyze.js
// This runs on the SERVER - your API key is never exposed to the browser

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic rate limiting via a simple in-memory store
  // For production, swap this for Redis or Upstash
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  if (!global._rateLimitStore) global._rateLimitStore = {};
  const store = global._rateLimitStore;

  // Clean up entries older than 1 hour
  for (const key of Object.keys(store)) {
    if (store[key].resetAt < now) delete store[key];
  }

  if (!store[ip]) {
    store[ip] = { count: 0, resetAt: now + 60 * 60 * 1000 };
  }

  store[ip].count++;

  // 200 analyses per IP per hour
  if (store[ip].count > 200) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in an hour.' });
  }

  const { messages, model, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1000,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic API error:', err);
      return res.status(response.status).json({ error: 'AI service error', detail: err });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
