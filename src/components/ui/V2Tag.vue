<template>
  <span class="v2-tag" :class="`v2-tag--${type}`">
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  type?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

withDefaults(defineProps<Props>(), {
  type: 'neutral',
})
</script>

<style scoped>
.v2-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.v2-tag--success {
  background: var(--success-bg);
  color: var(--success);
}

.v2-tag--warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.v2-tag--error {
  background: var(--error-bg);
  color: var(--error);
}

.v2-tag--info {
  background: var(--info-bg);
  color: var(--info);
}

.v2-tag--neutral {
  background: var(--bg-hover);
  color: var(--text-secondary);
}
</style>
