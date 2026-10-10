import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
// 按中文语言包翻译（全局测试设置中 t 原样返回键名，这里需要断言实际文案）
vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  const zh = (await import('@/locales/zh-CN')).default as Record<string, any>
  const t = (key: string) => key.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), zh) ?? key
  return { ...actual, useI18n: () => ({ t, locale: { value: 'zh-CN' } }) }
})

import Welcome from './Welcome.vue'

function mountPage() {
  return mount(Welcome, { global: { stubs: { LanguageSwitcher: true } } })
}

describe('Welcome 欢迎页', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    push.mockClear()
  })

  it('渲染导航、Hero 与两大系统介绍', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.welcome-page').exists()).toBe(true)
    expect(wrapper.find('.hero-section').exists()).toBe(true)
    expect(wrapper.findAll('.product').length).toBe(2)
    expect(wrapper.text()).toContain('视频系统')
    expect(wrapper.text()).toContain('云盘系统')
    expect(wrapper.text()).toContain('大文件分片直传')
  })

  it('不让用户选择平台，也不展示系统中心', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).not.toContain('系统中心')
    expect(wrapper.text()).not.toContain('选择您的平台')
    expect(wrapper.find('#platforms').exists()).toBe(false)
  })

  it('登录按钮进入登录页（不带平台类型，登录页可切换系统）', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const login = wrapper.findAll('button').find((b) => b.text().includes('登录'))!
    await login.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'login' })
  })
})
