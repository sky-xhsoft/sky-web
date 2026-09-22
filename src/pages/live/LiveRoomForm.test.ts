import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// 页面通过 api 实例读写数据；默认(新增)模式下 onMounted 不触发接口调用，仍 mock 以防编辑模式
vi.mock('@/api/http', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { code: 200, data: { data: { ROOM_NAME: 'x' } } } }),
    post: vi.fn().mockResolvedValue({ data: { code: 200 } }),
    put: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  },
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-space': true,
  'a-alert': true,
  'a-row': true,
  'a-col': true,
  'a-radio-group': true,
  'a-radio': true,
  'a-date-picker': true,
  'a-upload': true,
  'a-image': true,
}

import LiveRoomForm from './LiveRoomForm.vue'
import api from '@/api/http'

function mountPage(props: { roomId?: string } = {}) {
  return mount(LiveRoomForm, {
    props,
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveRoomForm (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('挂载后渲染页面根节点(新增模式)', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-room-form').exists()).toBe(true)
  })

  it('新增模式下不触发数据加载接口', async () => {
    mountPage()
    await flushPromises()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('编辑模式下 onMounted 触发数据加载', async () => {
    mountPage({ roomId: 'room-x' })
    await flushPromises()
    expect(api.get).toHaveBeenCalled()
  })
})