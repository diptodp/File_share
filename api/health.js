// Health check endpoint
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
      status: 'ok',
      timestamp: new Date().toISOString(),
      activeFiles: stats.totalFiles,
      storageType: stats.storageType,
      redisConnected: stats.redisConnected,
      instanceId: stats.instanceId,
      message: '☕ Server is brewing and ready to serve!'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
}
