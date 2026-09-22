import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  listClips: vi.fn().mockResolvedValue({
    list: [],
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
  }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-range-picker': true,
  'a-space': true,
  'a-table-column': true,
  'a-link': true,
  'a-tooltip': true,
}

import LiveHighlightClips from './LiveHighlightClips.vue'
import { listClips } from '@/api/live'

function mountPage() {
  return mount(LiveHighlightClips, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveHighlightClips (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.highlight-clips-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('onMounted 触发高光切片列表加载', async () => {
    mountPage()
    await flushPromises()
    expect(listClips).toHaveBeenCalled()
  })

  it('渲染页面标题与查询入口文案', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.v2-page-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('直播高光切片')
  })
})