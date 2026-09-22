import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock 页面依赖的 API 层，避免真实 HTTP 请求（这些函数直接返回数据而非 {data} 包裹）
vi.mock('@/api/dashboard', () => ({
  getDashboardStats: vi.fn().mockResolvedValue({
    totalRooms: 3,
    todayLiveSessions: 1,
    usedStorage: 1024,
    groupCount: 2,
  }),
  getDashboardTrend: vi.fn().mockResolvedValue({
    dates: ['08-01'],
    liveSessions: [1],
    recordings: [2],
  }),
  getRecentRooms: vi
    .fn()
    .mockResolvedValue([{ id: 1, roomName: 'room-1', status: 'live', startTime: null, viewerCount: 0 }]),
  getActivities: vi
    .fn()
    .mockResolvedValue([{ id: 1, username: 'u1', action: 'act', resource: 'res', resourceName: 'rn', createdAt: '' }]),
}))

// Mock ECharts，避免在 jsdom 中真正初始化 canvas 图表
vi.mock('echarts', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn(), resize: vi.fn(), on: vi.fn() })),
}))

// setup.ts 未 stub 的 V2 封装组件，统一中立化
const pageStubs = {
  V2PageHeader: true,
  V2Card: true,
  V2Button: true,
  V2Tag: true,
}

import Dashboard from './Dashboard.vue'
import { getDashboardStats, getDashboardTrend } from '@/api/dashboard'

function mountPage() {
  return mount(Dashboard, {
    global: {
      stubs: pageStubs,
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('Dashboard (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点与容器结构', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.dashboard-page').exists()).toBe(true)
    expect(wrapper.find('.dashboard-grid-4').exists()).toBe(true)
  })

  it('onMounted 触发统计与趋势数据加载', async () => {
    mountPage()
    await flushPromises()
    expect(getDashboardStats).toHaveBeenCalled()
    expect(getDashboardTrend).toHaveBeenCalled()
  })

  it('渲染快速开始与趋势图容器', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.dashboard-grid-3').exists()).toBe(true)
    expect(wrapper.find('.quick-start-card').exists()).toBe(true)
  })
})