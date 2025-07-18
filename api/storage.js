// Shared storage utility for serverless functions
// Uses persistent global variables with better state management

const FILE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Create a more persistent global storage
const STORAGE_KEY = 'COFFEE_FILE_SHARE_STORAGE';

// Initialize global storage with better persistence
function initializeStorage() {
  if (!global[STORAGE_KEY]) {
    global[STORAGE_KEY] = {
      fileStore: new Map(),
      lastCleanup: Date.now(),
      startTime: Date.now(),
      instanceId: Math.random().toString(36).substr(2, 9)
    };
    console.log(`Initialized new storage instance: ${global[STORAGE_KEY].instanceId}`);
  }
  return global[STORAGE_KEY];
}

// Get storage instance
function getStorage() {
  return global[STORAGE_KEY] || initializeStorage();
}

// Clean up expired files
function cleanupExpiredFiles() {
  const storage = getStorage();
  const now = Date.now();
  let cleanedCount = 0;

  for (const [code, fileData] of storage.fileStore.entries()) {
    if (now > fileData.expiresAt) {
      storage.fileStore.delete(code);
      cleanedCount++;
    }
  }

  storage.lastCleanup = now;

  if (cleanedCount > 0) {
    console.log(`[${storage.instanceId}] Cleaned up ${cleanedCount} expired files`);
  }

  return cleanedCount;
}

// Store file data
function storeFile(code, fileData) {
  const storage = getStorage();

  // Clean up before storing
  cleanupExpiredFiles();

  storage.fileStore.set(code, fileData);

  console.log(`[${storage.instanceId}] Stored file with code: ${code}, total files: ${storage.fileStore.size}`);
  return true;
}

// Retrieve file data
function getFile(code) {
  const storage = getStorage();

  // Clean up before retrieving
  cleanupExpiredFiles();

  const fileData = storage.fileStore.get(code);

  if (!fileData) {
    console.log(`[${storage.instanceId}] File not found for code: ${code}`);
    return null;
  }

  const now = Date.now();
  if (now > fileData.expiresAt) {
    storage.fileStore.delete(code);
    console.log(`[${storage.instanceId}] File expired for code: ${code}`);
    return null;
  }

  console.log(`[${storage.instanceId}] Retrieved file for code: ${code}`);
  return fileData;
}

// Delete file data
function deleteFile(code) {
  const storage = getStorage();
  const deleted = storage.fileStore.delete(code);
  console.log(`[${storage.instanceId}] Deleted file with code: ${code}, success: ${deleted}`);
  return deleted;
}

// Get storage stats
function getStats() {
  const storage = getStorage();
  cleanupExpiredFiles();

  return {
    totalFiles: storage.fileStore.size,
    lastCleanup: storage.lastCleanup,
    uptime: Date.now() - storage.startTime,
    instanceId: storage.instanceId
  };
}

// Generate unique 6-digit code
function generateUniqueCode() {
  const storage = getStorage();
  let code;
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique code after 1000 attempts');
    }
  } while (storage.fileStore.has(code));

  return code;
}

// Initialize storage on module load
initializeStorage();

module.exports = {
  storeFile,
  getFile,
  deleteFile,
  getStats,
  generateUniqueCode,
  cleanupExpiredFiles,
  FILE_EXPIRY_TIME
};
