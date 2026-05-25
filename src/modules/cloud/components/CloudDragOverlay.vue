<template>
  <div v-if="visible" class="drag-overlay" role="dialog" :aria-label="t('cloud.dropFiles')">
    <div class="drag-overlay-content">
      <icon-cloud-download :size="64" />
      <div class="drag-overlay-text">{{ t('cloud.dropFiles') }}</div>
      <div class="drag-overlay-hint">{{ t('cloud.dropFilesHint') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IconCloudDownload } from '@arco-design/web-vue/es/icon'

interface Props {
  visible: boolean
}

defineProps<Props>()

const { t } = useI18n()
</script>

<style scoped>
.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22, 93, 255, 0.08);
  border: 3px dashed #165dff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
  animation: fadeInScale 0.2s ease-out;
}

.drag-overlay-content {
  background: #fff;
  padding: 40px 60px;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(22, 93, 255, 0.2);
  text-align: center;
  animation: float 2s ease-in-out infinite;
  color: #165dff;
}

.drag-overlay-text {
  font-size: 20px;
  font-weight: 600;
  margin-top: 12px;
  color: #1d2129;
}

.drag-overlay-hint {
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>