/**
 * 字段渲染器组件 - 入口
 *
 * 使用懒加载方式导入所有字段渲染器组件
 */

import { defineAsyncComponent } from 'vue'

// 基础输入类
export const TextField = defineAsyncComponent(() => import('./TextField.vue'))
export const TextareaField = defineAsyncComponent(() => import('./TextareaField.vue'))
export const NumberField = defineAsyncComponent(() => import('./NumberField.vue'))

// 选择类
export const SelectField = defineAsyncComponent(() => import('./SelectField.vue'))
export const RadioField = defineAsyncComponent(() => import('./RadioField.vue'))
export const CheckboxField = defineAsyncComponent(() => import('./CheckboxField.vue'))
export const SwitchField = defineAsyncComponent(() => import('./SwitchField.vue'))

// 日期时间类
export const DateField = defineAsyncComponent(() => import('./DateField.vue'))
export const DatetimeField = defineAsyncComponent(() => import('./DatetimeField.vue'))
export const TimeField = defineAsyncComponent(() => import('./TimeField.vue'))

// 关联类
export const ForeignKeyField = defineAsyncComponent(() => import('./ForeignKeyField.vue'))

// 高级编辑器类
export const JsonField = defineAsyncComponent(() => import('./JsonField.vue'))
export const RichTextField = defineAsyncComponent(() => import('./RichTextField.vue'))

// 特殊输入类
export const ColorField = defineAsyncComponent(() => import('./ColorField.vue'))

// 组件映射表
export const FIELD_RENDERER_MAP = {
  // 基础输入类
  TextField,
  TextareaField,
  NumberField,

  // 选择类
  SelectField,
  RadioField,
  CheckboxField,
  SwitchField,

  // 日期时间类
  DateField,
  DatetimeField,
  TimeField,

  // 关联类
  ForeignKeyField,

  // 高级编辑器类
  JsonField,
  RichTextField,

  // 特殊输入类
  ColorField
}

// 类型定义
export type FieldRendererType = keyof typeof FIELD_RENDERER_MAP

/**
 * 获取字段渲染器组件
 * @param type 字段类型
 * @returns 字段渲染器组件
 */
export function getFieldRenderer(type: string) {
  return FIELD_RENDERER_MAP[type as FieldRendererType] || TextField
}
