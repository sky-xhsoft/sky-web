import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖（useDomainList 内部使用）的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  listDomains: vi.fn().mockResolvedValue({
    data: {
      code: 200,
      data: {
        domains: [
          {
            Name: 'push.test.com',
            Type: 0,
            Status: 1,
            CreateTime: '2024-01-01 10:00:00',
            TargetDomain: 'push.test.com.livepush.com',
            BCName: 1,
          },
        ],
      },
    },
  }),
  addDomain: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  deleteDomain: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  enableDomain: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  forbidDomain: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  verifyDomainOwner: vi.fn().mockResolvedValue({ data: { code: 200, data: { status: 1 } } }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件/图标
const pageStubs = {
  'a-input-search': true,
  'a-table-column': true,
  'a-link': true,
  'a-tooltip': true,
  'a-space': true,
  'a-radio-group': true,
  'a-radio': true,
  'a-steps': true,
  'a-step': true,
  'a-tag': true,
  'a-alert': true,
}

import PushDomain from './PushDomain.vue'
import { listDomains } from '@/api/live'

function mountPage() {
  return mount(PushDomain, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('PushDomain (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.push-domain-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('onMounted 通过 useDomainList 触发域名列表加载', async () => {
    mountPage()
    await flushPromises()
    expect(listDomains).toHaveBeenCalled()
    expect(listDomains).toHaveBeenCalledWith(undefined)
  })

  it('渲染推流域名页面提示(区别于播放域名)', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.page-notice').exists()).toBe(true)
    expect(wrapper.text()).toContain('关于推流域名')
  })
})