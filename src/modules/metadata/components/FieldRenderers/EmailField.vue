<!-- 邮箱输入框字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly" class="email-field-view">
    <a v-if="modelValue" :href="`mailto:${modelValue}`" class="email-link">
      {{ modelValue }}
    </a>
    <span v-else>-</span>
  </span>
  <a-input
    v-else
    type="email"
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
.email-field-view {
  display: inline-block;
  padding: 4px 0;
  color: var(--text-primary);
  line-height: 24px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.email-link {
  color: var(--brand-blue);
  text-decoration: none;
}

.email-link:hover {
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
  return baseMaxLength.value || props.column.COL_LENGTH || 255
})

function handleChange(value: string | undefined) {
  let processedValue = value || null
  if (processedValue) {
    processedValue = processedValue.toLowerCase()
  }
  emit('update:modelValue', processedValue)
}

function handleBlur() {
  emit('blur')
}
</script>
