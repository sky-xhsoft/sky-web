import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// 页面通过 api 实例读写数据；默认(新增)模式下 onMounted 不触发接口调用，仍 mock 以防编辑模式
vi.mock('@/api/http', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { code: 200, data: { data: { ROOM_NAME: 'x' } } } }),
    post: vi.fn().mockResolvedValue({ data: { code: 200 } }),
    put: vi.fn().mockResolvedValue({ data: { code: 200 } }),
  },
}))

// 补上 setup.ts 未 stub、本页用到的 Arco 组件
const pageStubs = {
  'a-space': true,
  'a-alert': true,
  'a-row': true,
  'a-col': true,
  'a-radio-group': true,
  'a-radio': true,
  'a-date-picker': true,
  'a-upload': true,
  'a-image': true,
}

import LiveRoomForm from './LiveRoomForm.vue'
import api from '@/api/http'

// 渲染表单内部内容（全局 setup 把 a-form 存根为空节点），文件夹选择不发请求
const formContentStubs = {
  'a-form': { template: '<form><slot /></form>' },
  'a-form-item': { template: '<div><slot /></div>' },
  CloudFolderSelect: true,
}

function mountPage(props: { roomId?: string } = {}, extraStubs: Record<string, unknown> = {}) {
  return mount(LiveRoomForm, {
    props,
    global: {
      stubs: { ...pageStubs, ...extraStubs },
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('LiveRoomForm (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('挂载后渲染页面根节点(新增模式)', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.live-room-form').exists()).toBe(true)
  })

  it('新增模式下不触发数据加载接口', async () => {
    mountPage()
    await flushPromises()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('编辑模式下 onMounted 触发数据加载', async () => {
    mountPage({ roomId: 'room-x' })
    await flushPromises()
    expect(api.get).toHaveBeenCalled()
  })

  it('新增模式：页头为创建直播间，预览显示默认名称与横屏', async () => {
    const wrapper = mountPage({}, formContentStubs)
    await flushPromises()
    expect(wrapper.find('.lrf-title').text()).toBe('liveRoomForm.pageTitleCreate')
    expect(wrapper.find('.lrf-preview-name').text()).toBe('liveRoomForm.previewNoName')
    expect(wrapper.find('.lrf-cover-badge').text()).toBe('liveRoomForm.displayModeLandscape')
  })

  it('点击显示方式卡片后预览角标同步变化', async () => {
    const wrapper = mountPage({}, formContentStubs)
    await flushPromises()
    const portrait = wrapper.findAll('.lrf-mode')[1]
    await portrait.trigger('click')
    expect(portrait.classes()).toContain('is-active')
    expect(wrapper.find('.lrf-cover-badge').text()).toBe('liveRoomForm.displayModePortrait')
  })

  it('编辑模式：页头为编辑直播间，预览显示已有名称', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { code: 200, data: { ROOM_NAME: '年会直播', DISPLAY_MODE: 'portrait' } } } as any)
    const wrapper = mountPage({ roomId: 'room-1' }, formContentStubs)
    await flushPromises()
    expect(wrapper.find('.lrf-title').text()).toBe('liveRoomForm.pageTitleEdit')
    expect(wrapper.find('.lrf-preview-name').text()).toBe('年会直播')
    expect(wrapper.find('.lrf-cover-badge').text()).toBe('liveRoomForm.displayModePortrait')
  })
})
