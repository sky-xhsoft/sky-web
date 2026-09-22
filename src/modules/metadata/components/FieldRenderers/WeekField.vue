<!-- 周选择字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly || mode === 'view'" class="week-field-view">
    {{ displayValue }}
  </span>
  <a-week-picker
    v-else
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :allow-clear="allowClear"
    :day-start-of-week="startOfWeek"
    @update:model-value="handleChange"
  />
</template>

<style scoped>
.week-field-view {
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
import 'dayjs/locale/zh-cn'
import weekOfYear from 'dayjs/plugin/weekOfYear'

dayjs.extend(weekOfYear)

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

const config = computed(() => {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch {
    return {}
  }
})

const startOfWeek = computed(() => {
  return config.value.startOfWeek ?? 1
})

const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const value = String(props.modelValue)
  try {
    const date = dayjs(value)
    if (date.isValid()) {
      const year = date.year()
      const week = date.week()
      return `${year}年第${week}周`
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
  const dateStr = dayjs(value).format('YYYY-MM-DD')
  emit('update:modelValue', dateStr)
}
</script>
