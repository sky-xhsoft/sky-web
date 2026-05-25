import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CloudDragOverlay from './CloudDragOverlay.vue'

describe('CloudDragOverlay', () => {
  it('hides when visible is false', () => {
    const wrapper = mount(CloudDragOverlay, { props: { visible: false } })
    expect(wrapper.find('.drag-overlay').exists()).toBe(false)
  })

  it('shows when visible is true', () => {
    const wrapper = mount(CloudDragOverlay, { props: { visible: true } })
    expect(wrapper.find('.drag-overlay').exists()).toBe(true)
  })

  it('has dialog role for accessibility', () => {
    const wrapper = mount(CloudDragOverlay, { props: { visible: true } })
    const overlay = wrapper.find('.drag-overlay')
    expect(overlay.attributes('role')).toBe('dialog')
    expect(overlay.attributes('aria-label')).toBeTruthy()
  })

  it('renders i18n text', () => {
    const wrapper = mount(CloudDragOverlay, { props: { visible: true } })
    const content = wrapper.find('.drag-overlay-content')
    expect(content.text()).toContain('cloud.dropFiles')
  })
})