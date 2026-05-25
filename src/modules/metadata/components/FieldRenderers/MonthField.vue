<!-- 月份选择字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly || mode === 'view'" class="month-field-view">
    {{ displayValue }}
  </span>
  <a-month-picker
    v-else
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :allow-clear="allowClear"
    @update:model-value="handleChange"
  />
</template>

<style scoped>
.month-field-view {
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
import dayjs from 'dayjs'

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  mode?: FormMode
  disabled?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  disabled: false,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
}>()

const { placeholder, isReadonly, isDisabled } = useFieldRendererBase(props)

const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const value = String(props.modelValue)
  try {
    const date = dayjs(value)
    if (date.isValid()) {
      return date.format('YYYY年MM月')
    }
  } catch {
    // ignore
  }
  return value
})

function handleChange(value: any) {
  if (!value) {
    emit('update:modelValue', null)
    return
  }
  const dateStr = dayjs(value).format('YYYY-MM')
  emit('update:modelValue', dateStr)
}
</script>
