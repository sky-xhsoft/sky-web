<!-- 季度选择字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly || mode === 'view'" class="quarter-field-view">
    {{ displayValue }}
  </span>
  <a-quarter-picker
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
.quarter-field-view {
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
    const match = value.match(/^(\d{4})-Q(\d)$/)
    if (match) {
      return `${match[1]}年第${match[2]}季度`
    }
    const date = dayjs(value)
    if (date.isValid()) {
      const quarter = Math.floor((date.month()) / 3) + 1
      return `${date.year()}年第${quarter}季度`
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
  const date = dayjs(value)
  const quarter = Math.floor((date.month()) / 3) + 1
  emit('update:modelValue', `${date.year()}-Q${quarter}`)
}
</script>
