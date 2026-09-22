import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TableView from './TableView.vue'

// a-card 详情与说明文案都在其默认插槽内，用可透传插槽的 stub 以便断言文本
const pageStubs = {
  'a-card': { template: '<div><slot /></div>' },
}

function mountPage() {
  return mount(TableView, {
    global: {
      stubs: pageStubs,
      config: { globalProperties: { t: (key: string) => key } },
    },
  })
}

describe('TableView (页面组件挂载)', () => {
  it('挂载后渲染页面根节点', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('.table-view').exists()).toBe(true)
    expect(wrapper.text()).not.toBe('')
  })

  it('渲染元数据表占位说明文案', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('这里将展示表')
    expect(wrapper.text()).toContain('列表/表单')
  })
})