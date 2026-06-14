import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

// Define the fallback file path in the workspace root
const FALLBACK_FILE_PATH = path.resolve(process.cwd(), '../.session-store.json');

class SessionStore {
  private redis: Redis | null = null;
  private isRedisConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000, // 2 seconds timeout to fail fast
        enableOfflineQueue: false, // Disable offline queueing to fail fast if offline
        retryStrategy: () => null, // Do not auto-retry on connection failure
      });

      this.redis.on('connect', () => {
        this.isRedisConnected = true;
        console.log('Successfully connected to Redis.');
      });

      this.redis.on('error', (err) => {
        if (this.isRedisConnected) {
          console.warn('Redis error, switching to fallback storage:', err.message);
        }
        this.isRedisConnected = false;
      });
    } catch (e) {
      console.warn('Failed to initialize Redis client, using fallback storage.');
    }
  }

  private readFallbackFile(): Record<string, { value: string; expiresAt: number }> {
    try {
      if (fs.existsSync(FALLBACK_FILE_PATH)) {
        const content = fs.readFileSync(FALLBACK_FILE_PATH, 'utf8');
        return JSON.parse(content || '{}');
      }
    } catch (e) {
      console.error('Error reading fallback session file:', e);
    }
    return {};
  }

  private writeFallbackFile(data: Record<string, { value: string; expiresAt: number }>) {
    try {
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing fallback session file:', e);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isRedisConnected && this.redis) {
      try {
        return await this.redis.get(key);
      } catch (e) {
        this.isRedisConnected = false;
      }
    }

    // Fallback: Read from local JSON file
    const data = this.readFallbackFile();
    const item = data[key];
    if (item) {
      if (item.expiresAt > Date.now()) {
        return item.value;
      }
      // Clean up expired key
      delete data[key];
      this.writeFallbackFile(data);
    }
    return null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        if (mode === 'EX' && duration) {
          await this.redis.set(key, value, 'EX', duration);
        } else {
          await this.redis.set(key, value);
        }
        return;
      } catch (e) {
        this.isRedisConnected = false;
      }
    }

    // Fallback: Write to local JSON file
    const data = this.readFallbackFile();
    const expiresAt = mode === 'EX' && duration 
      ? Date.now() + (duration * 1000) 
      : Date.now() + (7 * 24 * 60 * 60 * 1000); // default 7 days

    data[key] = { value, expiresAt };
    this.writeFallbackFile(data);
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (e) {
        this.isRedisConnected = false;
      }
    }

    // Fallback: Delete from local JSON file
    const data = this.readFallbackFile();
    if (data[key]) {
      delete data[key];
      this.writeFallbackFile(data);
    }
  }
}

export const sessionStore = new SessionStore();
