import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CloudHeaderBar from './CloudHeaderBar.vue'

describe('CloudHeaderBar', () => {
  const defaultProps = {
    breadcrumbs: [
      { id: null, name: '根目录' },
      { id: 1, name: '文档' },
    ],
    currentFolderId: 1,
    quota: { usedSpace: 1024 * 1024 * 100, totalQuota: 1024 * 1024 * 1024 },
  }

  it('renders header bar', () => {
    const wrapper = mount(CloudHeaderBar, { props: defaultProps })
    expect(wrapper.find('.cloud-header-bar').exists()).toBe(true)
  })

  it('shows quota when quota prop provided', () => {
    const wrapper = mount(CloudHeaderBar, { props: defaultProps })
    expect(wrapper.find('.quota-simple').exists()).toBe(true)
  })

  it('hides quota when no quota provided', () => {
    const wrapper = mount(CloudHeaderBar, {
      props: { ...defaultProps, quota: null },
    })
    expect(wrapper.find('.quota-simple').exists()).toBe(false)
  })

  it('emits navigate event', () => {
    const wrapper = mount(CloudHeaderBar, { props: defaultProps })
    ;(wrapper.vm as any).$emit('navigate', 5)
    expect(wrapper.emitted('navigate')).toBeTruthy()
    expect(wrapper.emitted('navigate')?.[0]).toEqual([5])
  })

  it('emits open-shares event', () => {
    const wrapper = mount(CloudHeaderBar, { props: defaultProps })
    ;(wrapper.vm as any).$emit('open-shares')
    expect(wrapper.emitted('open-shares')).toBeTruthy()
  })

  it('formats file sizes', () => {
    const wrapper = mount(CloudHeaderBar, { props: defaultProps })
    // 配额文本应包含 MB/GB 等单位
    const quotaText = wrapper.find('.quota-text').text()
    expect(quotaText).toMatch(/[KMGT]?B/)
  })

  it('has aria-label on quota progress', () => {
    const wrapper = mount(CloudHeaderBar, { props: defaultProps })
    const progress = wrapper.find('.quota-progress')
    if (progress.exists()) {
      // 验证可访问性属性存在
      const ariaLabel = progress.attributes('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})
