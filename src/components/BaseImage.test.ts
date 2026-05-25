import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseImage from './BaseImage.vue'

describe('BaseImage', () => {
  it('renders with src', () => {
    const wrapper = mount(BaseImage, {
      props: { src: '/test.jpg' },
    })
    expect(wrapper.find('.base-image').exists()).toBe(true)
  })

  it('renders alt text', () => {
    const wrapper = mount(BaseImage, {
      props: { src: '/test.jpg', alt: 'Test image' },
    })
    const img = wrapper.find('img')
    expect(img.attributes('alt')).toBe('Test image')
  })

  it('applies width and height', () => {
    const wrapper = mount(BaseImage, {
      props: { src: '/test.jpg', width: '100px', height: '200px' },
    })
    const el = wrapper.find('.base-image').element as HTMLElement
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('200px')
  })

  it('sets loading="lazy" by default', () => {
    const wrapper = mount(BaseImage, {
      props: { src: '/test.jpg' },
    })
    const img = wrapper.find('img')
    expect(img.attributes('loading')).toBe('lazy')
  })

  it('sets loading="eager" when lazy=false', () => {
    const wrapper = mount(BaseImage, {
      props: { src: '/test.jpg', lazy: false },
    })
    const img = wrapper.find('img')
    expect(img.attributes('loading')).toBe('eager')
  })

  it('applies object-fit class', () => {
    const wrapper = mount(BaseImage, {
      props: { src: '/test.jpg', objectFit: 'contain' },
    })
    const img = wrapper.find('img')
    expect(img.classes()).toContain('object-fit-contain')
  })
})