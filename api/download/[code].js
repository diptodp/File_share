// Download file by code
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

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
    res.setHeader('Content-Type', fileData.mimetype);
    res.setHeader('Content-Length', fileData.size);

    // Send the file buffer
    res.send(fileData.buffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
