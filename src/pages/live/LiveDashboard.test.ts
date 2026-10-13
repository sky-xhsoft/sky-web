import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const setOption = vi.fn()
vi.mock('@/utils/echarts', () => ({
  init: vi.fn(() => ({ setOption, resize: vi.fn(), dispose: vi.fn() })),
}))

vi.mock('@/api/dashboard', () => ({
  getDashboardStats: vi.fn(),
  getDashboardTrend: vi.fn(),
  getRecentRooms: vi.fn(),
  getActivities: vi.fn(),
}))

import LiveDashboard from './LiveDashboard.vue'
import { getDashboardStats, getDashboardTrend, getRecentRooms, getActivities } from '@/api/dashboard'

function mountPage() {
  return mount(LiveDashboard, {
    global: {
      stubs: { 'a-table': { props: ['data'], template: '<div class="rooms">{{ JSON.stringify(data) }}</div>' } },
      config: { globalProperties: { t: (key: string) => key } },
    },
  })
}

const DEMO_NAMES = ['2026 秋季新品发布会', '前端技术分享会', '产品周会', '客户培训']

describe('LiveDashboard（新账号不显示演示数据）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('没有数据时统计为 0、最近直播为空、趋势全为 0', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({ totalRooms: 0, todayLiveSessions: 0, recordingStorage: 0 } as any)
    vi.mocked(getDashboardTrend).mockResolvedValue({ dates: ['2026-10-07', '2026-10-08'], liveSessions: [0, 0], recordings: [0, 0] } as any)
    vi.mocked(getRecentRooms).mockResolvedValue([])
    vi.mocked(getActivities).mockResolvedValue([])
    const wrapper = mountPage()
    await flushPromises()
    const text = wrapper.text()
    for (const name of DEMO_NAMES) expect(text).not.toContain(name)
    expect(text).not.toContain('128')
    expect(wrapper.find('.rooms').text()).toBe('[]')
    const series = setOption.mock.calls.at(-1)?.[0]?.series
    expect(series?.[0].data).toEqual([0, 0])
    expect(series?.[1].data).toEqual([0, 0])
  })

  it('接口失败时显示 --，趋势画空图，不用演示数据', async () => {
    vi.mocked(getDashboardStats).mockRejectedValue(new Error('boom'))
    vi.mocked(getDashboardTrend).mockRejectedValue(new Error('boom'))
    vi.mocked(getRecentRooms).mockRejectedValue(new Error('boom'))
    vi.mocked(getActivities).mockRejectedValue(new Error('boom'))
    const wrapper = mountPage()
    await flushPromises()
    const text = wrapper.text()
    for (const name of DEMO_NAMES) expect(text).not.toContain(name)
    expect(text).toContain('--')
    const series = setOption.mock.calls.at(-1)?.[0]?.series
    expect(series?.[0].data).toEqual([0, 0, 0, 0, 0, 0, 0])
  })

  it('直播场次曲线用 liveSessions、录制文件曲线用 recordings（原先两条线数据放反）', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({ totalRooms: 1, todayLiveSessions: 0, recordingStorage: 0 } as any)
    vi.mocked(getDashboardTrend).mockResolvedValue({ dates: ['2026-10-07'], liveSessions: [3], recordings: [9] } as any)
    vi.mocked(getRecentRooms).mockResolvedValue([])
    vi.mocked(getActivities).mockResolvedValue([])
    mountPage()
    await flushPromises()
    const series = setOption.mock.calls.at(-1)?.[0]?.series
    expect(series?.[0].name).toBe('dashboard.trend.liveSessions')
    expect(series?.[0].data).toEqual([3])
    expect(series?.[1].name).toBe('dashboard.trend.recordings')
    expect(series?.[1].data).toEqual([9])
  })
})
