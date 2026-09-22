import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Cloud.vue 是一个纯包装页，仅渲染 <CloudView />。
// 完整 CloudView 内部会挂载约 10 个子组件 + 9 个懒加载对话框，并驱动
// 上传/拖拽/搜索等 composable，onMounted 即发起真实 HTTP(refreshAll)。
// 页面挂载测试中将该子视图整包替换为轻量桩，聚焦于页面根骨架可挂载。
vi.mock('@/modules/cloud', () => ({
  CloudView: {
    name: 'CloudView',
    template: '<div class="cloud-view-stub">cloud-view</div>',
  },
}))

import Cloud from './Cloud.vue'

// 页面模板直接用 t(...)，靠全局 property 注入
function mountPage() {
  return mount(Cloud, {
    global: {
      config: {
        globalProperties: { t: (key: string) => key },
      },
    },
  })
}

describe('Cloud (页面组件挂载)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.cloud-page').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('渲染子视图 CloudView', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.cloud-view-stub').exists()).toBe(true)
    expect(wrapper.find('.cloud-view-stub').text()).toBe('cloud-view')
  })
})