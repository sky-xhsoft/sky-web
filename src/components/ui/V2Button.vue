<template>
  <button
    type="button"
    class="v2-button"
    :class="[typeClass, sizeClass, { loading, disabled: disabled || loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="v2-button__spinner" />
    <span v-else-if="$slots.icon" class="v2-button__icon">
      <slot name="icon" />
    </span>
    <span class="v2-button__text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'primary' | 'gradient' | 'secondary' | 'text' | 'danger'
  size?: 'default' | 'sm'
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'default',
  loading: false,
  disabled: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const typeClass = computed(() => `v2-button--${props.type}`)
const sizeClass = computed(() => `v2-button--${props.size}`)
</script>

<style scoped>
.v2-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    filter var(--duration-fast) var(--ease-out);
}

.v2-button:active:not(:disabled) {
  transform: scale(0.98);
}

.v2-button--default {
  height: 34px;
  padding: 0 16px;
}

.v2-button--sm {
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
}

.v2-button--primary {
  background: var(--brand-blue);
  color: #fff;
}

.v2-button--primary:hover:not(:disabled) {
  background: var(--brand-blue-hover);
}

.v2-button--gradient {
  background: var(--brand-gradient);
  color: #fff;
}

.v2-button--gradient:hover:not(:disabled) {
  filter: brightness(1.08);
}

.v2-button--secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.v2-button--secondary:hover:not(:disabled) {
  border-color: var(--brand-blue);
  color: var(--brand-blue);
}

.v2-button--danger {
  background: var(--error);
  color: #fff;
}

.v2-button--danger:hover:not(:disabled) {
  filter: brightness(1.1);
}

.v2-button--text {
  background: transparent;
  color: var(--brand-blue);
  padding-left: 6px;
  padding-right: 6px;
}

.v2-button--text:hover:not(:disabled) {
  background: var(--info-bg);
}

.v2-button--text.danger {
  color: var(--error);
}

.v2-button--text.danger:hover:not(:disabled) {
  background: var(--error-bg);
}

.v2-button:disabled,
.v2-button.loading {
  opacity: 0.5;
  cursor: not-allowed;
}

.v2-button__icon {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
}

.v2-button__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: v2-spin 0.8s linear infinite;
}

@keyframes v2-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
