import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AuraChatBot/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    const html = await response.text();

    const getMeta = (name) => {
      const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const preview = {
      title: getMeta('og:title') || (titleMatch ? titleMatch[1].trim() : null),
      description: getMeta('og:description') || getMeta('description'),
      image: getMeta('og:image'),
      url,
      domain: new URL(url).hostname.replace('www.', '')
    };

    res.json(preview);
  } catch (err) {
    res.status(200).json({ error: 'Could not fetch preview', url });
  }
});

export default router;
