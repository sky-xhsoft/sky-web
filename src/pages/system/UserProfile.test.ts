import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求（改密/登出由用户触发，挂载阶段不调用）
vi.mock('@/api/auth', () => ({
  changePassword: vi.fn().mockResolvedValue({ data: { code: 200 } }),
}))

// setup.ts 未 stub、UserProfile 用到的 Arco 组件
const pageStubs = {
  'a-radio-group': true,
  'a-radio': true,
  'a-input-password': true,
}

import UserProfile from './UserProfile.vue'

function mountPage() {
  return mount(UserProfile, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('UserProfile (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.user-profile').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('渲染页面标题', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.page-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('userProfile.title')
  })

  it('渲染个人信息卡片', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.profile-card').exists()).toBe(true)
    expect(wrapper.find('.page-content').exists()).toBe(true)
  })
})