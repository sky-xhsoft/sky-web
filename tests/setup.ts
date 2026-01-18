/**
 * Vitest 测试设置文件
 * 用于全局配置和 mock
 */

import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// 创建可渲染内容的 stub 组件
const createStub = (name: string) => ({
  name,
  template: '<div><slot /></div>',
})

const createStubWithProps = (name: string) => ({
  name,
  props: Object.keys(Object.getPrototypeOf({})),
  template: '<div><slot /></div>',
})

// 创建支持 visible prop 的 modal stub
const createModalStub = () => ({
  name: 'a-modal',
  props: {
    visible: Boolean,
    title: String,
  },
  template: `
    <div v-if="visible" class="a-modal">
      <div class="a-modal__title">{{ title }}</div>
      <div class="a-modal__body"><slot /></div>
      <div class="a-modal__footer"><slot name="footer" /></div>
    </div>
  `,
})

// 创建支持 description 的 empty stub
const createEmptyStub = () => ({
  name: 'a-empty',
  props: {
    description: String,
  },
  template: '<div class="a-empty"><slot>{{ description }}</slot></div>',
})

// 创建支持 title 和 value 的 statistic stub
const createStatisticStub = () => ({
  name: 'a-statistic',
  props: {
    title: String,
    value: [Number, String],
  },
  template: '<div class="a-statistic"><div class="title">{{ title }}</div><div class="value">{{ value }}</div></div>',
})

// 创建支持 label 的 form-item stub
const createFormItemStub = () => ({
  name: 'a-form-item',
  props: {
    label: String,
    field: String,
  },
  template: '<div class="a-form-item"><label v-if="label">{{ label }}</label><div class="form-item-content"><slot /></div></div>',
})

// 创建 button stub - 渲染为真实的 button 元素
const createButtonStub = () => ({
  name: 'a-button',
  props: {
    loading: Boolean,
    disabled: Boolean,
    type: String,
    size: String,
  },
  template: '<button :disabled="disabled || loading"><slot /></button>',
})

// 全局 stub Arco Design 组件 - 使用可渲染的 stub
config.global.stubs = {
  'a-modal': createModalStub(),
  'a-form': createStub('a-form'),
  'a-form-item': createFormItemStub(),
  'a-input': createStubWithProps('a-input'),
  'a-input-password': createStubWithProps('a-input-password'),
  'a-select': createStubWithProps('a-select'),
  'a-option': createStubWithProps('a-option'),
  'a-button': createButtonStub(),
  'a-space': createStub('a-space'),
  'a-tag': createStubWithProps('a-tag'),
  'a-statistic': createStatisticStub(),
  'a-empty': createEmptyStub(),
  'a-spin': createStub('a-spin'),
  'a-table': createStubWithProps('a-table'),
  'a-table-column': createStubWithProps('a-table-column'),
  'a-drawer': createStubWithProps('a-drawer'),
  'a-tree': createStubWithProps('a-tree'),
  'icon-refresh': { template: '<span>🔄</span>' },
  'icon-link': { template: '<span>🔗</span>' },
  'icon-lock': { template: '<span>🔒</span>' },
  'icon-clock-circle': { template: '<span>🕒</span>' },
  'icon-copy': { template: '<span>📋</span>' },
  'icon-edit': { template: '<span>✏️</span>' },
  'icon-eye': { template: '<span>👁️</span>' },
  'icon-delete': { template: '<span>🗑️</span>' },
  'icon-share-alt': { template: '<span>📤</span>' },
}

// 全局 mock Arco Design Message
vi.mock('@arco-design/web-vue', () => ({
  Message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  Modal: {
    confirm: vi.fn(),
    open: vi.fn(),
  },
}))
