<!-- 日期选择器字段渲染器 -->
<template>
  <a-date-picker
    :model-value="dateValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :allow-clear="allowClear"
    :format="format"
    style="width: 100%"
    @update:model-value="handleChange"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SysColumn, FieldValue } from '../../types'

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
const dateValue = computed(() => {
  if (!props.modelValue) return undefined
  if (props.modelValue instanceof Date) return props.modelValue
  return new Date(props.modelValue as string)
})

// 占位符
const placeholder = computed(() => {
  return props.column.PLACEHOLDER || '请选择日期'
})

// 是否显示清除按钮
const allowClear = computed(() => {
  return props.column.NULL_ABLE === 'Y'
})

// 日期格式
const format = computed(() => 'YYYY-MM-DD')

// 值变化处理
function handleChange(value: Date | string | number | undefined) {
  if (!value) {
    emit('update:modelValue', null)
    return
  }

  // 转换为 ISO 日期字符串
  const date = value instanceof Date ? value : new Date(value)
  const dateStr = date.toISOString().split('T')[0]
  emit('update:modelValue', dateStr)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
