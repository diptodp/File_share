// Debug endpoint to check storage state
const { getStats } = require('./storage');

export default function handler(req, res) {
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

  const stats = getStats();
  
  // Get all global keys for debugging
  const globalKeys = Object.keys(global).filter(key => 
    key.includes('COFFEE') || key.includes('fileStore') || key.includes('storage')
  );
  
  res.json({ 
    status: 'debug',
    timestamp: new Date().toISOString(),
    stats: stats,
    globalKeys: globalKeys,
    globalStorageExists: !!global.COFFEE_FILE_SHARE_STORAGE,
    message: '☕ Debug info for coffee-powered storage!'
  });
}
