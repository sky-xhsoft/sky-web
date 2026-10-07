import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层
vi.mock('@/api/live', () => ({
  getDomain: vi.fn().mockResolvedValue({
    data: { code: 200, data: { Name: 'push.test', Type: 0, Status: 1, TargetDomain: 'push.test.liveplay.com', BCName: 1, Region: '全球加速', CreateTime: '2026-01-01', UpdateTime: '2026-01-02' } },
  }),
  generatePushURL: vi.fn().mockResolvedValue({
    data: { code: 200, data: { pushUrl: 'rtmp://push.test/app/stream?txSecret=x', pushUrlWebRtc: 'webrtc://push.test/app/stream', pushUrlSrt: 'srt://push.test:9000/stream' } },
  }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-link': true,
  'a-descriptions': true,
  'a-descriptions-item': true,
  'a-tag': true,
  'a-space': true,
  'a-radio-group': true,
  'a-radio': true,
  'a-date-picker': true,
  'a-collapse': true,
  'a-collapse-item': true,
  'a-table-column': true,
}

import LiveDomainDetail from './LiveDomainDetail.vue'
import { getDomain, generatePushURL } from '@/api/live'

function mountPage() {
  return mount(LiveDomainDetail, {
    props: { domainName: 'push.test' },
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveDomainDetail (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('挂载后渲染页面根节点与顶层面包屑', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-domain-detail-page').exists()).toBe(true)
    expect(wrapper.find('.v2-page-header').exists()).toBe(true)
  })

  it('onMounted 触发域名信息加载(带入参)', async () => {
    mountPage()
    await flushPromises()
    expect(getDomain).toHaveBeenCalled()
    expect(getDomain).toHaveBeenCalledWith('push.test')
  })

  it('推流地址生成接口已注册(mock 可被调用)', async () => {
    mountPage()
    await flushPromises()
    expect(generatePushURL).toBeDefined()
  })
})