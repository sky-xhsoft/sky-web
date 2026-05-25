/**
 * 可缓存的请求 composable
 * 对重复的 GET 请求自动去重和缓存
 */

import { requestCache } from '@/api/cache'

interface UseCachedRequestOptions {
  /** 缓存 TTL（毫秒），默认 30 秒 */
  ttl?: number
  /** 缓存 key 前缀，用于分组清除 */
  prefix?: string
}

export function useCachedRequest(options: UseCachedRequestOptions = {}) {
  const { ttl, prefix } = options

  /**
   * 执行可缓存的请求
   * @param key 缓存key
   * @param fetcher 请求函数
   * @returns 缓存或新获取的数据
   */
  async function cachedRequest<T>(
    key: string,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cacheKey = prefix ? `${prefix}:${key}` : key

    const cached = requestCache.get<T>(cacheKey)
    if (cached !== null) return cached

    const data = await fetcher()
    requestCache.set(cacheKey, data, ttl)
    return data
  }

  /** 使指定缓存失效 */
  function invalidate(key: string): void {
    const cacheKey = prefix ? `${prefix}:${key}` : key
    requestCache.delete(cacheKey)
  }

  /** 清除所有匹配前缀的缓存 */
  function clearAll(): void {
    if (prefix) {
      requestCache.clearPrefix(prefix)
    } else {
      requestCache.clear()
    }
  }

  return { cachedRequest, invalidate, clearAll }
}
