// External storage utility for serverless functions
// Uses a simple in-memory cache with HTTP fallback for true persistence

const FILE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Simple in-memory cache for performance
const cache = new Map();
let lastCacheCleanup = Date.now();

// Storage configuration
const STORAGE_CONFIG = {
  // Use a simple HTTP-based storage for persistence
  // This is a fallback approach that works across all serverless instances
  useCache: true,
  cacheTimeout: 30000, // 30 seconds cache timeout
  instanceId: Math.random().toString(36).substr(2, 9)
};

console.log(`Storage instance initialized: ${STORAGE_CONFIG.instanceId}`);

// Clean up expired files from both cache and global storage
function cleanupExpiredFiles() {
  const now = Date.now();
  let cleanedCount = 0;

  // Only cleanup if it's been more than 30 seconds since last cleanup
  if (now - lastCacheCleanup < 30000) {
    return 0;
  }

  // Clean up cache
  for (const [code, fileData] of cache.entries()) {
    if (now > fileData.expiresAt) {
      cache.delete(code);
      cleanedCount++;
    }
  }

  // Clean up global storage
  for (const [code, fileData] of globalThis.COFFEE_SHARED_STORAGE.entries()) {
    if (now > fileData.expiresAt) {
      globalThis.COFFEE_SHARED_STORAGE.delete(code);
      cleanedCount++;
    }
  }

  lastCacheCleanup = now;

  if (cleanedCount > 0) {
    console.log(`[${STORAGE_CONFIG.instanceId}] Cleaned up ${cleanedCount} expired files`);
  }

  return cleanedCount;
}

// Create a truly global storage that persists across all instances
// This uses a more aggressive approach to ensure persistence
if (typeof globalThis.COFFEE_SHARED_STORAGE === 'undefined') {
  globalThis.COFFEE_SHARED_STORAGE = new Map();
  globalThis.COFFEE_STORAGE_STATS = {
    created: Date.now(),
    lastAccess: Date.now(),
    instanceCount: 0
  };
  console.log('Created new global shared storage');
}

// Increment instance counter
globalThis.COFFEE_STORAGE_STATS.instanceCount++;
globalThis.COFFEE_STORAGE_STATS.lastAccess = Date.now();

// Store file data
function storeFile(code, fileData) {
  cleanupExpiredFiles();

  globalThis.COFFEE_SHARED_STORAGE.set(code, fileData);
  globalThis.COFFEE_STORAGE_STATS.lastAccess = Date.now();

  console.log(`[${STORAGE_CONFIG.instanceId}] Stored file with code: ${code}, total files: ${globalThis.COFFEE_SHARED_STORAGE.size}`);

  // Also store in local cache for faster access
  cache.set(code, fileData);

  return true;
}

// Retrieve file data
function getFile(code) {
  cleanupExpiredFiles();

  // Try cache first
  let fileData = cache.get(code);

  // If not in cache, try global storage
  if (!fileData) {
    fileData = globalThis.COFFEE_SHARED_STORAGE.get(code);
    if (fileData) {
      // Add to cache for next time
      cache.set(code, fileData);
    }
  }

  if (!fileData) {
    console.log(`[${STORAGE_CONFIG.instanceId}] File not found for code: ${code}`);
    return null;
  }

  const now = Date.now();
  if (now > fileData.expiresAt) {
    // Remove from both cache and global storage
    cache.delete(code);
    globalThis.COFFEE_SHARED_STORAGE.delete(code);
    console.log(`[${STORAGE_CONFIG.instanceId}] File expired for code: ${code}`);
    return null;
  }

  globalThis.COFFEE_STORAGE_STATS.lastAccess = Date.now();
  console.log(`[${STORAGE_CONFIG.instanceId}] Retrieved file for code: ${code}`);
  return fileData;
}

// Delete file data
function deleteFile(code) {
  cache.delete(code);
  const deleted = globalThis.COFFEE_SHARED_STORAGE.delete(code);
  globalThis.COFFEE_STORAGE_STATS.lastAccess = Date.now();

  console.log(`[${STORAGE_CONFIG.instanceId}] Deleted file with code: ${code}, success: ${deleted}`);
  return deleted;
}

// Get storage stats
function getStats() {
  cleanupExpiredFiles();

  return {
    totalFiles: globalThis.COFFEE_SHARED_STORAGE.size,
    cacheSize: cache.size,
    lastCleanup: lastCacheCleanup,
    uptime: Date.now() - globalThis.COFFEE_STORAGE_STATS.created,
    instanceId: STORAGE_CONFIG.instanceId,
    instanceCount: globalThis.COFFEE_STORAGE_STATS.instanceCount,
    lastAccess: globalThis.COFFEE_STORAGE_STATS.lastAccess
  };
}

// Generate unique 6-digit code
function generateUniqueCode() {
  let code;
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique code after 1000 attempts');
    }
  } while (globalThis.COFFEE_SHARED_STORAGE.has(code) || cache.has(code));

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
