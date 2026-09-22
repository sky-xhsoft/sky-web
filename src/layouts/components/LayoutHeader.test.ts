import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LayoutHeader from './LayoutHeader.vue'

describe('LayoutHeader', () => {
  const defaultProps = {
    rootMenus: [
      { key: '/cloud', title: '云盘' },
      { key: '/live', title: '直播' },
    ],
    rootSelectedKeys: ['/cloud'],
  }

  it('renders brand title and subtitle', () => {
    const wrapper = mount(LayoutHeader, { props: defaultProps })
    expect(wrapper.find('.brand-title').text()).toBe('Zigebo')
    expect(wrapper.find('.brand-subtitle').exists()).toBe(true)
  })

  it('accepts custom brand title', () => {
    const wrapper = mount(LayoutHeader, {
      props: { ...defaultProps, brandTitle: '我的应用' },
    })
    expect(wrapper.find('.brand-title').text()).toBe('我的应用')
  })

  it('emits home event when brand clicked', async () => {
    const wrapper = mount(LayoutHeader, { props: defaultProps })
    await wrapper.find('.brand-area').trigger('click')
    expect(wrapper.emitted('home')).toBeTruthy()
  })

  it('emits home event when Enter key pressed', async () => {
    const wrapper = mount(LayoutHeader, { props: defaultProps })
    await wrapper.find('.brand-area').trigger('keydown.enter')
    expect(wrapper.emitted('home')).toBeTruthy()
  })

  it('brand area has aria-label for accessibility', () => {
    const wrapper = mount(LayoutHeader, { props: defaultProps })
    const brand = wrapper.find('.brand-area')
    expect(brand.attributes('aria-label')).toBeTruthy()
    expect(brand.attributes('role')).toBe('button')
    expect(brand.attributes('tabindex')).toBe('0')
  })

  it('root menu bar has navigation role', () => {
    const wrapper = mount(LayoutHeader, { props: defaultProps })
    const nav = wrapper.find('.root-menu-bar')
    expect(nav.attributes('role')).toBe('navigation')
  })
})