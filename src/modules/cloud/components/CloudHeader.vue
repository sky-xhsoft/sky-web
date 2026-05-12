<template>
  <div class="cloud-header">
    <div class="cloud-header__left">
      <h1 class="cloud-header__title">
        <span class="cloud-header__icon">☁️</span>
        {{ title || t('cloud.myCloud') }}
      </h1>
    </div>
    <div class="cloud-header__right">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: undefined,
})
</script>

<style scoped>
.cloud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.cloud-header__left {
  flex: 1;
}

.cloud-header__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cloud-header__icon {
  font-size: 28px;
}

.cloud-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
