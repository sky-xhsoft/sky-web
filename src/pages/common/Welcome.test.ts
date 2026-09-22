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
    expect(wrapper.find('.hero').exists()).toBe(true)
    expect(wrapper.text()).toContain('welcome.brandTitle')
  })

  it('渲染平台选择区域', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('#platforms').exists()).toBe(true)
    expect(wrapper.findAll('.platform-card').length).toBe(3)
  })

  it('渲染导航栏', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.top-nav').exists()).toBe(true)
  })
})