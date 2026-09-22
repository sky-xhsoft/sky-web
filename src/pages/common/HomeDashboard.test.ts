import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// setup.ts 未 stub、HomeDashboard 用到的 Arco 组件
const pageStubs = {
  'a-list': true,
  'a-list-item': true,
  'a-list-item-meta': true,
  'a-tag': true,
}

import HomeDashboard from './HomeDashboard.vue'

function mountPage() {
  return mount(HomeDashboard, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('HomeDashboard (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.dashboard-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('渲染欢迎区域', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.welcome-section').exists()).toBe(true)
    expect(wrapper.text()).toContain('dashboard.welcomeBack')
  })

  it('渲染统计卡片区域', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.stats-grid').exists()).toBe(true)
  })

  it('渲染快捷功能入口', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.shortcuts-grid').exists()).toBe(true)
    expect(wrapper.text()).toContain('dashboard.commonFunctions')
  })
})