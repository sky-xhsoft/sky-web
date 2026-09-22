import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// 避免菜单刷新误触发真实 HTTP
vi.mock('@/api/menu', () => ({
  fetchUserMenuTree: vi.fn().mockResolvedValue([]),
}))

import SystemManagement from './SystemManagement.vue'
import { fetchUserMenuTree } from '@/api/menu'

function mountPage() {
  return mount(SystemManagement, {
    global: {
      config: { globalProperties: { t: (key: string) => key } },
    },
  })
}

describe('SystemManagement (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点与功能卡片', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.system-management-page').exists()).toBe(true)
    expect(wrapper.find('.feature-card').exists()).toBe(true)
  })

  it('渲染内置模块区块(权限矩阵/公司配置)', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('权限矩阵')
    expect(wrapper.text()).toContain('公司配置')
  })

  it('挂载时不自动拉取菜单(仅点击刷新才触发)', async () => {
    mountPage()
    await flushPromises()
    expect(fetchUserMenuTree).not.toHaveBeenCalled()
  })
})