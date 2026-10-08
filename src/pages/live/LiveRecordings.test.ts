import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  listRecordings: vi.fn().mockResolvedValue({
    list: [],
    pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
  }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-range-picker': true,
  'a-space': true,
  'a-table-column': true,
  'a-link': true,
}

import LiveRecordings from './LiveRecordings.vue'
import { listRecordings } from '@/api/live'

function mountPage(props: Record<string, unknown> = {}) {
  return mount(LiveRecordings, {
    props,
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveRecordings (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-recordings-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('onMounted 触发录制列表加载', async () => {
    mountPage()
    await flushPromises()
    expect(listRecordings).toHaveBeenCalled()
  })

  it('渲染页面标题与查询入口文案', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.v2-page-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('直播录制列表')
  })

  it('嵌入直播间详情时不显示页头和汇总卡片，只保留操作按钮与列表', async () => {
    const wrapper = mountPage({ embedded: true, roomId: '66' })
    await flushPromises()
    expect(wrapper.find('.stats-grid').exists()).toBe(false)
    expect(wrapper.find('.v2-page-header').exists()).toBe(false)
    expect(wrapper.find('.embedded-toolbar').exists()).toBe(true)
    expect(listRecordings).toHaveBeenCalledWith(expect.objectContaining({ roomId: '66' }))
  })

  it('独立页面仍显示页头和汇总卡片', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.stats-grid').exists()).toBe(true)
    expect(wrapper.find('.embedded-toolbar').exists()).toBe(false)
  })
})
