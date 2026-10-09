import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  generatePlayURL: vi.fn().mockResolvedValue({
    data: { code: 200, data: { flv: 'http://play.example.com/live/stream-1.flv', hls: 'http://play.example.com/live/stream-1.m3u8', rtmp: 'rtmp://play.example.com/live/stream-1' } },
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

  it('流信息列出 FLV/HLS/RTMP 三种播放地址', async () => {
    const wrapper = mountPage()
    await flushPromises()
    vi.advanceTimersByTime(200)
    await flushPromises()
    const text = wrapper.find('.stream-info').text()
    expect(text).toContain('http://play.example.com/live/stream-1.flv')
    expect(text).toContain('http://play.example.com/live/stream-1.m3u8')
    expect(text).toContain('rtmp://play.example.com/live/stream-1')
    wrapper.unmount()
  })

  it('播放器不按宽度自适应高度（高度由页面容器限制）', async () => {
    const wrapper = mountPage()
    await flushPromises()
    // 挂载后延迟 100ms 生成地址，生成后再延迟 100ms 创建播放器
    vi.advanceTimersByTime(200)
    await flushPromises()
    vi.advanceTimersByTime(200)
    await flushPromises()
    const TCPlayer = (window as any).TCPlayer
    expect(TCPlayer).toHaveBeenCalled()
    expect(TCPlayer.mock.calls[0][1]).toMatchObject({ fluid: false })
    expect(TCPlayer.mock.calls[0][1].sources[0].src).toBe('http://play.example.com/live/stream-1.flv')
    wrapper.unmount()
  })

  it('标题优先显示直播间名称，未传入时显示流名称', async () => {
    const withRoom = mount(LivePreview, {
      props: { ...props, roomName: '公司年会' },
      global: { stubs: pageStubs, config: { globalProperties: { t: (key: string) => key } } },
    })
    await flushPromises()
    expect(withRoom.find('.head-title').text()).toBe('公司年会')
    withRoom.unmount()

    const withoutRoom = mountPage()
    await flushPromises()
    expect(withoutRoom.find('.head-title').text()).toBe('流 stream-1')
    withoutRoom.unmount()
  })
})
