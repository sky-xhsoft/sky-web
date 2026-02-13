<!-- 文本输入框字段渲染器 -->
<template>
  <a-input
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :max-length="maxLength"
    :allow-clear="allowClear"
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

// 占位符
const placeholder = computed(() => {
  return props.column.PLACEHOLDER || `请输入${props.column.DISPLAY_NAME}`
})

// 最大长度
const maxLength = computed(() => {
  return props.column.LENGTH || undefined
})

// 是否显示清除按钮
const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

// 是否自动转大写
const isUppercase = computed(() => {
  return props.column.IS_UPPERCASE === 'Y' || (props.column as any).isUppercase === 'Y'
})

// 值变化处理
function handleChange(value: string | undefined) {
  let processedValue = value || null

  // 如果配置了自动转大写，则转换为大写
  if (processedValue && isUppercase.value) {
    processedValue = processedValue.toUpperCase()
  }

  emit('update:modelValue', processedValue)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
