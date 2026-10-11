import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/api/liveShare', () => ({
  getRoomShare: vi.fn(),
  updateRoomShare: vi.fn(),
  shareLink: (code: string) => `http://test.skyzhou.cn/live-share/${code}`,
}))

import ShareRoomModal from './ShareRoomModal.vue'
import { getRoomShare, updateRoomShare } from '@/api/liveShare'

describe('ShareRoomModal 分享直播间', () => {
  beforeEach(() => {
    vi.mocked(getRoomShare).mockReset()
    vi.mocked(updateRoomShare).mockReset()
  })

  it('打开时加载分享设置；开启后显示链接，重新生成会传 reset', async () => {
    vi.mocked(getRoomShare).mockResolvedValue({ enabled: false, code: '' })
    const wrapper = mount(ShareRoomModal, { props: { visible: true, room: { id: 99, roomName: '发布会' } } })
    await flushPromises()
    const vm = wrapper.vm as any
    expect(getRoomShare).toHaveBeenCalledWith(99)
    expect(vm.link).toBe('')

    vi.mocked(updateRoomShare).mockResolvedValue({ enabled: true, code: 'c1' })
    await vm.save(true)
    expect(updateRoomShare).toHaveBeenLastCalledWith(99, { enabled: true, reset: false })
    expect(vm.link).toBe('http://test.skyzhou.cn/live-share/c1')

    vi.mocked(updateRoomShare).mockResolvedValue({ enabled: true, code: 'c2' })
    await vm.save(true, true)
    expect(updateRoomShare).toHaveBeenLastCalledWith(99, { enabled: true, reset: true })
    expect(vm.link).toBe('http://test.skyzhou.cn/live-share/c2')
  })

  it('未打开时不请求', async () => {
    mount(ShareRoomModal, { props: { visible: false, room: { id: 99 } } })
    await flushPromises()
    expect(getRoomShare).not.toHaveBeenCalled()
  })
})
