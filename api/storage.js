// Redis-based storage for true serverless persistence
// Uses Upstash Redis for cross-instance data sharing

const { Redis } = require('@upstash/redis');

const FILE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Storage configuration
const STORAGE_CONFIG = {
  instanceId: Math.random().toString(36).substr(2, 9)
};

// Initialize Redis client with your Upstash credentials
const redis = new Redis({
  url: 'https://brief-treefrog-47222.upstash.io',
  token: 'Abh2AAIjcDEzZjlkMTdlYzlkODE0MTlhODdmMTFhNmJiOWQ5OWJiNXAxMA'
});

console.log(`Redis storage instance initialized: ${STORAGE_CONFIG.instanceId}`);

// Clean up expired files from Redis
async function cleanupExpiredFiles() {
  try {
    const now = Date.now();
    let cleanedCount = 0;

    // Get all keys with our prefix
    const keys = await redis.keys('coffee:file:*');

    for (const key of keys) {
      const fileData = await redis.get(key);
      if (fileData && now > fileData.expiresAt) {
        await redis.del(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[${STORAGE_CONFIG.instanceId}] Cleaned up ${cleanedCount} expired files from Redis`);
    }

    return cleanedCount;
  } catch (error) {
    console.error(`[${STORAGE_CONFIG.instanceId}] Cleanup error:`, error.message);
    return 0;
  }
}

// Store file data in Redis
async function storeFile(code, fileData) {
  try {
    // Clean up expired files first
    await cleanupExpiredFiles();

    // Convert buffer to base64 for storage
    const storableData = {
      ...fileData,
      buffer: fileData.buffer.toString('base64')
    };

    // Store in Redis with expiration
    const key = `coffee:file:${code}`;
    await redis.set(key, storableData);
    await redis.expire(key, Math.ceil(FILE_EXPIRY_TIME / 1000)); // Redis expects seconds

    console.log(`[${STORAGE_CONFIG.instanceId}] Stored file with code: ${code} in Redis`);
    return true;
  } catch (error) {
    console.error(`[${STORAGE_CONFIG.instanceId}] Store error:`, error.message);
    return false;
  }
}

// Retrieve file data from Redis
async function getFile(code) {
  try {
    const key = `coffee:file:${code}`;
    const fileData = await redis.get(key);

    if (!fileData) {
      console.log(`[${STORAGE_CONFIG.instanceId}] File not found for code: ${code}`);
      return null;
    }

    const now = Date.now();
    if (now > fileData.expiresAt) {
      await redis.del(key);
      console.log(`[${STORAGE_CONFIG.instanceId}] File expired for code: ${code}`);
      return null;
    }

    // Convert base64 back to buffer
    const retrievedData = {
      ...fileData,
      buffer: Buffer.from(fileData.buffer, 'base64')
    };

    console.log(`[${STORAGE_CONFIG.instanceId}] Retrieved file for code: ${code} from Redis`);
    return retrievedData;
  } catch (error) {
    console.error(`[${STORAGE_CONFIG.instanceId}] Get error:`, error.message);
    return null;
  }
}

// Delete file data from Redis
async function deleteFile(code) {
  try {
    const key = `coffee:file:${code}`;
    const deleted = await redis.del(key);

    console.log(`[${STORAGE_CONFIG.instanceId}] Deleted file with code: ${code}, success: ${deleted > 0}`);
    return deleted > 0;
  } catch (error) {
    console.error(`[${STORAGE_CONFIG.instanceId}] Delete error:`, error.message);
    return false;
  }
}

// Get storage stats from Redis
async function getStats() {
  try {
    const keys = await redis.keys('coffee:file:*');

    return {
      totalFiles: keys.length,
      instanceId: STORAGE_CONFIG.instanceId,
      storageType: 'Redis',
      redisConnected: true
    };
  } catch (error) {
    console.error(`[${STORAGE_CONFIG.instanceId}] Stats error:`, error.message);
    return {
      totalFiles: 0,
      instanceId: STORAGE_CONFIG.instanceId,
      storageType: 'Redis',
      redisConnected: false,
      error: error.message
    };
  }
}

// Generate unique 6-digit code
async function generateUniqueCode() {
  let code;
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique code after 1000 attempts');
    }

    // Check if code exists in Redis
    const exists = await redis.exists(`coffee:file:${code}`);
    if (!exists) {
      break;
    }
  } while (true);

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
