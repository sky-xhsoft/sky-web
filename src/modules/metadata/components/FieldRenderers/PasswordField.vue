<!-- 密码输入框字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly" class="password-field-view">
    {{ displayValue }}
  </span>
  <a-input-password
    v-else
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :max-length="maxLength"
    :allow-clear="allowClear"
    :visibility-controllable="!disableShowPassword"
    @update:model-value="handleChange"
    @blur="handleBlur"
  />
</template>

<style scoped>
.password-field-view {
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

const { placeholder, maxLength: baseMaxLength, isReadonly, isDisabled } = useFieldRendererBase(props)

const maxLength = computed(() => {
  return baseMaxLength.value || props.column.COL_LENGTH
})

const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

const disableShowPassword = computed(() => {
  const config = parseConfig()
  return config.disableShowPassword === true
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return '•'.repeat(Math.min(String(props.modelValue).length, 16))
})

function parseConfig() {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch {
    return {}
  }
}

function handleChange(value: string | undefined) {
  emit('update:modelValue', value || null)
}

function handleBlur() {
  emit('blur')
}
</script>
