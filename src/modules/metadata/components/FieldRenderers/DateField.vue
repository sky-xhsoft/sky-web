<!-- 日期选择器字段渲染器 -->
<template>
  <!-- 查看模式下直接显示格式化日期 -->
  <span v-if="disabled || readonly" class="date-field-view">
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

// 查看模式下显示的日期文本
const displayDate = computed(() => {
  if (!props.modelValue) return ''
  const date = new Date(props.modelValue as string)
  return date.toLocaleDateString('zh-CN')
})

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
