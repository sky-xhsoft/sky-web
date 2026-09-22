<template>
  <a-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :allow-clear="allowClear"
    :multiple="multiple"
    :size="size"
    :options="options"
    class="v2-select"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
    @popup-visible-change="$emit('popup-visible-change', $event)"
  >
    <slot />
    <template v-if="$slots.empty" #empty>
      <slot name="empty" />
    </template>
  </a-select>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number | string[] | number[] | undefined
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  multiple?: boolean
  size?: 'mini' | 'small' | 'medium' | 'large'
  options?: { label: string; value: string | number }[]
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: '请选择',
  disabled: false,
  allowClear: false,
  multiple: false,
  size: 'medium',
  options: () => [],
})

defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
  'popup-visible-change': [visible: boolean]
}>()
</script>

<style scoped>
.v2-select :deep(.arco-select-view-single) {
  height: 34px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
}

.v2-select :deep(.arco-select-view-focused) {
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 3px var(--info-bg);
}

.v2-select :deep(.arco-select-view-disabled) {
  background: var(--bg-hover);
  color: var(--text-tertiary);
}

.v2-select :deep(.arco-select-dropdown) {
  border-radius: var(--radius-md);
  background: var(--bg-card);
  box-shadow: var(--shadow-md);
}

.v2-select :deep(.arco-select-option-active) {
  background: var(--info-bg);
  color: var(--brand-blue);
}
</style>
