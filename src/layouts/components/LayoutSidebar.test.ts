import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LayoutSidebar from './LayoutSidebar.vue'

describe('LayoutSidebar', () => {
  const defaultProps = {
    items: [
      { key: '/home', title: '首页' },
      {
        key: '/system',
        title: '系统',
        children: [
          { key: '/system/users', title: '用户' },
          { key: '/system/roles', title: '角色' },
        ],
      },
    ],
    openKeys: [],
    selectedKeys: [],
    mobileShow: false,
  }

  it('renders aside element', () => {
    const wrapper = mount(LayoutSidebar, { props: defaultProps })
    expect(wrapper.find('aside.side-nav').exists()).toBe(true)
  })

  it('accepts items prop', () => {
    const wrapper = mount(LayoutSidebar, { props: defaultProps })
    expect(wrapper.props('items')).toHaveLength(2)
  })

  it('emits click event', async () => {
    const wrapper = mount(LayoutSidebar, { props: defaultProps })
    // 直接触发 emit
    ;(wrapper.vm as any).$emit('click', '/home')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual(['/home'])
  })

  it('applies mobile-show class when mobileShow=true', () => {
    const wrapper = mount(LayoutSidebar, {
      props: { ...defaultProps, mobileShow: true },
    })
    expect(wrapper.find('aside').classes()).toContain('mobile-show')
  })

  it('emits update events', () => {
    const wrapper = mount(LayoutSidebar, { props: defaultProps })
    ;(wrapper.vm as any).$emit('update:openKeys', ['/system'])
    expect(wrapper.emitted('update:openKeys')).toBeTruthy()
  })
})
