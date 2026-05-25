/**
 * 外键选项缓存管理
 * 提供全局共享的显示值缓存和请求去重机制
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // 毫秒
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5分钟

class ForeignKeyCache {
  private displayValueCache = new Map<string, CacheEntry<string>>()
  private optionsCache = new Map<string, CacheEntry<any[]>>()
  private pendingRequests = new Map<string, Promise<string>>()

  /**
   * 生成缓存键
   */
  private static makeKey(tableId: number, value: string | number, columnId?: number): string {
    return `${tableId}_${value}_${columnId || ''}`
  }

  /**
   * 获取显示值缓存
   */
  getDisplayValue(tableId: number, value: string | number, columnId?: number): string | null {
    const key = ForeignKeyCache.makeKey(tableId, value, columnId)
    const entry = this.displayValueCache.get(key)
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data
    }
    this.displayValueCache.delete(key)
    return null
  }

  /**
   * 设置显示值缓存
   */
  setDisplayValue(tableId: number, value: string | number, displayValue: string, columnId?: number): void {
    const key = ForeignKeyCache.makeKey(tableId, value, columnId)
    this.displayValueCache.set(key, {
      data: displayValue,
      timestamp: Date.now(),
      ttl: DEFAULT_TTL,
    })
  }

  /**
   * 获取选项列表缓存
   */
  getOptions(cacheKey: string): any[] | null {
    const entry = this.optionsCache.get(cacheKey)
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data
    }
    this.optionsCache.delete(cacheKey)
    return null
  }

  /**
   * 设置选项列表缓存
   */
  setOptions(cacheKey: string, options: any[]): void {
    this.optionsCache.set(cacheKey, {
      data: options,
      timestamp: Date.now(),
      ttl: DEFAULT_TTL,
    })
  }

  /**
   * 请求去重：如果有进行中的请求则返回已有 Promise，否则注册新请求
   */
  getPendingRequest(key: string): Promise<string> | null {
    return this.pendingRequests.get(key) || null
  }

  setPendingRequest(key: string, promise: Promise<string>): void {
    this.pendingRequests.set(key, promise)
  }

  removePendingRequest(key: string): void {
    this.pendingRequests.delete(key)
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.displayValueCache.clear()
    this.optionsCache.clear()
    this.pendingRequests.clear()
  }
}

// 全局单例
export const fkCache = new ForeignKeyCache()

export function useForeignKeyCache() {
  return {
    getDisplayValue: fkCache.getDisplayValue.bind(fkCache),
    setDisplayValue: fkCache.setDisplayValue.bind(fkCache),
    getOptions: fkCache.getOptions.bind(fkCache),
    setOptions: fkCache.setOptions.bind(fkCache),
    getPendingRequest: fkCache.getPendingRequest.bind(fkCache),
    setPendingRequest: fkCache.setPendingRequest.bind(fkCache),
    removePendingRequest: fkCache.removePendingRequest.bind(fkCache),
    clear: fkCache.clear.bind(fkCache),
  }
}
