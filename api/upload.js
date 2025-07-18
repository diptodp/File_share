const multer = require('multer');
const { storeFile, generateUniqueCode, FILE_EXPIRY_TIME } = require('./storage');

// File storage configuration
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

// Configure multer for in-memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use multer middleware
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'File upload failed' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const code = await generateUniqueCode();
      const now = Date.now();
      const expiresAt = now + FILE_EXPIRY_TIME;

      const fileData = {
        code: code,
        originalName: req.file.originalname,
        buffer: req.file.buffer,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: now,
        expiresAt: expiresAt
      };

      // Store using Redis storage
      const stored = await storeFile(code, fileData);

      if (!stored) {
        return res.status(500).json({ error: 'Failed to store file' });
      }

      res.json({
        success: true,
        code: code,
        filename: req.file.originalname,
        size: req.file.size,
        expiresAt: expiresAt
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
}
