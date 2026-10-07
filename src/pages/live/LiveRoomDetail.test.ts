import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
// 页面按直播间ID由后端生成推流/拉流地址
vi.mock('@/api/live', () => ({
  generatePushURLByRoom: vi.fn(),
  generatePullURLByRoom: vi.fn(),
  getStreamMetrics: vi.fn().mockResolvedValue({ bitrate: 2480, fps: 30, resolution: '1920x1080', viewers: 80 }),
  listClips: vi.fn().mockResolvedValue({ list: [], pagination: { total: 5 } }),
  listRecordings: vi.fn().mockResolvedValue({ list: [], pagination: { total: 2 } }),
}))

// 页面通过 api.get('/live/rooms/:id') 拉取直播间信息，mock 掉 axios 实例
vi.mock('@/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ data: { code: 200 } }),
    put: vi.fn().mockResolvedValue({ data: { code: 200 } }),
    delete: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  },
}))

// 确认框直接执行「确定」，便于断言后续请求
vi.mock('@arco-design/web-vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-vue')>()
  return {
    ...actual,
    Modal: { ...actual.Modal, confirm: vi.fn((opts: { onOk?: () => unknown }) => opts.onOk?.()) },
    Message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  }
})

const pageStubs = {
  'a-tooltip': { template: '<span><slot /></span>' },
  SpeechTaskListPanel: true,
  PullStreamTask: true,
  LiveHighlightClips: true,
  LiveRecordings: true,
}

import LiveRoomDetail from './LiveRoomDetail.vue'
import api from '@/api/http'
import { generatePushURLByRoom, generatePullURLByRoom } from '@/api/live'
import { useNavigationStore } from '@/stores/navigation'

const PUSH_URL = 'rtmp://push.test/live/room-1?txSecret=SECRET123&txTime=6A0E2F7F'

function room(status: string) {
  return { data: { code: 200, data: { id: 'room-1', roomName: '测试直播间', broadcastFormat: 'live', status, startTime: '2026-10-15T10:00:00+08:00' } } }
}

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

const button = (wrapper: ReturnType<typeof mountPage>, key: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(key))

describe('LiveRoomDetail (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // 直播间ID来自当前标签页参数（setup.ts 中的 useRoute 没有 params）
    useNavigationStore().current = { componentName: 'LiveRoomDetail', title: '', params: { id: 'room-1' } }
    vi.mocked(api.get).mockResolvedValue(room('live'))
    vi.mocked(generatePushURLByRoom).mockResolvedValue({ data: { code: 200, data: { pushUrl: PUSH_URL, pushUrlWebRtc: 'webrtc://push.test/live/room-1', pushUrlSrt: 'srt://push.test:9000/room-1' } } } as any)
    vi.mocked(generatePullURLByRoom).mockResolvedValue({ data: { code: 200, data: { rtmp: 'rtmp://play.test/live/room-1', flv: 'http://play.test/live/room-1.flv', hls: 'http://play.test/live/room-1.m3u8' } } } as any)
  })

  it('挂载后拉取直播间信息并按直播间生成推流/拉流地址', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-room-detail').exists()).toBe(true)
    expect(api.get).toHaveBeenCalledWith('/live/rooms/room-1')
    expect(generatePushURLByRoom).toHaveBeenCalledWith('room-1')
    expect(generatePullURLByRoom).toHaveBeenCalledWith('room-1')
  })

  it('OBS 服务器与推流码从推流地址拆出，推流码默认打码', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('rtmp://push.test/live/')
    expect(text).not.toContain('SECRET123')
    // 展开的其他协议地址同样打码
    await button(wrapper, 'liveRoomDetail.page.push.moreShow')!.trigger('click')
    expect(wrapper.text()).toContain('webrtc://push.test/live/room-1')
    expect(wrapper.text()).not.toContain('SECRET123')
    await button(wrapper, 'liveRoomDetail.page.push.show')!.trigger('click')
    expect(wrapper.text()).toContain('room-1?txSecret=SECRET123&txTime=6A0E2F7F')
  })

  it('直播中：显示结束直播与预览，删除不可用', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(button(wrapper, 'liveRoomDetail.page.actions.end')).toBeTruthy()
    expect(button(wrapper, 'liveRoomDetail.page.actions.preview')).toBeTruthy()
    expect(button(wrapper, 'liveRoomDetail.page.actions.start')).toBeFalsy()
    expect(button(wrapper, 'liveRoomDetail.delete')!.attributes('disabled')).toBeDefined()
  })

  it('未开始：确认后调用开始直播接口并刷新', async () => {
    vi.mocked(api.get).mockResolvedValue(room('draft'))
    const wrapper = mountPage()
    await flushPromises()
    expect(button(wrapper, 'liveRoomDetail.page.actions.end')).toBeFalsy()
    await button(wrapper, 'liveRoomDetail.page.actions.start')!.trigger('click')
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith('/live/rooms/room-1/start')
    expect(vi.mocked(api.get).mock.calls.filter((c) => c[0] === '/live/rooms/room-1').length).toBe(2)
  })

  it('删除使用直播间ID（原先取路由参数得到 undefined）并返回列表', async () => {
    vi.mocked(api.get).mockResolvedValue(room('ended'))
    const wrapper = mountPage()
    await flushPromises()
    const nav = useNavigationStore()
    nav.tabs = [
      { key: 'LiveRoomDetail-{"id":"room-1"}', title: '', componentName: 'LiveRoomDetail', params: { id: 'room-1' } },
      { key: 'LiveRoomForm-{"roomId":"room-1"}', title: '', componentName: 'LiveRoomForm', params: { roomId: 'room-1' } },
      { key: 'LiveRoomDetail-{"id":"room-2"}', title: '', componentName: 'LiveRoomDetail', params: { id: 'room-2' } },
    ]
    const spy = vi.spyOn(nav, 'navigateTo')
    const removeSpy = vi.spyOn(nav, 'removeTab')
    await button(wrapper, 'liveRoomDetail.delete')!.trigger('click')
    await flushPromises()
    expect(api.delete).toHaveBeenCalledWith('/live/rooms/room-1')
    expect(spy).toHaveBeenCalledWith('LiveRoomList', expect.any(String), {}, false)
    // 已删除直播间的详情页和编辑页标签被关闭，其他直播间不受影响
    expect(removeSpy.mock.calls.map((c) => c[0])).toEqual(['LiveRoomDetail-{"id":"room-1"}', 'LiveRoomForm-{"roomId":"room-1"}'])
  })

  it('编辑打开直播间表单并带上直播间ID', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const spy = vi.spyOn(useNavigationStore(), 'navigateTo')
    await button(wrapper, 'liveRoomDetail.edit')!.trigger('click')
    expect(spy).toHaveBeenCalledWith('LiveRoomForm', expect.any(String), { roomId: 'room-1' }, true)
  })

  it('推流地址生成失败时显示原因与重试，不显示示例地址', async () => {
    vi.mocked(generatePushURLByRoom).mockRejectedValue(new Error('当前公司未配置推流域名'))
    const wrapper = mountPage()
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('liveRoomDetail.page.push.failTitle')
    expect(text).not.toContain('txSecret')
    expect(button(wrapper, 'liveRoomDetail.page.push.retry')).toBeTruthy()
  })

  it('录制与切片数量显示在指标卡和标签上', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const badges = wrapper.findAll('.lrd-tab-badge').map((b) => b.text())
    expect(badges).toEqual(['5', '2'])
  })
})
