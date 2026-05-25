<!-- 单选框字段渲染器 -->
<template>
  <div v-if="isDisabled || isReadonly" class="radio-field-view">
    {{ displayText }}
  </div>
  <a-radio-group
    v-else
    :model-value="modelValue"
    :disabled="disabled"
    :direction="direction"
    @update:model-value="handleChange"
  >
    <a-radio
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </a-radio>
  </a-radio-group>
</template>

<style scoped>
.radio-field-view {
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
import { useFieldRendererBase, useDictOptions } from '../../composables'
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
}>()

const { isReadonly, isDisabled, formatValue, fieldProps } = useFieldRendererBase(props)
const { dictOptions, hasDictConfig } = useDictOptions({ column: props.column })

// 排列方向
const direction = computed<'vertical' | 'horizontal'>(() => {
  return fieldProps.value.direction || 'horizontal'
})

// 选项列表
const options = computed(() => {
  // 如果有字典配置，优先使用字典选项
  if (hasDictConfig.value && dictOptions.value.length > 0) {
    return dictOptions.value
  }

  // 从 PROPS 中获取自定义 options
  if (fieldProps.value.options && Array.isArray(fieldProps.value.options)) {
    return fieldProps.value.options
  }

  // 默认返回 Y/N 选项
  return [
    { value: 'Y', label: '是' },
    { value: 'N', label: '否' }
  ]
})

// 显示文本（用于查看模式）
const displayText = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
    return '-'
  }

  const option = options.value.find(opt => opt.value === props.modelValue)
  if (option) {
    return option.label
  }

  // 检查是否是布尔值或 Y/N 格式
  const value = String(props.modelValue).toUpperCase()
  if (value === 'Y' || value === '1' || value === 'TRUE') {
    return '是'
  }
  if (value === 'N' || value === '0' || value === 'FALSE') {
    return '否'
  }

  return String(props.modelValue)
})

// 值变化处理
function handleChange(value: string | number | undefined) {
  emit('update:modelValue', value ?? null)
}
</script>
