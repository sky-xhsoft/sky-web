<!-- 日期选择器字段渲染器 -->
<template>
  <!-- 查看模式下直接显示格式化日期 -->
  <span v-if="isDisabled || isReadonly" class="date-field-view">
    {{ displayDate || '-' }}
  </span>
  <!-- 编辑模式下显示日期选择器 -->
  <a-date-picker
    v-else
    :model-value="dateValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :allow-clear="allowClear"
    :format="format"
    :picker="picker"
    :show-time="showTime"
    style="width: 100%"
    @update:model-value="handleChange"
    @blur="handleBlur"
  />
</template>

<style scoped>
.date-field-view {
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
const dateValue = computed(() => {
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

// 显示模式 - 从 display_type 判断
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
    default:
      return 'date'
  }
})

// 日期格式 - 从 PROPS 读取或使用默认
const format = computed(() => {
  return fieldProps.value.format || 'YYYY-MM-DD'
})

// 是否显示时间选择
const showTime = computed(() => {
  if (fieldProps.value.showTime !== undefined) {
    return fieldProps.value.showTime
  }
  const displayType = props.column.DISPLAY_TYPE || (props.column as any).displayType
  return displayType?.toLowerCase() === 'datetime'
})

// 查看模式下显示的日期文本
const displayDate = computed(() => {
  if (!props.modelValue) return ''
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
  const lowerType = displayType?.toLowerCase() || 'date'

  switch (lowerType) {
    case 'year':
      emit('update:modelValue', date.getFullYear())
      break
    case 'month':
      emit('update:modelValue', date.toISOString().substring(0, 7))
      break
    case 'quarter':
      const year = date.getFullYear()
      const quarter = Math.floor(date.getMonth() / 3) + 1
      emit('update:modelValue', `${year}-Q${quarter}`)
      break
    case 'time':
      emit('update:modelValue', date.toISOString().substring(11, 19))
      break
    case 'datetime':
      emit('update:modelValue', date.toISOString())
      break
    default:
      emit('update:modelValue', date.toISOString().split('T')[0])
  }
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
