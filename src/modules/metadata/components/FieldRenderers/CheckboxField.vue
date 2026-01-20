<!-- 复选框字段渲染器 -->
<template>
  <a-checkbox
    :model-value="checked"
    :disabled="disabled"
    @update:model-value="handleChange"
  >
    {{ label }}
  </a-checkbox>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SysColumn, FieldValue } from '../../types'

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  disabled?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
}>()

// 转换为布尔值
const checked = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return false
  }
  // 支持多种格式: Y/N, 1/0, true/false
  const value = String(props.modelValue)
  return value === 'Y' || value === '1' || value === 'true' || props.modelValue === true
})

// 标签文本
const label = computed(() => {
  return props.label || props.column.HELP_TEXT || ''
})

// 值变化处理
function handleChange(value: boolean) {
  // 根据数据类型返回对应格式
  if (props.column.DATA_TYPE === 'char') {
    emit('update:modelValue', value ? 'Y' : 'N')
  } else if (props.column.DATA_TYPE === 'int') {
    emit('update:modelValue', value ? 1 : 0)
  } else {
    emit('update:modelValue', value)
  }
}
</script>
