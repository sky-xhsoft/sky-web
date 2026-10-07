import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  generatePlayURL: vi.fn().mockResolvedValue({
    data: { code: 200, data: { flv: 'http://play.example.com/live/stream-1.flv' } },
  }),
}))

// setup.ts 未 stub、LivePreview 用到的 Arco 组件
const pageStubs = {
  'a-descriptions': true,
  'a-descriptions-item': true,
}

const props = {
  streamName: 'stream-1',
  appName: 'live',
  playDomain: 'play.example.com',
}

import LivePreview from './LivePreview.vue'
import { generatePlayURL } from '@/api/live'

function mountPage() {
  return mount(LivePreview, {
    props,
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LivePreview (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    ;(window as any).TCPlayer = vi.fn(() => ({ pause: vi.fn(), dispose: vi.fn() }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-preview-page').exists()).toBe(true)
    wrapper.unmount()
  })

  it('onMounted 生成播放地址', async () => {
    const wrapper = mountPage()
    await flushPromises()
    vi.advanceTimersByTime(200)
    await flushPromises()
    expect(generatePlayURL).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('渲染流信息与播放器区域', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.player-box').exists()).toBe(true)
    expect(wrapper.find('.stream-info').exists()).toBe(true)
    wrapper.unmount()
  })
})