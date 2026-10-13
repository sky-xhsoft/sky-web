import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求（改密/登出由用户触发，挂载阶段不调用）
vi.mock('@/api/auth', () => ({
  changePassword: vi.fn().mockResolvedValue({ data: { code: 200 } }),
}))

// setup.ts 未 stub、UserProfile 用到的 Arco 组件
const pageStubs = {
  'a-radio-group': true,
  'a-radio': true,
  'a-input-password': true,
}

import UserProfile from './UserProfile.vue'
import { useAuthStore } from '@/stores/auth'

function mountPage() {
  return mount(UserProfile, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('UserProfile（个人信息与账号卡片）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('修改密码：两次新密码不一致时校验能结束并保持弹窗（原先确认密码校验永不返回，确定按钮一直转圈）', async () => {
    const { Form, FormItem } = await import('@arco-design/web-vue')
    const { changePassword } = await import('@/api/auth')
    const wrapper = mount(UserProfile, {
      global: {
        stubs: { ...pageStubs, 'a-form': Form, 'a-form-item': FormItem, 'a-modal': { template: '<div><slot /></div>' } },
        config: { globalProperties: { t: (key: string) => key } },
      },
    })
    await flushPromises()
    const vm = wrapper.vm as any
    Object.assign(vm.passwordForm, { oldPassword: 'Old12345', newPassword: 'New12345', confirmPassword: 'Other123' })
    const run = vm.handleConfirmChangePassword as () => Promise<boolean>
    expect(vm.passwordFormRef).toBeTruthy()
    const result = await Promise.race([run(), new Promise((r) => setTimeout(() => r('timeout'), 1000))])
    expect(result).toBe(false)
    expect(changePassword).not.toHaveBeenCalled()

    vm.passwordForm.confirmPassword = 'New12345'
    const ok = await Promise.race([run(), new Promise((r) => setTimeout(() => r('timeout'), 1000))])
    expect(ok).not.toBe('timeout')
    expect(changePassword).toHaveBeenCalledWith({ oldPassword: 'Old12345', newPassword: 'New12345' })
  })

  it('显示姓名、账号、角色与公司', async () => {
    const auth = useAuthStore()
    auth.user = { id: 30, username: 'CLX', trueName: '陈立新', isAdmin: 'Y', phone: '15300000000' } as any
    auth.company = { name: '安徽先桦科技有限公司' } as any
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.up-name').text()).toBe('陈立新')
    expect(wrapper.find('.up-role').text()).toBe('userCenter.admin')
    expect(wrapper.find('.up-kv').text()).toContain('CLX')
    expect(wrapper.find('.up-kv').text()).toContain('安徽先桦科技有限公司')
  })

  it('IS_ADMIN 为 N 时显示为成员（原先非空即判为管理员）', async () => {
    useAuthStore().user = { id: 31, username: 'lisi', isAdmin: 'N' } as any
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.up-role').text()).toBe('userCenter.member')
  })

  it('不再显示无法保存的时区、货币设置', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).not.toContain('userProfile.timezone')
    expect(wrapper.text()).not.toContain('userProfile.currency')
  })

  it('用户资料语言为小写 zh-cn 时也能选中简体中文', async () => {
    useAuthStore().user = { id: 30, username: 'CLX', isAdmin: 'Y', language: 'zh-cn' } as any
    const wrapper = mount(UserProfile, {
      global: {
        stubs: { ...pageStubs, 'a-radio-group': { props: ['modelValue'], template: '<div class="lang" :data-value="modelValue"><slot /></div>' } },
        config: { globalProperties: { t: (key: string) => key } },
      },
    })
    await flushPromises()
    expect(wrapper.find('.lang').attributes('data-value')).toBe('zh-CN')
  })
})
