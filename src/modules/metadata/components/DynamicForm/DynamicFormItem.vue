<!-- 动态表单项组件 -->
<template>
  <a-form-item
    :field="column.DB_NAME"
    :label="column.DISPLAY_NAME"
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

// 懒加载字段渲染器组件
const TextField = defineAsyncComponent(() => import('../FieldRenderers/TextField.vue'))
const TextareaField = defineAsyncComponent(() => import('../FieldRenderers/TextareaField.vue'))
const NumberField = defineAsyncComponent(() => import('../FieldRenderers/NumberField.vue'))
const SelectField = defineAsyncComponent(() => import('../FieldRenderers/SelectField.vue'))
const RadioField = defineAsyncComponent(() => import('../FieldRenderers/RadioField.vue'))
const CheckboxField = defineAsyncComponent(() => import('../FieldRenderers/CheckboxField.vue'))
const DateField = defineAsyncComponent(() => import('../FieldRenderers/DateField.vue'))
const DatetimeField = defineAsyncComponent(() => import('../FieldRenderers/DatetimeField.vue'))
const TimeField = defineAsyncComponent(() => import('../FieldRenderers/TimeField.vue'))
const ForeignKeyField = defineAsyncComponent(() => import('../FieldRenderers/ForeignKeyField.vue'))
const JsonField = defineAsyncComponent(() => import('../FieldRenderers/JsonField.vue'))
const RichTextField = defineAsyncComponent(() => import('../FieldRenderers/RichTextField.vue'))
const SwitchField = defineAsyncComponent(() => import('../FieldRenderers/SwitchField.vue'))
const ColorField = defineAsyncComponent(() => import('../FieldRenderers/ColorField.vue'))
const BlankField = defineAsyncComponent(() => import('../FieldRenderers/BlankField.vue'))
const ButtonField = defineAsyncComponent(() => import('../FieldRenderers/ButtonField.vue'))
const HrField = defineAsyncComponent(() => import('../FieldRenderers/HrField.vue'))
const FileField = defineAsyncComponent(() => import('../FieldRenderers/FileField.vue'))
const ImageField = defineAsyncComponent(() => import('../FieldRenderers/ImageField.vue'))

// 组件映射
const COMPONENT_MAP: Record<string, any> = {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  RadioField,
  CheckboxField,
  DateField,
  DatetimeField,
  TimeField,
  ForeignKeyField,
  JsonField,
  RichTextField,
  SwitchField,
  ColorField,
  BlankField,
  ButtonField,
  HrField,
  FileField,
  ImageField
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
  placeholder,
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
    // 跨列字段的标签 span = 6 / 跨列数
    // 例如：跨2列的字段，标签占 6/2=3 span
    // 这样标签宽度 = 3/24 * (2*colWidth)/24 = 6/24 * colWidth/24，与单列字段的标签宽度一致
    const labelSpan = 6 / displayColsValue
    const roundedSpan = Math.round(labelSpan)

    return { span: roundedSpan }
  }

  // 单列字段：使用默认配置（继承父级，6 span）
  return undefined
})

/**
 * 输入框列配置
 */
const wrapperColProps = computed(() => {
  const displayColsValue = displayCols.value

  if (displayColsValue > 1) {
    // 输入框占剩余空间
    const labelSpan = labelColProps.value?.span || 6
    return { span: 24 - labelSpan }
  }

  // 单列字段：使用默认配置（继承父级，18 span）
  return undefined
})

/**
 * 是否禁用
 */
const isDisabled = computed(() => {
  return props.mode === 'view'
})

/**
 * 表单项样式类
 */
const formItemClass = computed(() => {
  // 获取控件类型（优先 DISPLAY_TYPE）
  const displayType = props.column.DISPLAY_TYPE || (props.column as any).displayType
  const controlType = displayType || props.column.CONTROL_TYPE || (props.column as any).controlType

  return {
    'dynamic-form-item--required': isRequired.value,
    'dynamic-form-item--readonly': isReadonly.value,
    'dynamic-form-item--error': !!props.error,
    'dynamic-form-item--span-multiple': displayCols.value > 1,  // 跨列字段
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
  // 如果列数大于 1，使用 grid-column 跨列
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

  // 获取控件类型（优先 DISPLAY_TYPE）
  const displayType = props.column.DISPLAY_TYPE || (props.column as any).displayType
  const controlType = (displayType || props.column.CONTROL_TYPE || (props.column as any).controlType)?.toLowerCase()

  // 根据行数设置高度
  // 对于支持多行的控件（textarea, json, richtext, code, clob），设置高度
  const multiRowControls = ['textarea', 'json', 'richtext', 'code', 'clob', 'xml']
  if (multiRowControls.includes(controlType) && displayRows.value > 1) {
    // 每行约 32px（输入框标准高度），加上间距
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

/* 跨列字段：标签和输入框布局 */
.dynamic-form-item--span-multiple :deep(.arco-form-item-label-col) {
  flex: none !important;
}

.dynamic-form-item--span-multiple :deep(.arco-form-item-wrapper-col) {
  flex: 1 1 auto !important;
}

/* 只读字段样式 */
.dynamic-form-item--readonly {
  opacity: 0.8;
}

/* 错误状态 */
.dynamic-form-item--error :deep(.arco-form-item-content) {
  border-color: #f5222d;
}

/* 帮助文本样式 */
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

/* 文本域字段 - 占满整行 */
.dynamic-form-item--textarea :deep(.arco-textarea) {
  resize: vertical;
}

/* 复选框字段 - 特殊布局 */
.dynamic-form-item--checkbox :deep(.arco-form-item-content) {
  display: flex;
  align-items: center;
}

/* 数字字段 - 限制宽度 */
.dynamic-form-item--number :deep(.arco-input-number) {
  width: 100%;
}

/* 日期字段 - 全宽 */
.dynamic-form-item--date :deep(.arco-picker),
.dynamic-form-item--datetime :deep(.arco-picker) {
  width: 100%;
}

/* 选择器字段 - 全宽 */
.dynamic-form-item--select :deep(.arco-select) {
  width: 100%;
}

/* 表单项标签样式优化 */
.dynamic-form-item :deep(.arco-form-item-label) {
  position: relative;
  height: 32px;
  line-height: 32px;
}

/* Tooltip 图标样式 */
.dynamic-form-item :deep(.arco-form-item-label .arco-icon-question-circle) {
  margin-left: 4px;
  font-size: 14px;
  color: var(--color-text-3);
  cursor: help;
}

.dynamic-form-item :deep(.arco-form-item-label .arco-icon-question-circle:hover) {
  color: var(--color-text-2);
}

/* 表单项内容区域 */
.dynamic-form-item :deep(.arco-form-item-content) {
  min-height: 32px;
}

/* 错误消息样式 */
.dynamic-form-item :deep(.arco-form-item-message) {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #f5222d;
}

/* 输入框焦点样式 */
.dynamic-form-item :deep(.arco-input:focus),
.dynamic-form-item :deep(.arco-textarea:focus),
.dynamic-form-item :deep(.arco-select-view-input:focus),
.dynamic-form-item :deep(.arco-picker-input:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(43, 158, 145, 0.1);
}

/* 禁用状态统一样式 */
.dynamic-form-item :deep([disabled]) {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 只读状态统一样式 */
.dynamic-form-item :deep([readonly]) {
  background: #f5f5f5;
  border-color: #e8e8e8;
  cursor: default;
}

/* 清除按钮样式 */
.dynamic-form-item :deep(.arco-input-clear-btn),
.dynamic-form-item :deep(.arco-select-clear-btn) {
  font-size: 14px;
  color: var(--color-text-3);
}

.dynamic-form-item :deep(.arco-input-clear-btn:hover),
.dynamic-form-item :deep(.arco-select-clear-btn:hover) {
  color: var(--color-text-2);
}

/* 响应式调整 */
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
