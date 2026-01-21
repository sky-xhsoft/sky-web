<!-- 动态表单项组件 -->
<template>
  <a-form-item
    :field="column.DB_NAME"
    :label="column.DISPLAY_NAME"
    :rules="validationRules"
    :validate-trigger="['blur', 'change']"
    :feedback="!!error"
    :help="error || helpText"
    class="dynamic-form-item"
    :class="formItemClass"
  >
    <!-- 字段渲染器 -->
    <component
      :is="fieldComponent"
      :column="column"
      :model-value="modelValue"
      :disabled="isDisabled"
      :readonly="isReadonly"
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
const CheckboxField = defineAsyncComponent(() => import('../FieldRenderers/CheckboxField.vue'))
const DateField = defineAsyncComponent(() => import('../FieldRenderers/DateField.vue'))
const DatetimeField = defineAsyncComponent(() => import('../FieldRenderers/DatetimeField.vue'))
const ForeignKeyField = defineAsyncComponent(() => import('../FieldRenderers/ForeignKeyField.vue'))

// 组件映射
const COMPONENT_MAP: Record<string, any> = {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  CheckboxField,
  DateField,
  DatetimeField,
  ForeignKeyField
}

// ==================== Props ====================

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  mode?: FormMode
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view'
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
 * 是否禁用
 */
const isDisabled = computed(() => {
  return props.mode === 'view'
})

/**
 * 表单项样式类
 */
const formItemClass = computed(() => {
  return {
    'dynamic-form-item--required': isRequired.value,
    'dynamic-form-item--readonly': isReadonly.value,
    'dynamic-form-item--error': !!props.error,
    [`dynamic-form-item--${props.column.CONTROL_TYPE}`]: true
  }
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
