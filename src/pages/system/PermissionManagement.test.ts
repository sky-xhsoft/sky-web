import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 权限矩阵 API，避免 onMounted 触发真实 HTTP
vi.mock('@/api/groups', () => ({
  getPermissionMatrix: vi.fn().mockResolvedValue({
    groups: [{ id: 1, name: '管理员组' }],
    modules: [
      { id: 1, name: '测试目录', type: 'table', directoryId: 10, permissions: [] },
    ],
  }),
}))

import PermissionManagement from './PermissionManagement.vue'
import { getPermissionMatrix } from '@/api/groups'

const pageStubs = {
  'a-table-column': true,
}

function mountPage() {
  return mount(PermissionManagement, {
    global: {
      stubs: pageStubs,
      config: { globalProperties: { t: (key: string) => key } },
    },
  })
}

describe('PermissionManagement (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.permission-management-page').exists()).toBe(true)
  })

  it('onMounted 触发权限矩阵加载', async () => {
    mountPage()
    await flushPromises()
    expect(getPermissionMatrix).toHaveBeenCalled()
  })

  it('渲染权限组标签与矩阵数据', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('管理员组')
    expect(wrapper.text()).toContain('权限矩阵')
  })
})