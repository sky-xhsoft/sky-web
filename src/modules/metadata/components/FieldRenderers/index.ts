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
export const PasswordField = defineAsyncComponent(() => import('./PasswordField.vue'))
export const EmailField = defineAsyncComponent(() => import('./EmailField.vue'))
export const UrlField = defineAsyncComponent(() => import('./UrlField.vue'))
export const TelephoneField = defineAsyncComponent(() => import('./TelephoneField.vue'))

// 选择类
export const SelectField = defineAsyncComponent(() => import('./SelectField.vue'))
export const RadioField = defineAsyncComponent(() => import('./RadioField.vue'))
export const CheckboxField = defineAsyncComponent(() => import('./CheckboxField.vue'))
export const SwitchField = defineAsyncComponent(() => import('./SwitchField.vue'))
export const TagField = defineAsyncComponent(() => import('./TagField.vue'))
export const CascaderField = defineAsyncComponent(() => import('./CascaderField.vue'))
export const TreeSelectField = defineAsyncComponent(() => import('./TreeSelectField.vue'))
export const AutoCompleteField = defineAsyncComponent(() => import('./AutoCompleteField.vue'))
export const DropDownSelectFilter = defineAsyncComponent(() => import('./DropDownSelectFilter.vue'))
export const DropMultiSelectFilter = defineAsyncComponent(() => import('./DropMultiSelectFilter.vue'))

// 日期时间类
export const DateField = defineAsyncComponent(() => import('./DateField.vue'))
export const DatetimeField = defineAsyncComponent(() => import('./DatetimeField.vue'))
export const TimeField = defineAsyncComponent(() => import('./TimeField.vue'))
export const WeekField = defineAsyncComponent(() => import('./WeekField.vue'))
export const MonthField = defineAsyncComponent(() => import('./MonthField.vue'))
export const QuarterField = defineAsyncComponent(() => import('./QuarterField.vue'))
export const YearField = defineAsyncComponent(() => import('./YearField.vue'))

// 关联类
export const ForeignKeyField = defineAsyncComponent(() => import('./ForeignKeyField.vue'))

// 高级编辑器类
export const JsonField = defineAsyncComponent(() => import('./JsonField.vue'))
export const RichTextField = defineAsyncComponent(() => import('./RichTextField.vue'))

// 特殊输入类
export const ColorField = defineAsyncComponent(() => import('./ColorField.vue'))
export const FileField = defineAsyncComponent(() => import('./FileField.vue'))
export const ImageField = defineAsyncComponent(() => import('./ImageField.vue'))
export const AvatarField = defineAsyncComponent(() => import('./AvatarField.vue'))
export const RateField = defineAsyncComponent(() => import('./RateField.vue'))
export const SliderField = defineAsyncComponent(() => import('./SliderField.vue'))
export const ProgressField = defineAsyncComponent(() => import('./ProgressField.vue'))

// 权限管理类
export const PermissionBitField = defineAsyncComponent(() => import('./PermissionBitField.vue'))

// 布局和交互类
export const BlankField = defineAsyncComponent(() => import('./BlankField.vue'))
export const ButtonField = defineAsyncComponent(() => import('./ButtonField.vue'))
export const HrField = defineAsyncComponent(() => import('./HrField.vue'))

// 组件映射表
export const FIELD_RENDERER_MAP = {
  // 基础输入类
  TextField,
  TextareaField,
  NumberField,
  PasswordField,
  EmailField,
  UrlField,
  TelephoneField,

  // 选择类
  SelectField,
  RadioField,
  CheckboxField,
  SwitchField,
  TagField,
  CascaderField,
  TreeSelectField,
  AutoCompleteField,
  DropDownSelectFilter,
  DropMultiSelectFilter,

  // 日期时间类
  DateField,
  DatetimeField,
  TimeField,
  WeekField,
  MonthField,
  QuarterField,
  YearField,

  // 关联类
  ForeignKeyField,

  // 高级编辑器类
  JsonField,
  RichTextField,

  // 特殊输入类
  ColorField,
  FileField,
  ImageField,
  AvatarField,
  RateField,
  SliderField,
  ProgressField,

  // 权限管理类
  PermissionBitField,

  // 布局和交互类
  BlankField,
  ButtonField,
  HrField
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
