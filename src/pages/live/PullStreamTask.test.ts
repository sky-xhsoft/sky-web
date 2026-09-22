import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// 中立化 echarts（本页图表仅状态弹窗打开时初始化，挂载阶段不会触发）
vi.mock('echarts', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn(), resize: vi.fn() })),
  graphic: { LinearGradient: vi.fn() },
}))

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  getPullStreamTasks: vi.fn().mockResolvedValue([]),
  updatePullStreamTask: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  deletePullStreamTask: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  getPullStreamTaskStatus: vi.fn().mockResolvedValue({ runStatus: 'active' }),
  restartPullStreamTask: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  describePullTransformPushInfoList: vi.fn().mockResolvedValue({
    dataInfoList: [],
  }),
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-space': true,
  'a-input-search': true,
  'a-table-column': true,
  'a-link': true,
  'a-range-picker': true,
}

import PullStreamTask from './PullStreamTask.vue'
import { getPullStreamTasks } from '@/api/live'

function mountPage() {
  return mount(PullStreamTask, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('PullStreamTask (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.pull-stream-task-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('onMounted 触发拉流转推任务列表加载', async () => {
    mountPage()
    await flushPromises()
    expect(getPullStreamTasks).toHaveBeenCalled()
  })

  it('渲染页面标题与创建入口文案', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.v2-page-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('社媒分发')
    expect(wrapper.text()).toContain('创建分发任务')
  })
})