<!-- 日期时间选择器字段渲染器 -->
<template>
  <!-- 只读/禁用模式：显示格式化文本 -->
  <span v-if="isDisabled || isReadonly" class="datetime-field-view">
    {{ formattedDateTime || '-' }}
  </span>

  <!-- 编辑模式：显示日期选择器 -->
  <a-date-picker
    v-else
    :model-value="dateTimeValue"
    :placeholder="placeholder"
    :allow-clear="allowClear"
    :format="format"
    :show-time="showTime"
    :picker="picker"
    style="width: 100%"
    @update:model-value="handleChange"
    @blur="handleBlur"
  />
</template>

<style scoped>
.datetime-field-view {
  display: inline-block;
  padding: 4px 0;
  color: #333;
  line-height: 24px;
  min-height: 32px;
  display: flex;
  align-items: center;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useFieldRendererBase } from '../../composables'
import type { SysColumn, FieldValue, FormMode } from '../../types'
import { formatDateTime } from '@/utils/format'

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  mode?: FormMode
  disabled?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
  blur: []
}>()

const { placeholder, isReadonly, isDisabled, allowClear, formatValue, fieldProps } = useFieldRendererBase(props)

// 转换为日期对象
const dateTimeValue = computed(() => {
  if (!props.modelValue) return undefined
  if (props.modelValue instanceof Date) return props.modelValue

  try {
    const date = new Date(props.modelValue as string)
    if (!isNaN(date.getTime())) {
      return date
    }
  } catch {
    // 忽略错误
  }
  return undefined
})

// 显示模式
const picker = computed(() => {
  const displayType = props.column.DISPLAY_TYPE || (props.column as any).displayType
  const lowerType = displayType?.toLowerCase() || 'date'
  switch (lowerType) {
    case 'week':
      return 'week'
    case 'month':
      return 'month'
    case 'quarter':
      return 'quarter'
    case 'year':
      return 'year'
    case 'time':
      return 'time'
    case 'datetime':
      return 'date'
    default:
      return 'date'
  }
})

// 日期时间格式
const format = computed(() => {
  const displayType = props.column.DISPLAY_TYPE || (props.column as any).displayType
  const lowerType = displayType?.toLowerCase() || 'datetime'

  if (fieldProps.value.format) {
    return fieldProps.value.format
  }

  switch (lowerType) {
    case 'time':
      return 'HH:mm:ss'
    default:
      return 'YYYY-MM-DD HH:mm:ss'
  }
})

// 显示时间选择
const showTime = computed(() => {
  if (fieldProps.value.showTime !== undefined) {
    return fieldProps.value.showTime
  }
  const displayType = props.column.DISPLAY_TYPE || (props.column as any).displayType
  const lowerType = displayType?.toLowerCase() || 'datetime'
  return lowerType === 'datetime'
})

// 格式化的日期时间文本（用于只读/禁用模式）
const formattedDateTime = computed(() => {
  if (!props.modelValue) return ''
  // 使用统一的 formatValue 进行格式化
  return formatValue(props.modelValue)
})

// 值变化处理
function handleChange(value: Date | string | number | undefined) {
  if (!value) {
    emit('update:modelValue', null)
    return
  }

  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) {
    emit('update:modelValue', null)
    return
  }

  const displayType = props.column.DISPLAY_TYPE || (props.column as any).displayType
  const lowerType = displayType?.toLowerCase() || 'datetime'

  switch (lowerType) {
    case 'time':
      emit('update:modelValue', date.toISOString().substring(11, 19))
      break
    case 'datetime':
    default:
      emit('update:modelValue', date.toISOString())
  }
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
