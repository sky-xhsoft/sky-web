import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const roomsResponse = (rows: any[]) => ({ data: { code: 200, data: { total: rows.length, data: rows } } })

vi.mock('../../../api/http', () => ({ default: { post: vi.fn(), get: vi.fn() } }))
vi.mock('../../../api/live', () => ({
  listDomains: vi.fn().mockResolvedValue({ data: { data: { domains: [{ Name: 'play.test', Type: 1 }] } } }),
  generatePushURLByRoom: vi.fn(),
}))

import SpeechTaskModal from './SpeechTaskModal.vue'
import api from '../../../api/http'
import { listDomains } from '../../../api/live'

const stubs = {
  SpeechStepMode: true,
  SpeechStepStyle: true,
  SpeechStepGlossary: true,
  SpeechGlossaryLibrary: true,
  SpeechPreview: true,
}

describe('SpeechTaskModal 直播间下拉', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(api.post).mockReset()
  })

  it('每次打开都重新加载直播间，能看到打开页面后新建的直播间', async () => {
    vi.mocked(api.post).mockResolvedValueOnce(roomsResponse([]) as any)
    const wrapper = mount(SpeechTaskModal, { props: { visible: true }, global: { stubs } })
    await flushPromises()
    expect((wrapper.vm as any).rooms).toEqual([])

    await wrapper.setProps({ visible: false })
    vi.mocked(api.post).mockResolvedValueOnce(roomsResponse([{ ID: 99, ROOM_NAME: '新直播间', STATUS: 'live' }]) as any)
    await wrapper.setProps({ visible: true })
    await flushPromises()
    expect(api.post).toHaveBeenCalledTimes(2)
    expect((wrapper.vm as any).rooms.map((r: any) => r.id)).toEqual([99])
  })

  it('域名列表失败时直播间仍可选', async () => {
    vi.mocked(listDomains).mockRejectedValueOnce(new Error('domains down'))
    vi.mocked(api.post).mockResolvedValueOnce(roomsResponse([{ ID: 100, ROOM_NAME: '直播间A', STATUS: 'draft' }]) as any)
    const wrapper = mount(SpeechTaskModal, { props: { visible: true }, global: { stubs } })
    await flushPromises()
    expect((wrapper.vm as any).rooms.map((r: any) => r.id)).toEqual([100])
  })
})
