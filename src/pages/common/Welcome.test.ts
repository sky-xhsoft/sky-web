import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Welcome 页面无 @/api 依赖，仅中立化用到的 LanguageSwitcher 子组件
const pageStubs = {
  LanguageSwitcher: true,
}

import Welcome from './Welcome.vue'

function mountPage() {
  return mount(Welcome, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('Welcome (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.welcome-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('渲染 Hero 区域', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.hero-section').exists()).toBe(true)
    expect(wrapper.text()).toContain('welcome.brandTitle')
  })

  it('渲染产品介绍区域（两大系统，无平台选择）', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('#platforms').exists()).toBe(true)
    // 只介绍视频系统与云盘系统，不显示系统中心（仅公司 1 使用），也不再让用户选择平台进入
    expect(wrapper.findAll('.platform-card').length).toBe(2)
    expect(wrapper.text()).not.toContain('welcome.platforms.systemCenter')
    expect(wrapper.findAll('.platform-btn').length).toBe(0)
  })

  it('渲染导航栏', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.nav-bar').exists()).toBe(true)
  })
})