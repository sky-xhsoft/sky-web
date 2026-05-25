<!-- 文本输入框字段渲染器 -->
<template>
  <!-- 查看模式下直接显示文本 -->
  <span v-if="isDisabled || isReadonly" class="text-field-view">
    {{ formattedValue }}
  </span>
  <!-- 编辑模式下显示输入框 -->
  <a-input
    v-else
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

<style scoped>
.text-field-view {
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

// 使用基础层
const { placeholder, maxLength: baseMaxLength, formatValue, isReadonly, isDisabled } = useFieldRendererBase(props)

// 最大长度
const maxLength = computed(() => {
  return baseMaxLength.value || props.column.COL_LENGTH
})

// 是否显示清除按钮
const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

// 格式化值用于显示
const formattedValue = computed(() => {
  return formatValue(props.modelValue)
})

// 值变化处理
function handleChange(value: string | undefined) {
  let processedValue = value || null

  // 如果配置了自动转大写，则转换为大写
  if (processedValue) {
    const isUppercase = props.column.IS_UPPERCASE === 'Y' || (props.column as any).isUppercase === 'Y'
    if (isUppercase) {
      processedValue = processedValue.toUpperCase()
    }
  }

  emit('update:modelValue', processedValue)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
