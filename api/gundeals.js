export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://www.reddit.com/r/gundeals/new.json?limit=20&raw_json=1',
      {
        headers: {
          'User-Agent': 'EasySafe/1.0 (gun safe inventory app)',
          'Accept': 'application/json',
        },
      },
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: `Reddit returned ${response.status}` });
    }

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from Reddit' });
  }
}
