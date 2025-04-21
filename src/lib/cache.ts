import { redis } from './redis';

interface CacheOptions {
  ttl?: number; // Time-to-live in seconds
  prefix?: string; // Namespace prefix for keys
}

export class Cache {
  private prefix: string;
  
  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || 'cache:';
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(this.getKey(key));
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: { ttl?: number } = {}): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (options.ttl) {
        await redis.set(this.getKey(key), serializedValue, 'EX', options.ttl);
      } else {
        await redis.set(this.getKey(key), serializedValue);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redis.del(this.getKey(key));
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

// Create instances for different cache types
export const userCache = new Cache({ prefix: 'user:' });
export const clientCache = new Cache({ prefix: 'client:' });
export const taskCache = new Cache({ prefix: 'task:' });
export const dashboardCache = new Cache({ prefix: 'dashboard:' });