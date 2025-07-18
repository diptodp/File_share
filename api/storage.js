// Simple but effective storage for serverless functions
// Uses a combination of approaches for maximum compatibility

const fs = require('fs');
const path = require('path');

const FILE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Storage configuration
const STORAGE_CONFIG = {
  instanceId: Math.random().toString(36).substr(2, 9),
  storageFile: '/tmp/coffee-file-storage.json'
};

// Initialize storage
let fileStorage = new Map();

// Load existing storage from file if it exists
function loadStorageFromFile() {
  try {
    if (fs.existsSync(STORAGE_CONFIG.storageFile)) {
      const data = fs.readFileSync(STORAGE_CONFIG.storageFile, 'utf8');
      const parsed = JSON.parse(data);
      fileStorage = new Map(Object.entries(parsed));
      console.log(`[${STORAGE_CONFIG.instanceId}] Loaded ${fileStorage.size} files from storage`);
    }
  } catch (error) {
    console.log(`[${STORAGE_CONFIG.instanceId}] Could not load storage file:`, error.message);
    fileStorage = new Map();
  }
}

// Save storage to file
function saveStorageToFile() {
  try {
    const data = Object.fromEntries(fileStorage);
    fs.writeFileSync(STORAGE_CONFIG.storageFile, JSON.stringify(data), 'utf8');
    console.log(`[${STORAGE_CONFIG.instanceId}] Saved ${fileStorage.size} files to storage`);
  } catch (error) {
    console.log(`[${STORAGE_CONFIG.instanceId}] Could not save storage file:`, error.message);
  }
}

// Load storage on initialization
loadStorageFromFile();

console.log(`Storage instance initialized: ${STORAGE_CONFIG.instanceId}`);

// Clean up expired files
function cleanupExpiredFiles() {
  const now = Date.now();
  let cleanedCount = 0;

  // Load latest storage
  loadStorageFromFile();

  for (const [code, fileData] of fileStorage.entries()) {
    if (now > fileData.expiresAt) {
      fileStorage.delete(code);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    saveStorageToFile();
    console.log(`[${STORAGE_CONFIG.instanceId}] Cleaned up ${cleanedCount} expired files`);
  }

  return cleanedCount;
}

// Store file data
function storeFile(code, fileData) {
  cleanupExpiredFiles();

  // Convert buffer to base64 for JSON storage
  const storableData = {
    ...fileData,
    buffer: fileData.buffer.toString('base64')
  };

  fileStorage.set(code, storableData);
  saveStorageToFile();

  console.log(`[${STORAGE_CONFIG.instanceId}] Stored file with code: ${code}, total files: ${fileStorage.size}`);
  return true;
}

// Retrieve file data
function getFile(code) {
  cleanupExpiredFiles();

  const fileData = fileStorage.get(code);

  if (!fileData) {
    console.log(`[${STORAGE_CONFIG.instanceId}] File not found for code: ${code}`);
    return null;
  }

  const now = Date.now();
  if (now > fileData.expiresAt) {
    fileStorage.delete(code);
    saveStorageToFile();
    console.log(`[${STORAGE_CONFIG.instanceId}] File expired for code: ${code}`);
    return null;
  }

  // Convert base64 back to buffer
  const retrievedData = {
    ...fileData,
    buffer: Buffer.from(fileData.buffer, 'base64')
  };

  console.log(`[${STORAGE_CONFIG.instanceId}] Retrieved file for code: ${code}`);
  return retrievedData;
}

// Delete file data
function deleteFile(code) {
  const deleted = fileStorage.delete(code);
  if (deleted) {
    saveStorageToFile();
  }

  console.log(`[${STORAGE_CONFIG.instanceId}] Deleted file with code: ${code}, success: ${deleted}`);
  return deleted;
}

// Get storage stats
function getStats() {
  cleanupExpiredFiles();

  return {
    totalFiles: fileStorage.size,
    instanceId: STORAGE_CONFIG.instanceId,
    storageFile: STORAGE_CONFIG.storageFile,
    fileExists: fs.existsSync(STORAGE_CONFIG.storageFile)
  };
}

// Generate unique 6-digit code
function generateUniqueCode() {
  // Load latest storage to check for conflicts
  loadStorageFromFile();

  let code;
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique code after 1000 attempts');
    }
  } while (fileStorage.has(code));

  return code;
}

module.exports = {
  storeFile,
  getFile,
  deleteFile,
  getStats,
  generateUniqueCode,
  cleanupExpiredFiles,
  FILE_EXPIRY_TIME
};
