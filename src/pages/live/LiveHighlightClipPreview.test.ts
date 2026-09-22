import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useNavigationStore } from '@/stores/navigation'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  queryCallbackEvents: vi.fn().mockResolvedValue({
    data: { code: 200, data: { list: [] } },
  }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-result': true,
  'a-descriptions': true,
  'a-descriptions-item': true,
  'a-tag': true,
  'a-alert': true,
  'a-space': true,
}

import LiveHighlightClipPreview from './LiveHighlightClipPreview.vue'
import { queryCallbackEvents } from '@/api/live'

function mountPage() {
  return mount(LiveHighlightClipPreview, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveHighlightClipPreview (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.highlight-clip-preview-page').exists()).toBe(true)
  })

  it('按 clipId 触发切片详情查询', async () => {
    const navigationStore = useNavigationStore()
    navigationStore.current.params = { clipId: 'clip-100' }
    mountPage()
    await flushPromises()
    expect(queryCallbackEvents).toHaveBeenCalled()
    expect(queryCallbackEvents).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'highlight', id: 'clip-100' })
    )
  })

  it('渲染页面标题文案', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('高光切片预览')
  })
})