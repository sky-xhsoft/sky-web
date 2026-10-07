import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// 预加载使用 @/api/http 的引用，避免引入时产生副作用；本页 onMounted 不发请求
vi.mock('@/api/http')

import CompanyRegister from './CompanyRegister.vue'

// 补上本页用到、setup.ts 未 stub 的 Arco 组件
const pageStubs = {
  'a-steps': true,
  'a-step': true,
  'a-space': true,
  'a-input-password': true,
}

function mountPage() {
  return mount(CompanyRegister, {
    global: {
      stubs: pageStubs,
      config: { globalProperties: { t: (key: string) => key } },
    },
  })
}

describe('CompanyRegister (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染注册页根节点与卡片', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.auth-wrap').exists()).toBe(true)
    expect(wrapper.find('.register-card').exists()).toBe(true)
  })

  it('默认展示返回按钮与公司信息表单流程', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('register.back')
    expect(wrapper.find('.register-card').exists()).toBe(true)
  })
})