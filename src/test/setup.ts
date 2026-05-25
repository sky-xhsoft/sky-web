/**
 * Vitest 全局测试设置
 * 配置 Pinia、Vue Router、Arco Design 等全局依赖
 */
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, vi } from 'vitest'

// 全局存根 Arco Design 组件
config.global.stubs = {
  'a-button': true,
  'a-spin': true,
  'a-empty': true,
  'a-breadcrumb': true,
  'a-breadcrumb-item': true,
  'a-skeleton': true,
  'a-skeleton-line': true,
  'a-skeleton-shape': true,
  'a-card': true,
  'a-input': true,
  'a-form': true,
  'a-form-item': true,
  'a-tabs': true,
  'a-tab-pane': true,
  'a-table': true,
  'a-modal': true,
  'a-select': true,
  'a-option': true,
}

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  useRoute: () => ({
    path: '/',
    query: {},
    params: {},
  }),
}))

// Mock vue-i18n - 仅替换 useI18n，保留 createI18n 等其他导出
vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
      locale: { value: 'zh-CN' },
    }),
  }
})

beforeEach(() => {
  // 每个测试创建新的 Pinia 实例
  setActivePinia(createPinia())
  // 清理 localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})