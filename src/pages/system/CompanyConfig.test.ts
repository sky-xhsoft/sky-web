import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// 公司 50 的实际情况：存储类型为空、COS 地址已填但区域为空，直播密钥已设置，未配置火山引擎
const conf50 = {
  storageType: '',
  tencentCosBucketUrl: 'https://skyyihan-1497211701.cos.ap-guangzhou.myqcloud.com',
  tencentCosBucketName: 'skyyihan-1497211701',
  tencentCosRegion: '',
  tencentCosSecretId: '',
  tencentCosSecretKey: '',
  tencentCloudSecretId: 'AKID****Q2mA',
  tencentCloudSecretKey: 'abcd****wxyz',
  tencentCloudRegion: 'ap-guangzhou',
  tencentCloudCallbackKey: '',
  volcengineAccessKeyId: '',
  volcengineAccessKeySecret: '',
  volcengineRegion: '',
}

vi.mock('@/api/company', () => ({
  getCompanyConfig: vi.fn(),
  updateCompanyConfig: vi.fn().mockResolvedValue({}),
}))

import CompanyConfig from './CompanyConfig.vue'
import { getCompanyConfig } from '@/api/company'

const pageStubs = {
  'a-radio-group': true,
  'a-radio': true,
  'a-input-password': true,
  'a-link': true,
  'a-spin': { template: '<div><slot /></div>' },
  // 全局 setup 把 a-input 存根为空节点，这里渲染成可输入的 input
  'a-input': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `<input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
  },
}

function mountPage(isAdmin: 'Y' | 'N') {
  useAuthStore().user = { id: 30, username: 'CLX', isAdmin } as any
  return mount(CompanyConfig, { global: { stubs: pageStubs } })
}

describe('CompanyConfig（公司配置折叠面板）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getCompanyConfig).mockResolvedValue({ ...conf50 } as any)
  })

  it('按与后端一致的规则计算各项状态：存储类型为空按 COS，区域从地址识别', async () => {
    const wrapper = mountPage('Y')
    await flushPromises()
    const heads = wrapper.findAll('.cc-item-head').map((h) => h.text().replace(/\s+/g, ' '))
    expect(heads[0]).toContain('腾讯云直播')
    expect(heads[0]).toContain('已配置')
    expect(heads[0]).toContain('回调密钥未设置')
    expect(heads[1]).toContain('云盘存储')
    expect(heads[1]).toContain('已配置')
    expect(heads[1]).toContain('腾讯云 COS · ap-guangzhou')
    // 火山引擎为平台全局配置，公司配置只剩两项
    expect(heads).toHaveLength(2)
    expect(wrapper.text()).not.toContain('AI 同传')
  })

  it('管理员默认展开第一个需要处理的项（均已配置时不展开），并且无修改时不提交任何字段', async () => {
    const wrapper = mountPage('Y')
    await flushPromises()
    expect(wrapper.find('.cc-item.is-open').exists()).toBe(false)
    expect((wrapper.vm as any).payload).toEqual({})

    vi.mocked(getCompanyConfig).mockResolvedValue({ ...conf50, storageType: 'tencentCOS', tencentCosBucketUrl: '', tencentCosBucketName: '' } as any)
    const second = mountPage('Y')
    await flushPromises()
    expect(second.find('.cc-item.is-open .cc-item-title').text()).toBe('云盘存储')
  })

  it('非管理员只显示状态，不能展开编辑', async () => {
    const wrapper = mountPage('N')
    await flushPromises()
    expect(wrapper.text()).toContain('仅管理员可修改')
    await wrapper.findAll('.cc-item-head')[1].trigger('click')
    expect(wrapper.find('.cc-item-body').exists()).toBe(false)
  })

  it('修改 Bucket 地址后同步名称与区域，并明确写入存储类型', async () => {
    const wrapper = mountPage('Y')
    await flushPromises()
    await wrapper.findAll('.cc-item-head')[1].trigger('click')
    const urlInput = wrapper.find('.cc-item-body input')
    await urlInput.setValue('https://newbucket-1300000000.cos.ap-shanghai.myqcloud.com')
    await flushPromises()
    expect((wrapper.vm as any).payload).toMatchObject({
      tencentCosBucketUrl: 'https://newbucket-1300000000.cos.ap-shanghai.myqcloud.com',
      tencentCosBucketName: 'newbucket-1300000000',
      tencentCosRegion: 'ap-shanghai',
      storageType: 'tencentCOS',
    })
  })
})
