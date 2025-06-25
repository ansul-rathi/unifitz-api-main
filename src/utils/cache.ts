// src/utils/CacheUtil.ts
import NodeCache from "node-cache";

class CacheUtil {
  private cache: NodeCache;

  constructor() {
    // Cache with a default TTL of 30 seconds 
    this.cache = new NodeCache({ stdTTL: 30 });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }
}

export default new CacheUtil();
