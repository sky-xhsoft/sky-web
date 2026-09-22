<!-- 年份选择字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly || mode === 'view'" class="year-field-view">
    {{ displayValue }}
  </span>
  <a-year-picker
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
.year-field-view {
  display: inline-block;
  padding: 4px 0;
  color: var(--text-primary);
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
  const value = props.modelValue
  if (typeof value === 'number') {
    return `${value}年`
  }
  const strValue = String(value)
  if (/^\d{4}$/.test(strValue)) {
    return `${strValue}年`
  }
  try {
    const date = dayjs(strValue)
    if (date.isValid()) {
      return `${date.year()}年`
    }
  } catch {
    // ignore
  }
  return strValue
})

function handleChange(value: any) {
  if (!value) {
    emit('update:modelValue', null)
    return
  }
  const year = dayjs(value).year()
  emit('update:modelValue', year)
}
</script>
