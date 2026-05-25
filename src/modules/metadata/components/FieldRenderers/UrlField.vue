<!-- URL/链接输入框字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly" class="url-field-view">
    <a v-if="modelValue" :href="String(modelValue)" target="_blank" rel="noopener noreferrer" class="url-link">
      {{ displayValue }}
    </a>
    <span v-else>-</span>
  </span>
  <a-input
    v-else
    type="url"
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
.url-field-view {
  display: inline-block;
  padding: 4px 0;
  color: #333;
  line-height: 24px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.url-link {
  color: var(--color-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.url-link:hover {
  text-decoration: underline;
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

const { placeholder, maxLength: baseMaxLength, isReadonly, isDisabled, allowClear } = useFieldRendererBase(props)

const maxLength = computed(() => {
  return baseMaxLength.value || props.column.COL_LENGTH || 2048
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const value = String(props.modelValue)
  if (value.length > 60) {
    return value.slice(0, 40) + '...' + value.slice(-20)
  }
  return value
})

function handleChange(value: string | undefined) {
  emit('update:modelValue', value || null)
}

function handleBlur() {
  emit('blur')
}
</script>
