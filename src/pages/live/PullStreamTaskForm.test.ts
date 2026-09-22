import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useNavigationStore } from '@/stores/navigation'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  getPullStreamTasks: vi.fn().mockResolvedValue([]),
  createPullStreamTask: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  updatePullStreamTask: vi.fn().mockResolvedValue({ data: { code: 200 } }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-link': true,
  'a-range-picker': true,
  'a-radio-group': true,
  'a-radio': true,
  'a-textarea': true,
  'a-space': true,
}

import PullStreamTaskForm from './PullStreamTaskForm.vue'
import { getPullStreamTasks } from '@/api/live'

function mountPage() {
  return mount(PullStreamTaskForm, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('PullStreamTaskForm (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染创建任务表单根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.pull-stream-task-form-page').exists()).toBe(true)
  })

  it('创建模式下不触发任务详情加载, 渲染表单容器结构', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(getPullStreamTasks).not.toHaveBeenCalled()
    expect(wrapper.find('.form-container').exists()).toBe(true)
    expect(wrapper.find('.page-header').exists()).toBe(true)
  })

  it('编辑模式下按 taskId 触发任务详情加载', async () => {
    const navigationStore = useNavigationStore()
    navigationStore.current.params = { taskId: 'task-123' }
    mountPage()
    await flushPromises()
    expect(getPullStreamTasks).toHaveBeenCalledWith('task-123')
  })
})