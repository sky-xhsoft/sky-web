import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 云盘 API 层，避免真实 HTTP 请求。
// 本页 onMounted 会 dispatch store.loadShares() -> getMyShares，需 mock。
vi.mock('@/modules/cloud/api', () => ({
  getMyShares: vi.fn().mockResolvedValue([
    {
      id: 1,
      shareCode: 'SHARE-1',
      resourceType: 'file',
      resourceId: 10,
      sharerId: 1,
      shareType: 'public',
      fileName: 'demo.pdf',
      password: '',
      createTime: '2026-09-01 10:00:00',
      expireTime: null,
      maxDownloads: 100,
      downloadCount: 0,
      viewCount: 0,
    },
  ]),
  createFileShare: vi.fn(),
  createFolderShare: vi.fn(),
  deleteShare: vi.fn(),
  updateShare: vi.fn(),
  fetchFolders: vi.fn(),
  fetchItems: vi.fn(),
  getQuota: vi.fn(),
  createItem: vi.fn(),
  deleteItem: vi.fn(),
  renameItem: vi.fn(),
  moveItem: vi.fn(),
  cloudApi: {},
}))

// 本页从 cloud 组件包里只用到两个对话框，整包 mock 成轻量桩，
// 避免加载 30+ 个真实云盘组件及其重依赖。
vi.mock('@/modules/cloud/components', () => ({
  EditShareDialog: { name: 'EditShareDialog', template: '<div class="edit-share-dialog" />' },
  ShareStatsDialog: { name: 'ShareStatsDialog', template: '<div class="share-stats-dialog" />' },
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-input-search': true,
  'a-space': true,
  'a-dropdown': true,
  'a-doption': true,
  'a-tag': true,
}

import CloudShareManager from './CloudShareManager.vue'
import { getMyShares } from '@/modules/cloud/api'

// 页面模板直接用 t(...)，靠全局 property 注入（setup.ts 未注册，这里补上）
function mountPage() {
  return mount(CloudShareManager, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('CloudShareManager (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.cloud-share-manager-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('onMounted 触发分享列表加载(getMyShares)', async () => {
    mountPage()
    await flushPromises()
    expect(getMyShares).toHaveBeenCalledTimes(1)
  })

  it('加载后渲染分享条目, 页面特征文本存在', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.share-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('cloud.myShares')
  })
})