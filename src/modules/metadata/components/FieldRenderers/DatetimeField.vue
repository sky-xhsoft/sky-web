<!-- 日期时间选择器字段渲染器 -->
<template>
  <!-- 只读/禁用模式：使用 Input 显示格式化文本 -->
  <a-input
    v-if="disabled || readonly"
    :model-value="formattedDateTime"
    :disabled="true"
    :readonly="true"
    style="width: 100%"
  />

  <!-- 编辑模式：显示日期选择器 -->
  <a-date-picker
    v-else
    :model-value="dateTimeValue"
    :placeholder="placeholder"
    :allow-clear="allowClear"
    :format="format"
    :show-time="showTime"
    style="width: 100%"
    @update:model-value="handleChange"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SysColumn, FieldValue } from '../../types'
import { formatDateTime } from '@/utils/format'

interface Props {
  column: SysColumn
  modelValue?: FieldValue
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

// 转换为日期对象
const dateTimeValue = computed(() => {
  if (!props.modelValue) return undefined
  if (props.modelValue instanceof Date) return props.modelValue

  // 处理后端返回的时间字符串（如 2024-01-20T03:29:15.632+0800）
  const dateStr = props.modelValue as string
  const date = new Date(dateStr)

  // 验证日期是否有效
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', dateStr)
    return undefined
  }

  return date
})

// 占位符
const placeholder = computed(() => {
  return props.column.PLACEHOLDER || '请选择日期时间'
})

// 是否显示清除按钮
const allowClear = computed(() => {
  return props.column.NULL_ABLE === 'Y'
})

// 日期时间格式
const format = computed(() => 'YYYY-MM-DD HH:mm:ss')

// 显示时间选择
const showTime = computed(() => ({
  format: 'HH:mm:ss',
  defaultValue: '00:00:00'
}))

// 格式化的日期时间文本（用于只读/禁用模式）
const formattedDateTime = computed(() => {
  return formatDateTime(props.modelValue)
})

// 值变化处理
function handleChange(value: Date | string | number | undefined) {
  if (!value) {
    emit('update:modelValue', null)
    return
  }

  // 转换为 ISO 日期时间字符串
  const date = value instanceof Date ? value : new Date(value)
  emit('update:modelValue', date.toISOString())
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
