import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  listDomains: vi.fn().mockResolvedValue({
    data: {
      code: 200,
      data: { domains: [{ Name: 'push.test', Type: 0 }, { Name: 'play.test', Type: 1 }] },
    },
  }),
}))

// 页面通过 api.post('/data/LIVE_ROOM/query') 拉取列表，mock 掉 axios 实例
vi.mock('@/api/http', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { code: 200, data: { data: [] } } }),
    post: vi.fn().mockResolvedValue({
      data: { code: 200, data: { total: 0, page: 1, pageSize: 10, data: [] } },
    }),
    put: vi.fn().mockResolvedValue({ data: { code: 200 } }),
    delete: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  },
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-space': true,
  'a-dropdown': true,
  'a-doption': true,
  'a-table-column': true,
  'a-image': true,
  'a-link': true,
}

import LiveRoomList from './LiveRoomList.vue'
import api from '@/api/http'
import { listDomains } from '@/api/live'

function mountPage() {
  return mount(LiveRoomList, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveRoomList (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-room-list').exists()).toBe(true)
  })

  it('onMounted 触发域名列表加载', async () => {
    mountPage()
    await flushPromises()
    expect(listDomains).toHaveBeenCalled()
  })

  it('onMounted 触发直播间列表查询接口', async () => {
    mountPage()
    await flushPromises()
    expect(api.post).toHaveBeenCalled()
    expect(api.post).toHaveBeenCalledWith('/data/LIVE_ROOM/query', expect.objectContaining({ page: 1 }))
  })
})