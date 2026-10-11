import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/api/liveTemplate', () => ({ createCosBucket: vi.fn() }))

import CreateCosBucketModal from './CreateCosBucketModal.vue'
import { createCosBucket } from '@/api/liveTemplate'

const mountModal = (props: Record<string, unknown>) => mount(CreateCosBucketModal, { props: { visible: true, ...props } })

describe('CreateCosBucketModal 新建存储桶', () => {
  beforeEach(() => vi.mocked(createCosBucket).mockReset())

  it('默认地域取公司配置的地域，没有时用 ap-nanjing', () => {
    expect((mountModal({ defaultRegion: 'ap-shanghai' }).vm as any).form.region).toBe('ap-shanghai')
    expect((mountModal({ defaultRegion: 'ap-nanjin' }).vm as any).form.region).toBe('ap-nanjing')
  })

  it('地域选项包含账号已有地域与常用地域', () => {
    const opts = (mountModal({ regions: ['ap-mumbai'] }).vm as any).regionOptions.map((o: any) => o.value)
    expect(opts).toContain('ap-mumbai')
    expect(opts).toContain('ap-nanjing')
  })

  it('提交名称与地域，创建成功后通知并关闭', async () => {
    const created = { bucket: 'live-rec', fullName: 'live-rec-1504307838', region: 'ap-nanjing', creationDate: '', company: false }
    vi.mocked(createCosBucket).mockResolvedValue(created)
    const wrapper = mountModal({ appId: '1504307838', defaultRegion: 'ap-nanjing' })
    const vm = wrapper.vm as any
    vm.form.bucket = ' live-rec '
    vm.formRef = { validate: async () => undefined }
    await vm.submit()
    await flushPromises()
    expect(createCosBucket).toHaveBeenCalledWith({ bucket: 'live-rec', region: 'ap-nanjing' })
    expect(wrapper.emitted('created')?.[0]).toEqual([created])
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
  })
})
