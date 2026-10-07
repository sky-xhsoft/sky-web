import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
// 页面按直播间ID由后端生成推流/拉流地址
vi.mock('@/api/live', () => ({
  generatePushURLByRoom: vi.fn().mockResolvedValue({
    data: { code: 200, data: { pushUrl: 'rtmp://push.test/live/stream', pushUrlWebRtc: 'webrtc://push.test/live/stream', pushUrlSrt: 'srt://push.test:9000/stream' } },
  }),
  generatePullURLByRoom: vi.fn().mockResolvedValue({
    data: { code: 200, data: { rtmp: 'rtmp://play.test/live/stream', flv: 'http://play.test/live/stream.flv', hls: 'http://play.test/live/stream.m3u8' } },
  }),
}))

// 页面通过 api.get('/live/rooms/:id') 拉取直播间信息，mock 掉 axios 实例
vi.mock('@/api/http', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { code: 200, data: { id: 'room-1', roomName: '测试直播间', broadcastFormat: 'live', status: 'live' } },
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
import { generatePushURLByRoom, generatePullURLByRoom } from '@/api/live'
import { useNavigationStore } from '@/stores/navigation'

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
    // 直播间ID来自当前标签页参数（setup.ts 中的 useRoute 没有 params）
    useNavigationStore().current = { componentName: 'LiveRoomDetail', title: '', params: { id: 'room-1' } }
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-room-detail').exists()).toBe(true)
  })

  it('onBeforeMount 触发推流/拉流地址生成', async () => {
    mountPage()
    await flushPromises()
    expect(generatePushURLByRoom).toHaveBeenCalledWith('room-1')
    expect(generatePullURLByRoom).toHaveBeenCalledWith('room-1')
  })

  it('拉取直播间信息接口被调用', async () => {
    mountPage()
    await flushPromises()
    expect(api.get).toHaveBeenCalledWith('/live/rooms/room-1')
  })
})