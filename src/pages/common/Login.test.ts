import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求（登录动作由用户触发，挂载阶段不调用）
vi.mock('@/api/auth', () => ({
  changePassword: vi.fn().mockResolvedValue({ data: { code: 200 } }),
}))

const pageStubs = {
  'a-input-password': true,
  LanguageSwitcher: true,
  ZigeboLogo: true,
}

import Login from './Login.vue'

function mountPage() {
  return mount(Login, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('Login (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.login-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('渲染登录卡片与品牌标题', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.login-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('ZiGeBo')
  })

  it('渲染品牌面板', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.deco-side').exists()).toBe(true)
  })

  it('地址中未指定系统时沿用上次登录的系统（登录过期被带回登录页时不丢失）', async () => {
    localStorage.setItem('sky-web:login-type', 'system')
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('login.platforms.system')
    localStorage.removeItem('sky-web:login-type')
  })
})
