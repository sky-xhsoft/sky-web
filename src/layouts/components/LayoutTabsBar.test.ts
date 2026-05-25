import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LayoutTabsBar from './LayoutTabsBar.vue'

describe('LayoutTabsBar', () => {
  const defaultProps = {
    tabs: [
      { key: 'home', title: '首页', componentName: 'HomeDashboard', params: {} },
      { key: 'cloud', title: '云盘', componentName: 'Cloud', params: {} },
    ],
    activeTabKey: 'home',
    sidebarCollapsed: false,
  }

  it('renders sidebar toggle button', () => {
    const wrapper = mount(LayoutTabsBar, { props: defaultProps })
    expect(wrapper.find('.sidebar-toggle').exists()).toBe(true)
  })

  it('sidebar toggle has aria-label', () => {
    const wrapper = mount(LayoutTabsBar, { props: defaultProps })
    const toggle = wrapper.find('.sidebar-toggle')
    expect(toggle.attributes('aria-label')).toBeTruthy()
    expect(toggle.attributes('role')).toBe('button')
  })

  it('emits toggle-sidebar when toggle clicked', async () => {
    const wrapper = mount(LayoutTabsBar, { props: defaultProps })
    await wrapper.find('.sidebar-toggle').trigger('click')
    expect(wrapper.emitted('toggle-sidebar')).toBeTruthy()
  })

  it('emits toggle-sidebar on Enter key', async () => {
    const wrapper = mount(LayoutTabsBar, { props: defaultProps })
    await wrapper.find('.sidebar-toggle').trigger('keydown.enter')
    expect(wrapper.emitted('toggle-sidebar')).toBeTruthy()
  })

  it('accepts collapsed state prop', () => {
    const wrapper = mount(LayoutTabsBar, {
      props: { ...defaultProps, sidebarCollapsed: true },
    })
    expect(wrapper.props('sidebarCollapsed')).toBe(true)
  })
})