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
describe('CompanyRegister 手机号与用户名校验', () => {
  let api: any
  beforeEach(async () => {
    setActivePinia(createPinia())
    api = (await import('@/api/http')).default
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
  })

  function availability(data: Record<string, boolean>) {
    return { data: { code: 0, data: { usernameTaken: false, phoneValid: true, phoneTaken: false, ...data } } }
  }

  it('手机号格式不对时不查询、不发验证码，并提示', async () => {
    const wrapper = mountPage()
    const vm: any = wrapper.vm
    vm.companyForm.phone = '88888888888'
    await vm.sendSmsCode()
    expect(api.get).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()
    expect(vm.phoneError).toBe('register.company.phoneInvalid')
  })

  it('手机号已注册时仍可获取验证码，但不能进入下一步', async () => {
    vi.mocked(api.get).mockResolvedValue(availability({ phoneTaken: true }))
    vi.mocked(api.post).mockResolvedValue({ data: { code: 0 } })
    const wrapper = mountPage()
    const vm: any = wrapper.vm
    vm.companyForm.phone = '13800000000'
    vm.companyForm.smsVerifyCode = '123456'
    await vm.sendSmsCode()
    expect(api.get).not.toHaveBeenCalled()
    expect(api.post).toHaveBeenCalledWith('/sms/send-code', { phone: '13800000000' })
    await vm.handleNext()
    expect(api.get).toHaveBeenCalledWith('/company/register/check', { params: { phone: '13800000000' } })
    expect(vm.step).toBe(0)
    expect(vm.phoneError).toBe('register.company.phoneTaken')
  })

  it('手机号未注册时进入下一步', async () => {
    vi.mocked(api.get).mockResolvedValue(availability({}))
    const wrapper = mountPage()
    const vm: any = wrapper.vm
    vm.companyForm.phone = ' 13800000000 '
    vm.companyForm.smsVerifyCode = '123456'
    await vm.handleNext()
    expect(api.get).toHaveBeenCalledWith('/company/register/check', { params: { phone: '13800000000' } })
    expect(vm.step).toBe(1)
  })

  it('用户名已被使用时不提交注册', async () => {
    vi.mocked(api.get).mockResolvedValue(availability({ usernameTaken: true }))
    const wrapper = mountPage()
    const vm: any = wrapper.vm
    vm.adminForm.username = 'sajida'
    vm.adminForm.password = vm.adminForm.confirmPassword = 'Pass123!'
    await vm.handleSubmit()
    expect(api.post).not.toHaveBeenCalled()
    expect(vm.usernameError).toBe('register.admin.usernameTaken')
  })
})
