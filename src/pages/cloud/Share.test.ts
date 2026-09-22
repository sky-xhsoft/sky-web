import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 分享访问 API 层，避免真实 HTTP 请求。
vi.mock('@/modules/cloud/api/share', () => ({
  getShareInfo: vi.fn().mockResolvedValue({
    share: { shareType: 'password', code: 'CODE-1', expireTime: null },
    resourceType: 'file',
    file: { id: 1, name: 'demo.pdf', size: 1024 },
    folder: null,
  }),
  accessShare: vi.fn().mockResolvedValue({}),
  downloadShareFile: vi.fn().mockResolvedValue(undefined),
  getShareFolderContent: vi.fn().mockResolvedValue({ folders: [], files: [] }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-input-password': true,
  'a-space': true,
}

import Share from './Share.vue'
import { getShareInfo } from '@/modules/cloud/api/share'

// 页面模板直接用 t(...)，靠全局 property 注入
function mountPage() {
  return mount(Share, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('Share (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点, 未抛错', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.share-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('路由未提供分享码时展示错误页(稳定回归)', async () => {
    const wrapper = mountPage()
    await flushPromises()
    // setup.ts 中 vue-router useRoute 返回 params: {} => shareCode 为空 => 进入 notFound 分支
    expect(wrapper.find('#errorPage').exists()).toBe(true)
    expect(wrapper.text()).toContain('share.notFound.title')
  })

  it('mock 的分享信息 API 可正常返回数据', async () => {
    const info = await getShareInfo('CODE-1')
    expect(info.share.shareType).toBe('password')
    expect(info.resourceType).toBe('file')
  })
})