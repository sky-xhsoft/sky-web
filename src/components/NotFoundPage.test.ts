import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NotFoundPage from './NotFoundPage.vue'

describe('NotFoundPage', () => {
  it('renders 404 message', () => {
    const wrapper = mount(NotFoundPage)
    expect(wrapper.find('.not-found-code').text()).toBe('404')
  })

  it('renders default title and description', () => {
    const wrapper = mount(NotFoundPage)
    expect(wrapper.find('.not-found-title').text()).toBe('页面不存在')
    expect(wrapper.find('.not-found-desc').text()).toBe('您访问的页面不存在或已被移除')
  })

  it('renders custom title and description', () => {
    const wrapper = mount(NotFoundPage, {
      props: {
        title: '找不到页面',
        description: '请检查URL是否正确',
      },
    })
    expect(wrapper.find('.not-found-title').text()).toBe('找不到页面')
    expect(wrapper.find('.not-found-desc').text()).toBe('请检查URL是否正确')
  })
})