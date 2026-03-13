<!-- 数字输入框字段渲染器 -->
<template>
  <!-- 查看模式下直接显示文本 -->
  <span v-if="disabled || readonly" class="number-field-view">
    {{ modelValue ?? '-' }}
  </span>
  <!-- 编辑模式下显示输入框 -->
  <a-input-number
    v-else
    :model-value="numberValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :precision="precision"
    :min="min"
    :max="max"
    :step="step"
    style="width: 100%"
    @update:model-value="handleChange"
    @blur="handleBlur"
  />
</template>

<style scoped>
.number-field-view {
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

// 转换为数字类型
const numberValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return undefined
  }
  return Number(props.modelValue)
})

// 占位符
const placeholder = computed(() => {
  return props.column.PLACEHOLDER || `请输入${props.column.DISPLAY_NAME}`
})

// 小数位数
const precision = computed(() => {
  return props.column.DECIMAL_PLACES !== undefined ? props.column.DECIMAL_PLACES : undefined
})

// 最小值
const min = computed(() => {
  // 可以从 column.PROPS 中解析最小值
  return undefined
})

// 最大值
const max = computed(() => {
  // 可以从 column.PROPS 中解析最大值
  return undefined
})

// 步长
const step = computed(() => {
  if (props.column.DECIMAL_PLACES !== undefined && props.column.DECIMAL_PLACES > 0) {
    return 1 / Math.pow(10, props.column.DECIMAL_PLACES)
  }
  return 1
})

// 值变化处理
function handleChange(value: number | undefined) {
  emit('update:modelValue', value ?? null)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
