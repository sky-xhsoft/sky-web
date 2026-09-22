import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  generatePushURL: vi.fn().mockResolvedValue({
    data: { code: 200, data: { pushUrl: 'rtmp://push.test/live/stream', pushUrlWebRtc: 'webrtc://push.test/live/stream', pushUrlSrt: 'srt://push.test:9000/stream' } },
  }),
  generatePlayURL: vi.fn().mockResolvedValue({
    data: { code: 200, data: { rtmp: 'rtmp://play.test/live/stream', flv: 'http://play.test/live/stream.flv', hls: 'http://play.test/live/stream.m3u8' } },
  }),
}))

// 页面通过 api.get('/live/rooms/:id') 拉取直播间信息，mock 掉 axios 实例
vi.mock('@/api/http', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { code: 200, data: { ID: 'room-1', ROOM_NAME: '测试直播间', BROADCAST_FORMAT: 'live', STATUS: 'live' } },
    }),
    put: vi.fn().mockResolvedValue({ data: { code: 200 } }),
    delete: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  },
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-space': true,
  'a-row': true,
  'a-col': true,
  'a-image': true,
  'a-divider': true,
}

import LiveRoomDetail from './LiveRoomDetail.vue'
import api from '@/api/http'
import { generatePushURL, generatePlayURL } from '@/api/live'

function mountPage() {
  return mount(LiveRoomDetail, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveRoomDetail (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-room-detail').exists()).toBe(true)
  })

  it('onBeforeMount 触发推流/拉流地址生成', async () => {
    mountPage()
    await flushPromises()
    expect(generatePushURL).toHaveBeenCalled()
    expect(generatePlayURL).toHaveBeenCalled()
  })

  it('拉取直播间信息接口被调用', async () => {
    mountPage()
    await flushPromises()
    expect(api.get).toHaveBeenCalled()
  })
})