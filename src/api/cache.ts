/**
 * HTTP 请求缓存工具
 * 用于缓存 GET 请求的响应结果，减少重复请求
 */

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number // 毫秒
}

const DEFAULT_TTL = 30 * 1000 // 默认30秒

export class RequestCache {
  private store = new Map<string, CacheEntry>()

  /** 生成缓存 key */
  static makeKey(method: string, url: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : ''
    return `${method}:${url}:${paramStr}`
  }

  /** 获取缓存 */
  get<T = any>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  /** 设置缓存 */
  set(key: string, data: any, ttl = DEFAULT_TTL): void {
    this.store.set(key, { data, timestamp: Date.now(), ttl })
  }

  /** 清除指定 key */
  delete(key: string): void {
    this.store.delete(key)
  }

  /** 清除匹配前缀的缓存 */
  clearPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }

  /** 清除所有 */
  clear(): void {
    this.store.clear()
  }
}

export const requestCache = new RequestCache()
