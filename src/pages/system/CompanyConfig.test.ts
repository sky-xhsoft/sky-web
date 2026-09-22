import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 公司配置 API，避免 onMounted 触发真实 HTTP
vi.mock('@/api/company', () => ({
  getCompanyConfig: vi.fn().mockResolvedValue({
    defaultLanguage: 'zh-CN',
    timezone: 'Asia/Shanghai',
    storageType: 'local',
  }),
  updateCompanyConfig: vi.fn().mockResolvedValue({}),
}))

import CompanyConfig from './CompanyConfig.vue'
import { getCompanyConfig } from '@/api/company'

// 补上本页用到、setup.ts 未 stub 的 Arco 组件
const pageStubs = {
  'a-row': true,
  'a-col': true,
  'a-radio-group': true,
  'a-radio': true,
  'a-divider': true,
  'a-input-number': true,
  'a-input-password': true,
}

function mountPage() {
  return mount(CompanyConfig, {
    global: {
      stubs: pageStubs,
      config: { globalProperties: { t: (key: string) => key } },
    },
  })
}

describe('CompanyConfig (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点与页头', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.company-config-page').exists()).toBe(true)
    expect(wrapper.text()).toContain('公司配置')
  })

  it('onMounted 拉取公司配置', async () => {
    mountPage()
    await flushPromises()
    expect(getCompanyConfig).toHaveBeenCalled()
  })

  it('渲染配置卡片容器', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.v2-card').exists()).toBe(true)
  })
})