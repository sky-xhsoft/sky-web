<template>
  <div class="v2-page-header">
    <div class="v2-page-header__meta">
      <div v-if="breadcrumb" class="v2-page-header__breadcrumb">
        {{ breadcrumb }}
      </div>
      <div class="v2-page-header__title">{{ title }}</div>
      <div v-if="description" class="v2-page-header__desc">
        {{ description }}
      </div>
    </div>
    <div v-if="$slots.actions" class="v2-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
  breadcrumb?: string
}

defineProps<Props>()
</script>

<style scoped>
.v2-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.v2-page-header__breadcrumb {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.v2-page-header__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.v2-page-header__desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.v2-page-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
</style>
