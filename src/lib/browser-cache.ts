
type StorageType = 'local' | 'session';

interface CacheItem<T> {
  value: T;
  expiry: number | null; // Timestamp when the cache expires
}

export class BrowserCache {
  private storageType: StorageType;
  private prefix: string;
  
  constructor(options: { storageType?: StorageType; prefix?: string } = {}) {
    this.storageType = options.storageType || 'local';
    this.prefix = options.prefix || 'app-cache:';
  }
  
  private getStorage(): Storage {
    if (typeof window === 'undefined') {
      throw new Error('BrowserCache can only be used in browser environment');
    }
    return this.storageType === 'local' ? localStorage : sessionStorage;
  }
  
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }
  
  // Get data from cache, returns null if expired or not found
  get<T>(key: string): T | null {
    try {
      const storage = this.getStorage();
      const item = storage.getItem(this.getKey(key));
      
      if (!item) return null;
      
      const cacheItem = JSON.parse(item) as CacheItem<T>;
      
      // Check if cache has expired
      if (cacheItem.expiry && cacheItem.expiry < Date.now()) {
        this.delete(key);
        return null;
      }
      
      return cacheItem.value;
    } catch (error) {
      console.error('Error retrieving from browser cache:', error);
      return null;
    }
  }
  
  // Set data in cache with optional TTL in seconds
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    try {
      const storage = this.getStorage();
      const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
      
      const cacheItem: CacheItem<T> = {
        value,
        expiry
      };
      
      storage.setItem(this.getKey(key), JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error setting browser cache:', error);
      // If storage is full, clear old items
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        this.clearOldItems();
      }
    }
  }
  
  // Delete a specific cache item
  delete(key: string): void {
    try {
      const storage = this.getStorage();
      storage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Error deleting browser cache item:', error);
    }
  }
  
  // Clear all items with this cache prefix
  clear(): void {
    try {
      const storage = this.getStorage();
      const keysToRemove = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => storage.removeItem(key));
    } catch (error) {
      console.error('Error clearing browser cache:', error);
    }
  }
  
  // Clear expired and oldest items when storage is full
  private clearOldItems(): void {
    try {
      const storage = this.getStorage();
      const cacheItems: [string, CacheItem<unknown>, number][] = [];
      const now = Date.now();
      
      // Collect all items with their timestamps
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          try {
            const item = JSON.parse(storage.getItem(key) || '{}') as CacheItem<unknown>;
            // If expired, remove immediately
            if (item.expiry && item.expiry < now) {
              storage.removeItem(key);
            } else {
              // Otherwise, add to our array for sorting
              cacheItems.push([key, item, item.expiry || Infinity]);
            }
          } catch (e) {
            // Invalid JSON, remove the item
            storage.removeItem(key);
          }
        }
      }
      
      // If we still have too many items, remove the oldest 20%
      if (cacheItems.length > 0) {
        // Sort by expiry (oldest first)
        cacheItems.sort((a, b) => a[2] - b[2]);
        
        // Remove oldest 20%
        const removeCount = Math.max(Math.ceil(cacheItems.length * 0.2), 1);
        cacheItems.slice(0, removeCount).forEach(([key]) => {
          storage.removeItem(key);
        });
      }
    } catch (error) {
      console.error('Error clearing old cache items:', error);
    }
  }
}

// Create named instances for different data types
export const userBrowserCache = new BrowserCache({ prefix: 'user:' });
export const clientBrowserCache = new BrowserCache({ prefix: 'client:' });
export const taskBrowserCache = new BrowserCache({ prefix: 'task:' });
export const uiBrowserCache = new BrowserCache({ prefix: 'ui:' });

// Session-specific cache (cleared when browser is closed)
export const sessionCache = new BrowserCache({ 
  prefix: 'session:', 
  storageType: 'session' 
});