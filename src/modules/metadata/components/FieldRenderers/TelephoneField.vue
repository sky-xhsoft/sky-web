<!-- 电话/手机号输入框字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly" class="telephone-field-view">
    <a v-if="modelValue" :href="`tel:${modelValue}`" class="telephone-link">
      {{ displayValue }}
    </a>
    <span v-else>-</span>
  </span>
  <a-input
    v-else
    type="tel"
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
.telephone-field-view {
  display: inline-block;
  padding: 4px 0;
  color: var(--text-primary);
  line-height: 24px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.telephone-link {
  color: var(--brand-blue);
  text-decoration: none;
}

.telephone-link:hover {
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
  return baseMaxLength.value || props.column.COL_LENGTH || 20
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const value = String(props.modelValue)
  if (value.length === 11 && /^1[3-9]\d{9}$/.test(value)) {
    return `${value.slice(0, 3)} ${value.slice(3, 7)} ${value.slice(7)}`
  }
  return value
})

function handleChange(value: string | undefined) {
  if (!value) {
    emit('update:modelValue', null)
    return
  }
  const cleaned = value.replace(/\D/g, '')
  emit('update:modelValue', cleaned)
}

function handleBlur() {
  emit('blur')
}
</script>
