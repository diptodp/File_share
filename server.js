const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File storage configuration
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const FILE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Ensure upload directory exists
fs.ensureDirSync(UPLOAD_DIR);

// In-memory storage for file metadata
const fileStore = new Map();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    cb(null, `${uniqueId}_${file.originalname}`);
  }
});

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
      // Delete file from disk
      fs.remove(fileData.filePath).catch(err => {
        console.error(`Error deleting file ${fileData.filePath}:`, err);
      });
      
      // Remove from memory store
      fileStore.delete(code);
      console.log(`Cleaned up expired file with code: ${code}`);
    }
  }
}

// Run cleanup every 30 seconds
setInterval(cleanupExpiredFiles, 30000);

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
      filename: req.file.filename,
      filePath: req.file.path,
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
  const code = req.params.code;
  const fileData = fileStore.get(code);

  if (!fileData) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  const now = Date.now();
  if (now > fileData.expiresAt) {
    // File expired, clean it up
    fs.remove(fileData.filePath).catch(err => {
      console.error(`Error deleting expired file ${fileData.filePath}:`, err);
    });
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
  const code = req.params.code;
  const fileData = fileStore.get(code);

  if (!fileData) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  const now = Date.now();
  if (now > fileData.expiresAt) {
    // File expired, clean it up
    fs.remove(fileData.filePath).catch(err => {
      console.error(`Error deleting expired file ${fileData.filePath}:`, err);
    });
    fileStore.delete(code);
    return res.status(404).json({ error: 'File expired' });
  }

  // Check if file exists on disk
  if (!fs.existsSync(fileData.filePath)) {
    fileStore.delete(code);
    return res.status(404).json({ error: 'File not found on disk' });
  }

  // Set headers for file download
  res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
  res.setHeader('Content-Type', fileData.mimetype);
  res.setHeader('Content-Length', fileData.size);

  // Stream the file
  const fileStream = fs.createReadStream(fileData.filePath);
  fileStream.pipe(res);

  fileStream.on('error', (err) => {
    console.error('File stream error:', err);
    res.status(500).json({ error: 'Error downloading file' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeFiles: fileStore.size,
    message: '☕ Server is brewing and ready to serve!'
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`File sharing server running on http://localhost:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  // Clean up all files on shutdown
  for (const [code, fileData] of fileStore.entries()) {
    fs.remove(fileData.filePath).catch(err => {
      console.error(`Error deleting file ${fileData.filePath}:`, err);
    });
  }
  process.exit(0);
});
