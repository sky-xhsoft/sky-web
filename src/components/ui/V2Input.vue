<template>
  <a-input
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :max-length="maxLength"
    :show-word-limit="showWordLimit"
    :allow-clear="allowClear"
    :size="size"
    :type="type"
    class="v2-input"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
    @input="$emit('input', $event)"
    @focus="$emit('focus', $event)"
    @blur="$emit('blur', $event)"
    @press-enter="$emit('press-enter', $event)"
  >
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>
  </a-input>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  maxLength?: number
  showWordLimit?: boolean
  allowClear?: boolean
  size?: 'mini' | 'small' | 'medium' | 'large'
  type?: 'text' | 'password' | 'number'
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  readonly: false,
  maxLength: undefined,
  showWordLimit: false,
  allowClear: false,
  size: 'medium',
  type: 'text',
})

defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  input: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  'press-enter': [event: KeyboardEvent]
}>()
</script>

<style scoped>
.v2-input :deep(.arco-input) {
  height: 34px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
}

.v2-input :deep(.arco-input-wrapper) {
  border-radius: var(--radius-md);
  background: var(--bg-card);
}

.v2-input :deep(.arco-input-focus) {
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 3px var(--info-bg);
}

.v2-input :deep(.arco-input-disabled) {
  background: var(--bg-hover);
  color: var(--text-tertiary);
}

.v2-input :deep(.arco-input-error) {
  border-color: var(--error);
}

.v2-input :deep(.arco-input-error.arco-input-focus) {
  box-shadow: 0 0 0 3px var(--error-bg);
}
</style>
