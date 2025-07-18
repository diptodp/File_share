// Debug endpoint to check storage state
const { getStats } = require('./storage');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = await getStats();

    res.json({
      status: 'debug',
      timestamp: new Date().toISOString(),
      stats: stats,
      storageType: 'Redis',
      message: '☕ Debug info for Redis-powered storage!'
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      status: 'debug-error',
      message: 'Debug failed',
      error: error.message
    });
  }
}
