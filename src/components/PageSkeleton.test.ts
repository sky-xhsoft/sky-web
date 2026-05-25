import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageSkeleton from './PageSkeleton.vue'

describe('PageSkeleton', () => {
  it('renders with default type "generic"', () => {
    const wrapper = mount(PageSkeleton)
    expect(wrapper.find('.page-skeleton').exists()).toBe(true)
    expect(wrapper.find('.skeleton-generic').exists()).toBe(true)
  })

  it('renders form variant', () => {
    const wrapper = mount(PageSkeleton, { props: { type: 'form' } })
    expect(wrapper.find('.skeleton-form').exists()).toBe(true)
    expect(wrapper.find('.skeleton-table').exists()).toBe(false)
  })

  it('renders table variant', () => {
    const wrapper = mount(PageSkeleton, { props: { type: 'table' } })
    expect(wrapper.find('.skeleton-table').exists()).toBe(true)
    expect(wrapper.find('.skeleton-form').exists()).toBe(false)
  })

  it('renders card variant', () => {
    const wrapper = mount(PageSkeleton, { props: { type: 'card' } })
    expect(wrapper.find('.skeleton-card').exists()).toBe(true)
  })

  it('renders list variant', () => {
    const wrapper = mount(PageSkeleton, { props: { type: 'list' } })
    expect(wrapper.find('.skeleton-list').exists()).toBe(true)
    // list 应该有 5 个项
    expect(wrapper.findAll('.skeleton-list-item')).toHaveLength(5)
  })

  it('always shows header skeleton', () => {
    const wrapper = mount(PageSkeleton, { props: { type: 'card' } })
    expect(wrapper.find('.skeleton-header').exists()).toBe(true)
  })
})
