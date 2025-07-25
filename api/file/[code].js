// Get file info by code
const { getFile } = require('../storage');

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
    const { code } = req.query;
    const fileData = await getFile(code);

    if (!fileData) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    const now = Date.now();
    res.json({
      code: fileData.code,
      filename: fileData.originalName,
      size: fileData.size,
      mimetype: fileData.mimetype,
      uploadedAt: fileData.uploadedAt,
      expiresAt: fileData.expiresAt,
      timeRemaining: fileData.expiresAt - now
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
