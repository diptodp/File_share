// Get file info by code

// Access the global file store
let fileStore = global.fileStore || new Map();
global.fileStore = fileStore;

// Clean up expired files
function cleanupExpiredFiles() {
  const now = Date.now();
  
  for (const [code, fileData] of fileStore.entries()) {
    if (now > fileData.expiresAt) {
      fileStore.delete(code);
      console.log(`Cleaned up expired file with code: ${code}`);
    }
  }
}

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

  // Clean up expired files before checking
  cleanupExpiredFiles();
  
  const { code } = req.query;
  const fileData = fileStore.get(code);

  if (!fileData) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  const now = Date.now();
  if (now > fileData.expiresAt) {
    fileStore.delete(code);
    return res.status(404).json({ error: 'File expired' });
  }

  res.json({
    code: fileData.code,
    filename: fileData.originalName,
    size: fileData.size,
    mimetype: fileData.mimetype,
    uploadedAt: fileData.uploadedAt,
    expiresAt: fileData.expiresAt,
    timeRemaining: fileData.expiresAt - now
  });
}
