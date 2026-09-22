import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层（含 useDomainList composable 用到的全部函数）
vi.mock('@/api/live', () => ({
  listDomains: vi.fn().mockResolvedValue({
    data: {
      code: 200,
      data: { domains: [{ Name: 'push.tencent.com', Type: 0, Status: 1, CreateTime: '2026-01-01', TargetDomain: 'push.tencent.com.liveplay.com', Region: '全球加速', BCName: 1 }] },
    },
  }),
  addDomain: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  deleteDomain: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  enableDomain: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  forbidDomain: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  verifyDomainOwner: vi.fn().mockResolvedValue({ data: { code: 200, data: { status: 1 } } }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-input-search': true,
  'a-table-column': true,
  'a-link': true,
  'a-tooltip': true,
  'a-space': true,
  'a-steps': true,
  'a-step': true,
  'a-radio-group': true,
  'a-radio': true,
  'a-alert': true,
}

import LiveDomain from './LiveDomain.vue'
import { listDomains } from '@/api/live'

function mountPage() {
  return mount(LiveDomain, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveDomain (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-domain-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('onMounted 触发域名列表加载(经 useDomainList composable)', async () => {
    mountPage()
    await flushPromises()
    expect(listDomains).toHaveBeenCalled()
  })

  it('渲染页面标题文案', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('liveDomain.title')
    expect(wrapper.text()).toContain('liveDomain.addDomain')
  })
})