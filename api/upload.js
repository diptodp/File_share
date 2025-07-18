const multer = require('multer');
const crypto = require('crypto');

// File storage configuration
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const FILE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-memory storage for file metadata
// Note: This will reset on each serverless function call
// For production, consider using Redis or a database
let fileStore = global.fileStore || new Map();
global.fileStore = fileStore;

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

// Generate unique 6-digit code
function generateUniqueCode() {
  let code;
  let attempts = 0;
  const maxAttempts = 1000;
  
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique code');
    }
  } while (fileStore.has(code));
  
  return code;
}

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clean up expired files before processing
  cleanupExpiredFiles();

  // Use multer middleware
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'File upload failed' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const code = generateUniqueCode();
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

      fileStore.set(code, fileData);

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
