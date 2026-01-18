/**
 * 性能优化工具函数
 *
 * 提供防抖、节流等性能优化功能
 */

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('搜索:', query)
 * }, 300)
 *
 * debouncedSearch('hello')  // 只有在300ms内没有新调用时才会执行
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   console.log('滚动事件')
 * }, 200)
 *
 * window.addEventListener('scroll', throttledScroll)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function throttled(...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        fn(...args)
        timeoutId = null
      }, delay - (now - lastCall))
    }
  }
}

/**
 * RAF（requestAnimationFrame）节流
 * 使用 requestAnimationFrame 来优化性能
 *
 * @param fn 要执行的函数
 * @returns 节流后的函数
 *
 * @example
 * const rafThrottledUpdate = rafThrottle(() => {
 *   updateUI()
 * })
 *
 * window.addEventListener('scroll', rafThrottledUpdate)
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null

  return function rafThrottled(...args: Parameters<T>) {
    if (rafId) {
      return
    }

    rafId = requestAnimationFrame(() => {
      fn(...args)
      rafId = null
    })
  }
}

/**
 * 懒加载图片
 * 使用 Intersection Observer API 实现图片懒加载
 *
 * @param selector 图片选择器
 * @param options Intersection Observer 选项
 *
 * @example
 * lazyLoadImages('.lazy-image', {
 *   rootMargin: '50px'
 * })
 */
export function lazyLoadImages(
  selector: string,
  options?: IntersectionObserverInit
): () => void {
  const images = document.querySelectorAll(selector)

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px',
    threshold: 0.01,
    ...options,
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.src

        if (src) {
          img.src = src
          img.removeAttribute('data-src')
          observer.unobserve(img)
        }
      }
    })
  }, defaultOptions)

  images.forEach((img) => observer.observe(img))

  // 返回清理函数
  return () => {
    observer.disconnect()
  }
}

/**
 * 批处理函数
 * 将多个操作合并为一次执行
 *
 * @param fn 要批处理的函数
 * @param delay 延迟时间（毫秒）
 * @returns 批处理后的函数
 *
 * @example
 * const batchedUpdate = batch((items: string[]) => {
 *   console.log('批量更新:', items)
 * }, 100)
 *
 * batchedUpdate('a')
 * batchedUpdate('b')
 * batchedUpdate('c')
 * // 100ms后一次性执行: ['a', 'b', 'c']
 */
export function batch<T>(
  fn: (items: T[]) => void,
  delay: number
): (item: T) => void {
  let items: T[] = []
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (item: T) => {
    items.push(item)

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn([...items])
      items = []
      timeoutId = null
    }, delay)
  }
}

/**
 * 分块处理大数组
 * 避免长时间阻塞主线程
 *
 * @param array 要处理的数组
 * @param chunkSize 每批处理的大小
 * @param processor 处理函数
 * @param onProgress 进度回调
 *
 * @example
 * await processInChunks(
 *   largeArray,
 *   100,
 *   (chunk) => chunk.forEach(processItem),
 *   (progress) => console.log(`处理进度: ${progress}%`)
 * )
 */
export async function processInChunks<T>(
  array: T[],
  chunkSize: number,
  processor: (chunk: T[]) => void | Promise<void>,
  onProgress?: (progress: number) => void
): Promise<void> {
  const totalChunks = Math.ceil(array.length / chunkSize)

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize)
    await processor(chunk)

    if (onProgress) {
      const currentChunk = Math.ceil((i + chunkSize) / chunkSize)
      const progress = Math.min(100, Math.round((currentChunk / totalChunks) * 100))
      onProgress(progress)
    }

    // 让出主线程，避免阻塞
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

/**
 * 内存化缓存
 * 缓存函数的执行结果
 *
 * @param fn 要缓存的函数
 * @param keyGenerator 生成缓存键的函数
 * @returns 带缓存的函数
 *
 * @example
 * const expensiveCalculation = memoize(
 *   (a: number, b: number) => a * b,
 *   (a, b) => `${a}-${b}`
 * )
 *
 * expensiveCalculation(5, 10) // 计算并缓存
 * expensiveCalculation(5, 10) // 直接返回缓存结果
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T & { cache: Map<string, ReturnType<T>>; clear: () => void } {
  const cache = new Map<string, ReturnType<T>>()

  const memoized = function (...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  } as T & { cache: Map<string, ReturnType<T>>; clear: () => void }

  memoized.cache = cache
  memoized.clear = () => cache.clear()

  return memoized
}

/**
 * 时间切片执行
 * 将耗时任务拆分到多个帧中执行
 *
 * @param tasks 任务数组
 * @param timePerFrame 每帧执行时间（毫秒）
 *
 * @example
 * await timeSlicing(
 *   [task1, task2, task3, ...],
 *   16 // 每帧16ms
 * )
 */
export async function timeSlicing<T>(
  tasks: (() => T | Promise<T>)[],
  timePerFrame: number = 16
): Promise<T[]> {
  const results: T[] = []
  let taskIndex = 0

  while (taskIndex < tasks.length) {
    const frameStart = Date.now()

    while (taskIndex < tasks.length && Date.now() - frameStart < timePerFrame) {
      const result = await tasks[taskIndex]()
      results.push(result)
      taskIndex++
    }

    // 让出主线程
    if (taskIndex < tasks.length) {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
    }
  }

  return results
}

/**
 * LRU (Least Recently Used) 缓存
 * 有容量限制的缓存，超出容量时删除最久未使用的项
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    // 更新访问顺序：删除后重新插入
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    // 如果key存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 如果达到容量上限，删除最旧的项（Map的第一个元素）
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}
