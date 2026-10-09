import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useNavigationStore } from '@/stores/navigation'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求
vi.mock('@/api/live', () => ({
  getPullStreamTasks: vi.fn().mockResolvedValue([]),
  createPullStreamTask: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  updatePullStreamTask: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  generatePullURLByRoom: vi.fn().mockResolvedValue({ data: { data: { flv: 'http://play.test/live/82.flv', rtmp: 'rtmp://play.test/live/82' } } }),
}))

// 直播源下拉：当前公司的直播间
vi.mock('@/api/http', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: { data: { data: [{ ID: 82, ROOM_NAME: '秋季发布会', STATUS: 'live', START_TIME: '2026-10-15 19:00:00', END_TIME: '2026-10-15 21:00:00' }] } },
    }),
  },
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件；表单内容需要渲染出来
const pageStubs = {
  'a-range-picker': true,
  'a-radio-group': true,
  'a-radio': true,
  'a-textarea': true,
  'a-input-password': true,
  'a-form': { template: '<form><slot /></form>' },
  'a-form-item': { template: '<div><slot /></div>' },
}

import PullStreamTaskForm from './PullStreamTaskForm.vue'
import { getPullStreamTasks, generatePullURLByRoom } from '@/api/live'

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
    vi.clearAllMocks()
  })

  it('挂载后渲染创建任务表单根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.pull-stream-task-form-page').exists()).toBe(true)
  })

  it('创建模式下不触发任务详情加载，渲染页头、表单与预览', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(getPullStreamTasks).not.toHaveBeenCalled()
    expect(wrapper.find('.ptf-title').text()).toBe('创建分发任务')
    expect(wrapper.find('.ptf-body').exists()).toBe(true)
    expect(wrapper.find('.ptf-preview').exists()).toBe(true)
  })

  it('编辑模式下按 taskId 触发任务详情加载', async () => {
    const navigationStore = useNavigationStore()
    navigationStore.current.params = { taskId: 'task-123' }
    const wrapper = mountPage()
    await flushPromises()
    expect(getPullStreamTasks).toHaveBeenCalledWith('task-123')
    expect(wrapper.find('.ptf-title').text()).toBe('编辑分发任务')
  })

  it('从直播间进入时默认选中该直播间，并取其播放地址作为直播源', async () => {
    const navigationStore = useNavigationStore()
    navigationStore.current.params = { roomId: '82' }
    const wrapper = mountPage()
    await flushPromises()
    expect(generatePullURLByRoom).toHaveBeenCalledWith('82')
    const preview = wrapper.find('.ptf-flow').text()
    expect(preview).toContain('秋季发布会')
    expect(preview).toContain('http://play.test/live/82.flv')
  })

  it('选择平台后预览中的分发目标同步为该平台', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const kuaishou = wrapper.findAll('.ptf-platform')[1]
    await kuaishou.trigger('click')
    expect(kuaishou.classes()).toContain('is-active')
    expect(wrapper.findAll('.ptf-node-name')[1].text()).toBe('快手')
  })
})
