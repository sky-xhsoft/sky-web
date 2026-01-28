<!-- 多行文本输入框字段渲染器 -->
<template>
  <a-textarea
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :max-length="maxLength"
    :show-word-limit="showWordLimit"
    :rows="rows"
    :allow-clear="allowClear"
    :auto-size="autoSize"
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
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  rows: 4
})

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
  blur: []
}>()

// 占位符
const placeholder = computed(() => {
  return props.column.PLACEHOLDER || `请输入${props.column.DISPLAY_NAME}`
})

// 最大长度
const maxLength = computed(() => {
  return props.column.LENGTH || undefined
})

// 显示字数统计
const showWordLimit = computed(() => {
  return !!props.column.LENGTH
})

// 是否显示清除按钮
const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

// 自动调整高度
const autoSize = computed(() => {
  // 优先使用 DISPLAY_ROWS，其次使用 props.rows
  const minRows = props.column.DISPLAY_ROWS || props.rows
  return {
    minRows: minRows,
    maxRows: Math.max(minRows, 10)
  }
})

// 值变化处理
function handleChange(value: string | undefined) {
  emit('update:modelValue', value || null)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
