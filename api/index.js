const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File storage configuration
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const FILE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-memory storage for file metadata (Note: This will reset on each serverless function call)
// For production, you'd want to use a database like Redis or MongoDB
const fileStore = new Map();

// Configure multer for in-memory storage (Vercel doesn't support persistent file storage)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types
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

// Routes

// Upload file endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
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
      buffer: req.file.buffer, // Store file in memory
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

// Get file info by code
app.get('/api/file/:code', (req, res) => {
  cleanupExpiredFiles(); // Clean up before checking
  
  const code = req.params.code;
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
});

// Download file by code
app.get('/api/download/:code', (req, res) => {
  cleanupExpiredFiles(); // Clean up before checking
  
  const code = req.params.code;
  const fileData = fileStore.get(code);

  if (!fileData) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  const now = Date.now();
  if (now > fileData.expiresAt) {
    fileStore.delete(code);
    return res.status(404).json({ error: 'File expired' });
  }

  // Set headers for file download
  res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
  res.setHeader('Content-Type', fileData.mimetype);
  res.setHeader('Content-Length', fileData.size);

  // Send the file buffer
  res.send(fileData.buffer);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeFiles: fileStore.size 
  });
});

// Export the Express app for Vercel
module.exports = app;
