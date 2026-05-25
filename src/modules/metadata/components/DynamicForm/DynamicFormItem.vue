<!-- 动态表单项组件 -->
<template>
  <a-form-item
    :label="column.DISPLAY_NAME || column.displayName"
    :rules="validationRules"
    :validate-trigger="['blur', 'change']"
    :feedback="!!error"
    :help="error || helpText"
    :label-col-props="labelColProps"
    :wrapper-col-props="wrapperColProps"
    class="dynamic-form-item"
    :class="formItemClass"
    :style="formItemStyle"
  >
    <!-- 字段渲染器 -->
    <component
      :is="fieldComponent"
      :column="column"
      :model-value="modelValue"
      :mode="mode"
      :disabled="isDisabled"
      :readonly="isReadonly"
      :record="record"
      :rows="displayRows"
      :style="fieldStyle"
      @update:model-value="handleChange"
      @blur="handleBlur"
    />

    <!-- 帮助文本（如果没有错误时显示）-->
    <template v-if="!error && helpText" #help>
      <div class="dynamic-form-item__help">
        <icon-info-circle />
        <span>{{ helpText }}</span>
      </div>
    </template>
  </a-form-item>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { IconInfoCircle } from '@arco-design/web-vue/es/icon'
import { useFieldRenderer } from '../../composables'
import type { SysColumn, FormMode, FieldValue } from '../../types'
import ForeignKeyField from '../FieldRenderers/ForeignKeyField.vue'

// 懒加载字段渲染器组件 - 使用与 index.ts 一致的方式
const TextField = defineAsyncComponent(() => import('../FieldRenderers/TextField.vue'))
const TextareaField = defineAsyncComponent(() => import('../FieldRenderers/TextareaField.vue'))
const NumberField = defineAsyncComponent(() => import('../FieldRenderers/NumberField.vue'))
const PasswordField = defineAsyncComponent(() => import('../FieldRenderers/PasswordField.vue'))
const EmailField = defineAsyncComponent(() => import('../FieldRenderers/EmailField.vue'))
const UrlField = defineAsyncComponent(() => import('../FieldRenderers/UrlField.vue'))
const TelephoneField = defineAsyncComponent(() => import('../FieldRenderers/TelephoneField.vue'))
const SelectField = defineAsyncComponent(() => import('../FieldRenderers/SelectField.vue'))
const RadioField = defineAsyncComponent(() => import('../FieldRenderers/RadioField.vue'))
const CheckboxField = defineAsyncComponent(() => import('../FieldRenderers/CheckboxField.vue'))
const SwitchField = defineAsyncComponent(() => import('../FieldRenderers/SwitchField.vue'))
const TagField = defineAsyncComponent(() => import('../FieldRenderers/TagField.vue'))
const CascaderField = defineAsyncComponent(() => import('../FieldRenderers/CascaderField.vue'))
const TreeSelectField = defineAsyncComponent(() => import('../FieldRenderers/TreeSelectField.vue'))
const AutoCompleteField = defineAsyncComponent(() => import('../FieldRenderers/AutoCompleteField.vue'))
const DropDownSelectFilter = defineAsyncComponent(() => import('../FieldRenderers/DropDownSelectFilter.vue'))
const DropMultiSelectFilter = defineAsyncComponent(() => import('../FieldRenderers/DropMultiSelectFilter.vue'))
const DateField = defineAsyncComponent(() => import('../FieldRenderers/DateField.vue'))
const DatetimeField = defineAsyncComponent(() => import('../FieldRenderers/DatetimeField.vue'))
const TimeField = defineAsyncComponent(() => import('../FieldRenderers/TimeField.vue'))
const WeekField = defineAsyncComponent(() => import('../FieldRenderers/WeekField.vue'))
const MonthField = defineAsyncComponent(() => import('../FieldRenderers/MonthField.vue'))
const QuarterField = defineAsyncComponent(() => import('../FieldRenderers/QuarterField.vue'))
const YearField = defineAsyncComponent(() => import('../FieldRenderers/YearField.vue'))
const JsonField = defineAsyncComponent(() => import('../FieldRenderers/JsonField.vue'))
const RichTextField = defineAsyncComponent(() => import('../FieldRenderers/RichTextField.vue'))
const ColorField = defineAsyncComponent(() => import('../FieldRenderers/ColorField.vue'))
const FileField = defineAsyncComponent(() => import('../FieldRenderers/FileField.vue'))
const ImageField = defineAsyncComponent(() => import('../FieldRenderers/ImageField.vue'))
const AvatarField = defineAsyncComponent(() => import('../FieldRenderers/AvatarField.vue'))
const RateField = defineAsyncComponent(() => import('../FieldRenderers/RateField.vue'))
const SliderField = defineAsyncComponent(() => import('../FieldRenderers/SliderField.vue'))
const ProgressField = defineAsyncComponent(() => import('../FieldRenderers/ProgressField.vue'))
const PermissionBitField = defineAsyncComponent(() => import('../FieldRenderers/PermissionBitField.vue'))
const BlankField = defineAsyncComponent(() => import('../FieldRenderers/BlankField.vue'))
const ButtonField = defineAsyncComponent(() => import('../FieldRenderers/ButtonField.vue'))
const HrField = defineAsyncComponent(() => import('../FieldRenderers/HrField.vue'))

// 组件映射 - 与 FIELD_COMPONENT_MAP 保持一致
const COMPONENT_MAP: Record<string, any> = {
  TextField,
  TextareaField,
  NumberField,
  PasswordField,
  EmailField,
  UrlField,
  TelephoneField,
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
  DateField,
  DatetimeField,
  TimeField,
  WeekField,
  MonthField,
  QuarterField,
  YearField,
  ForeignKeyField,
  JsonField,
  RichTextField,
  ColorField,
  FileField,
  ImageField,
  AvatarField,
  RateField,
  SliderField,
  ProgressField,
  PermissionBitField,
  BlankField,
  ButtonField,
  HrField,
  // 别名兼容
  phone: TelephoneField,
  tel: TelephoneField,
  autocomplete: AutoCompleteField,
  tree: TreeSelectField,
  tags: TagField,
  rating: RateField,
  richtext: RichTextField,
  dropdownselect: DropDownSelectFilter,
  dropdownSelect: DropDownSelectFilter,
  dropDownSelect: DropDownSelectFilter,
  dropDownSelectFilter: DropDownSelectFilter,
  dropmultiselect: DropMultiSelectFilter,
  dropMultiSelect: DropMultiSelectFilter,
  dropMultiSelectFilter: DropMultiSelectFilter,
}

// ==================== Props ====================

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  mode?: FormMode
  error?: string
  record?: Record<string, any>  // 完整记录数据，用于FK字段显示
  formColumns?: number  // 表单列数配置（1-4）
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view',
  formColumns: 2  // 默认2列
})

// ==================== Emits ====================

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
  blur: []
}>()

// ==================== 使用 Composable ====================

const {
  componentName,
  isReadonly,
  isRequired,
  helpText,
  validationRules
} = useFieldRenderer(props.column, props.mode)

// ==================== 计算属性 ====================

/**
 * 字段组件
 */
const fieldComponent = computed(() => {
  return COMPONENT_MAP[componentName.value] || TextField
})

/**
 * 标签列配置
 * 当字段跨列时，需要调整标签宽度比例以保持对齐
 */
const labelColProps = computed(() => {
  const displayColsValue = displayCols.value

  if (displayColsValue > 1) {
    const labelSpan = 6 / displayColsValue
    const roundedSpan = Math.round(labelSpan)

    return { span: roundedSpan }
  }

  return undefined
})

/**
 * 输入框列配置
 */
const wrapperColProps = computed(() => {
  const displayColsValue = displayCols.value

  if (displayColsValue > 1) {
    const labelSpan = labelColProps.value?.span || 6
    return { span: 24 - labelSpan }
  }

  return undefined
})

/**
 * 是否禁用
 */
const isDisabled = computed(() => {
  if (props.mode === 'view') {
    return true
  }

  const modifiAble = props.column.MODIFI_ABLE || (props.column as any).modifiAble || (props.column as any).isReadonly
  if (modifiAble === 'N' || modifiAble === true) {
    return true
  }

  return false
})

/**
 * 表单项样式类
 */
const formItemClass = computed(() => {
  const displayType = props.column.DISPLAY_TYPE || (props.column as any).displayType
  const controlType = displayType || props.column.CONTROL_TYPE || (props.column as any).controlType

  return {
    'dynamic-form-item--required': isRequired.value,
    'dynamic-form-item--readonly': isReadonly.value,
    'dynamic-form-item--error': !!props.error,
    'dynamic-form-item--span-multiple': displayCols.value > 1,
    [`dynamic-form-item--${controlType}`]: !!controlType
  }
})

/**
 * 显示列数（控件宽度）
 * 默认 1 列，可通过 DISPLAY_COLS 配置
 */
const displayCols = computed(() => {
  return props.column.DISPLAY_COLS || (props.column as any).displayCols || 1
})

/**
 * 显示行数（控件高度）
 * 默认 1 行，可通过 DISPLAY_ROWS 配置
 */
const displayRows = computed(() => {
  return props.column.DISPLAY_ROWS || (props.column as any).displayRows || 1
})

/**
 * 表单项样式（控制 grid-column）
 */
const formItemStyle = computed(() => {
  if (displayCols.value > 1) {
    return {
      gridColumn: `span ${displayCols.value}`
    }
  }
  return {}
})

/**
 * 字段样式（控制高度）
 */
const fieldStyle = computed(() => {
  const style: Record<string, string> = {}

  const displayType = props.column.DISPLAY_TYPE || (props.column as any).displayType
  const controlType = (displayType || props.column.CONTROL_TYPE || (props.column as any).controlType)?.toLowerCase()

  const multiRowControls = ['textarea', 'json', 'richtext', 'code', 'clob', 'xml']
  if (multiRowControls.includes(controlType) && displayRows.value > 1) {
    const height = displayRows.value * 32 + (displayRows.value - 1) * 8
    style.minHeight = `${height}px`
  }

  return style
})

// ==================== 方法 ====================

/**
 * 值变化处理
 */
function handleChange(value: FieldValue) {
  emit('update:modelValue', value)
}

/**
 * 失焦处理
 */
function handleBlur() {
  emit('blur')
}
</script>

<style scoped>
.dynamic-form-item {
  position: relative;
  padding-top: 3px;
}

.dynamic-form-item--span-multiple :deep(.arco-form-item-label-col) {
  flex: none !important;
}

.dynamic-form-item--span-multiple :deep(.arco-form-item-wrapper-col) {
  flex: 1 1 auto !important;
}

.dynamic-form-item--readonly {
  opacity: 0.8;
}

.dynamic-form-item--error :deep(.arco-form-item-content) {
  border-color: #f5222d;
}

.dynamic-form-item__help {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
}

.dynamic-form-item__help .arco-icon {
  font-size: 14px;
}

.dynamic-form-item--textarea :deep(.arco-textarea) {
  resize: vertical;
}

.dynamic-form-item--checkbox :deep(.arco-form-item-content) {
  display: flex;
  align-items: center;
}

.dynamic-form-item--number :deep(.arco-input-number) {
  width: 100%;
}

.dynamic-form-item--date :deep(.arco-picker),
.dynamic-form-item--datetime :deep(.arco-picker) {
  width: 100%;
}

.dynamic-form-item--select :deep(.arco-select) {
  width: 100%;
}

.dynamic-form-item :deep(.arco-form-item-label) {
  position: relative;
  height: 32px;
  line-height: 32px;
}

.dynamic-form-item :deep(.arco-form-item-label .arco-icon-question-circle) {
  margin-left: 4px;
  font-size: 14px;
  color: var(--color-text-3);
  cursor: help;
}

.dynamic-form-item :deep(.arco-form-item-label .arco-icon-question-circle:hover) {
  color: var(--color-text-2);
}

.dynamic-form-item :deep(.arco-form-item-content) {
  min-height: 32px;
}

.dynamic-form-item :deep(.arco-form-item-message) {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #f5222d;
}

.dynamic-form-item :deep(.arco-input:focus),
.dynamic-form-item :deep(.arco-textarea:focus),
.dynamic-form-item :deep(.arco-select-view-input:focus),
.dynamic-form-item :deep(.arco-picker-input:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(43, 158, 145, 0.1);
}

.dynamic-form-item :deep([disabled]) {
  cursor: not-allowed;
  opacity: 1 !important;
}

.dynamic-form-item :deep(.arco-input[disabled] .arco-input-inner),
.dynamic-form-item :deep(.arco-textarea[disabled] .arco-textarea-inner),
.dynamic-form-item :deep(.arco-select-view[disabled] .arco-select-view-input),
.dynamic-form-item :deep(.arco-picker-input[disabled] input),
.dynamic-form-item :deep(.arco-input.is-disabled .arco-input-inner),
.dynamic-form-item :deep(.arco-textarea.is-disabled .arco-textarea-inner),
.dynamic-form-item :deep(.arco-select-view.is-disabled .arco-select-view-input) {
  color: #333 !important;
  -webkit-text-fill-color: #333 !important;
  background-color: #f7f8fa !important;
}

.dynamic-form-item :deep([readonly]) {
  background: #f7f8fa !important;
  border-color: #e5e6eb !important;
  cursor: default;
}

.dynamic-form-item :deep(.arco-input[readonly] .arco-input-inner),
.dynamic-form-item :deep(.arco-textarea[readonly] .arco-textarea-inner) {
  color: #333 !important;
  -webkit-text-fill-color: #333 !important;
}

.dynamic-form-item :deep(.arco-input-clear-btn),
.dynamic-form-item :deep(.arco-select-clear-btn) {
  font-size: 14px;
  color: var(--color-text-3);
}

.dynamic-form-item :deep(.arco-input-clear-btn:hover),
.dynamic-form-item :deep(.arco-select-clear-btn:hover) {
  color: var(--color-text-2);
}

@media (max-width: 768px) {
  .dynamic-form-item :deep(.arco-form-item-label) {
    height: auto;
    line-height: 1.5;
    padding-bottom: 4px;
  }

  .dynamic-form-item__help {
    font-size: 11px;
  }
}
</style>
