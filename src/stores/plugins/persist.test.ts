import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia, defineStore } from 'pinia'
import { createPersistPlugin } from './persist'

describe('Pinia Persist Plugin', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('does not crash when persist option is missing', () => {
    const pinia = createPinia()
    pinia.use(createPersistPlugin())
    setActivePinia(pinia)

    const useStore = defineStore('no-persist', {
      state: () => ({ count: 0 }),
    })
    const store = useStore()
    store.count = 5

    expect(store.count).toBe(5)
    expect(localStorage.getItem('pinia_no-persist')).toBeNull()
  })

  it('plugin is registered without errors', () => {
    const pinia = createPinia()
    const plugin = createPersistPlugin()
    expect(typeof plugin).toBe('function')
    pinia.use(plugin)
    setActivePinia(pinia)

    // 创建一个 store 验证插件不影响正常使用
    const useStore = defineStore('basic', {
      state: () => ({ name: 'test' }),
    })
    const store = useStore()
    expect(store.name).toBe('test')
  })
})