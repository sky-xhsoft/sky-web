<!-- 多行文本输入框字段渲染器 -->
<template>
  <!-- 查看模式下直接显示文本 -->
  <span v-if="isDisabled || isReadonly" class="textarea-field-view">
    {{ formattedValue }}
  </span>
  <!-- 编辑模式下显示输入框 -->
  <a-textarea
    v-else
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

<style scoped>
.textarea-field-view {
  display: inline-block;
  padding: 4px 0;
  color: var(--text-primary);
  line-height: 24px;
  min-height: 32px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useFieldRendererBase } from '../../composables'
import type { SysColumn, FieldValue, FormMode } from '../../types'

interface Props {
  column: SysColumn
  modelValue?: string
  mode?: FormMode
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

// 使用基础层
const { placeholder, maxLength: baseMaxLength, formatValue, isReadonly, isDisabled } = useFieldRendererBase(props)

// 最大长度
const maxLength = computed(() => {
  return baseMaxLength.value || props.column.COL_LENGTH
})

// 显示字数统计
const showWordLimit = computed(() => {
  return !!maxLength.value
})

// 是否显示清除按钮
const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

// 自动调整高度
const autoSize = computed(() => {
  // 优先使用 DISPLAY_ROWS，其次使用 props.rows
  const minRows = props.column.DISPLAY_ROWS || (props.column as any).displayRows || props.rows
  return {
    minRows: minRows,
    maxRows: Math.max(minRows, 10)
  }
})

// 格式化值用于显示
const formattedValue = computed(() => {
  return formatValue(props.modelValue)
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
