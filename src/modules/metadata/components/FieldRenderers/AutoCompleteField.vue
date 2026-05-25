<!-- 自动完成字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly" class="auto-complete-field-view">
    {{ modelValue ?? '' }}
  </span>
  <a-auto-complete
    v-else
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :allow-clear="allowClear"
    :data="options"
    :strict="strict"
    :filter-method="filterMethod"
    @update:model-value="handleChange"
    @search="handleSearch"
    @select="handleSelect"
  />
</template>

<style scoped>
.auto-complete-field-view {
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
import { ref, computed } from 'vue'
import { useFieldRendererBase } from '../../composables'
import type { SysColumn, FieldValue, FormMode } from '../../types'

interface AutoCompleteOption {
  value: string
  label?: string
}

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
  search: [value: string]
  select: [value: string]
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

const options = computed<AutoCompleteOption[] | string[]>(() => {
  const dictOptions = props.column.DICT_OPTIONS || []
  if (dictOptions.length > 0) {
    return dictOptions.map(opt => ({
      value: String(opt.value),
      label: opt.label
    }))
  }
  return config.value.options || []
})

const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

const strict = computed(() => {
  return config.value.strict !== false
})

const customFilterMethod = config.value.filterMethod

function filterMethod(inputValue: string, option: any) {
  if (customFilterMethod && typeof customFilterMethod === 'function') {
    return customFilterMethod(inputValue, option)
  }
  const label = typeof option === 'string' ? option : option.label || option.value
  return label.toLowerCase().includes(inputValue.toLowerCase())
}

function handleChange(value: string | undefined) {
  emit('update:modelValue', value || null)
}

function handleSearch(value: string) {
  emit('search', value)
}

function handleSelect(value: string) {
  emit('select', value)
}
</script>
