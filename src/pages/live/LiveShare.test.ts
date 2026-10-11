import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('vue-router', () => ({ useRoute: () => ({ params: { code: 'abcdef0123456789abcdef01' } }) }))
vi.mock('@/api/liveShare', () => ({ getPublicShare: vi.fn() }))

import LiveShare from './LiveShare.vue'
import { getPublicShare } from '@/api/liveShare'

const base = { roomName: '发布会', companyName: 'skyzhou', description: '简介内容', displayMode: 'landscape' }

describe('LiveShare 直播间分享页', () => {
  let tcplayer: ReturnType<typeof vi.fn>
  beforeEach(() => {
    vi.mocked(getPublicShare).mockReset()
    tcplayer = vi.fn(() => ({ dispose: vi.fn() }))
    ;(window as any).TCPlayer = tcplayer
  })
  afterEach(() => {
    delete (window as any).TCPlayer
  })

  it('链接失效时只显示失效提示，并停止刷新', async () => {
    vi.mocked(getPublicShare).mockResolvedValue({ status: 'invalid', serverTime: new Date().toISOString() })
    const wrapper = mount(LiveShare)
    await flushPromises()
    expect(wrapper.text()).toContain('分享链接已失效')
    expect(wrapper.text()).toContain('直播已结束超过 1 小时')
    expect(wrapper.find('.ls-player').exists()).toBe(false)
    wrapper.unmount()
  })

  it('未开始：按服务器时间倒计时，显示开播后自动播放提示', async () => {
    const server = new Date('2026-10-12T18:00:00+08:00')
    vi.mocked(getPublicShare).mockResolvedValue({ ...base, status: 'upcoming', startTime: '2026-10-12T20:15:30+08:00', serverTime: server.toISOString() })
    const wrapper = mount(LiveShare)
    await flushPromises()
    const vm = wrapper.vm as any
    expect(vm.countdown.units.map((u: any) => u.value)).toEqual(['00', '02', '15', '30'])
    expect(wrapper.text()).toContain('开播后页面会自动开始播放')
    expect(wrapper.text()).toContain('发布会')
    expect(wrapper.text()).toContain('skyzhou')
    expect(wrapper.text()).toContain('简介内容')
    expect(tcplayer).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('直播中：创建播放器（电脑用 FLV），刷新状态不重建；结束后显示已结束', async () => {
    const live = { ...base, status: 'live' as const, serverTime: new Date().toISOString(), playUrls: { flv: 'http://play.test/live/99.flv?x', hls: 'http://play.test/live/99.m3u8?x' } }
    vi.mocked(getPublicShare).mockResolvedValue(live)
    const wrapper = mount(LiveShare)
    await flushPromises()
    const vm = wrapper.vm as any
    expect(vm.playUrl).toBe('http://play.test/live/99.flv?x')
    expect(tcplayer).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.ls-badge-live').exists()).toBe(true)

    await vm.load()
    expect(tcplayer).toHaveBeenCalledTimes(1)

    vi.mocked(getPublicShare).mockResolvedValue({ ...base, status: 'ended', startTime: '2026-10-12T20:00:00+08:00', endedAt: '2026-10-12T21:30:00+08:00', serverTime: new Date().toISOString() })
    await vm.load()
    await flushPromises()
    expect(wrapper.text()).toContain('直播已结束')
    expect(wrapper.text()).toContain('直播时间 10-12 20:00 – 21:30')
    wrapper.unmount()
  })
})
