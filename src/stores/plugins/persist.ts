/**
 * Pinia 持久化插件
 * 自动将 store 状态保存到 localStorage 并在初始化时恢复
 *
 * 使用方式：
 * defineStore('myStore', {
 *   state: () => ({ ... }),
 *   persist: true  // 启用持久化
 * })
 *
 * 或精细控制：
 * defineStore('myStore', {
 *   state: () => ({ ... }),
 *   persist: {
 *     key: 'custom-key',
 *     paths: ['field1', 'nested.field'],
 *     storage: localStorage
 *   }
 * })
 */
import type { PiniaPluginContext } from 'pinia'

export interface PersistOptions {
  /** localStorage 的键名（默认使用 store id） */
  key?: string
  /** 需要持久化的字段路径（默认全部） */
  paths?: string[]
  /** 存储后端（默认 localStorage） */
  storage?: Storage
  /** 序列化函数 */
  serialize?: (value: unknown) => string
  /** 反序列化函数 */
  deserialize?: (value: string) => unknown
}

declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | PersistOptions
  }
}

function getNestedValue(obj: any, path: string): unknown {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

function setNestedValue(obj: any, path: string, value: unknown): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((acc, key) => {
    if (!(key in acc)) acc[key] = {}
    return acc[key]
  }, obj)
  target[lastKey] = value
}

export function createPersistPlugin() {
  return (context: PiniaPluginContext) => {
    const { options, store } = context

    // Pinia v3 中，Options Stores 的 persist 在 options.persist
    // Setup Stores 通过第三个参数传递，但目前我们走 options 路径
    const persistOption = (options as any).persist
    if (!persistOption) return

    const persistConfig: PersistOptions =
      typeof persistOption === 'boolean' ? {} : persistOption

    const key = persistConfig.key || `pinia_${store.$id}`
    const storage = persistConfig.storage || localStorage
    const serialize = persistConfig.serialize || JSON.stringify
    const deserialize = persistConfig.deserialize || JSON.parse

    // 初始化：从存储恢复状态
    try {
      const stored = storage.getItem(key)
      if (stored) {
        const parsed = deserialize(stored)
        if (persistConfig.paths && Array.isArray(persistConfig.paths)) {
          // 只恢复指定路径
          const partial: Record<string, unknown> = {}
          persistConfig.paths.forEach((path) => {
            const val = getNestedValue(parsed, path)
            if (val !== undefined) {
              setNestedValue(partial, path, val)
            }
          })
          store.$patch(partial as any)
        } else {
          // 恢复全部状态
          store.$patch(parsed)
        }
      }
    } catch (e) {
      console.warn(`[pinia-persist] Failed to restore ${key}:`, e)
    }

    // 订阅状态变化，自动保存
    store.$subscribe(
      (_mutation, state) => {
        try {
          let dataToSave: unknown = state
          if (persistConfig.paths && Array.isArray(persistConfig.paths)) {
            const partial: Record<string, unknown> = {}
            persistConfig.paths.forEach((path) => {
              const val = getNestedValue(state, path)
              if (val !== undefined) {
                setNestedValue(partial, path, val)
              }
            })
            dataToSave = partial
          }
          storage.setItem(key, serialize(dataToSave))
        } catch (e) {
          console.warn(`[pinia-persist] Failed to save ${key}:`, e)
        }
      },
      { detached: true }
    )
  }
}
