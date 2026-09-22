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
}

import LiveRecordingPreview from './LiveRecordingPreview.vue'
import { queryCallbackEvents } from '@/api/live'

function mountPage() {
  return mount(LiveRecordingPreview, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveRecordingPreview (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-recording-preview-page').exists()).toBe(true)
  })

  it('按 recordId 触发录制详情查询', async () => {
    const navigationStore = useNavigationStore()
    navigationStore.current.params = { recordId: 'rec-888' }
    mountPage()
    await flushPromises()
    expect(queryCallbackEvents).toHaveBeenCalled()
    expect(queryCallbackEvents).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'recording_file', id: 'rec-888' })
    )
  })

  it('渲染页面标题文案', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('录制文件预览')
  })
})