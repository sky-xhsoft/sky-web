import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  getOnlineStreams: vi.fn().mockResolvedValue({
    data: { code: 200, data: { onlineInfo: [{ streamName: 'stream-1', domainName: 'push.test', appName: 'live' }], totalNum: 1 } },
  }),
  getHistoryStreams: vi.fn().mockResolvedValue({
    data: { code: 200, data: { historyInfo: [] } },
  }),
  listDomains: vi.fn().mockResolvedValue({
    data: { code: 200, data: { domains: [{ Name: 'push.test', Type: 0 }, { Name: 'play.test', Type: 1 }] } },
  }),
  dropStream: vi.fn().mockResolvedValue({ data: { code: 0 } }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-radio-group': true,
  'a-radio': true,
  'a-input-search': true,
  'a-link': true,
  'a-space': true,
  'a-table-column': true,
}

import LiveStream from './LiveStream.vue'
import { getOnlineStreams, listDomains } from '@/api/live'

// 页面模板直接用 t(...)，靠全局 property 注入（setup.ts 未注册，这里补上）
function mountPage() {
  return mount(LiveStream, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveStream (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-stream-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('onMounted 触发域名与在线流加载', async () => {
    mountPage()
    await flushPromises()
    expect(listDomains).toHaveBeenCalled()
    expect(getOnlineStreams).toHaveBeenCalled()
  })

  it('指标弹窗/按钮已移除(回归: 页面不再展示假的流指标)', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.metrics-grid').exists()).toBe(false)
    expect(wrapper.find('a-modal[title="流实时指标"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('流实时指标')
  })
})