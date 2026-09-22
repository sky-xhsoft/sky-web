<template>
  <transition name="slide-up">
    <div v-if="selectedCount > 0" class="cloud-batch-actions" role="toolbar" :aria-label="t('cloud.batchActions')">
      <div class="batch-actions__inner">
        <div class="batch-info">
          {{ t('cloud.selectedItems', { count: selectedCount }) }}
          <span v-if="selectedTotalSize > 0" class="batch-size">
            {{ t('cloud.totalSize', { size: formattedSize }) }}
          </span>
        </div>
        <div class="batch-buttons">
          <V2Button size="sm" type="secondary" :aria-label="t('cloud.selectAll')" @click="$emit('select-all')">
            {{ t('cloud.selectAll') }}
          </V2Button>
          <V2Button size="sm" type="secondary" :aria-label="t('cloud.deselectAll')" @click="$emit('clear-selection')">
            {{ t('cloud.deselectAll') }}
          </V2Button>
          <V2Button
            size="sm"
            type="secondary"
            :disabled="!canDownload"
            :aria-label="t('cloud.download')"
            @click="$emit('download')"
          >
            <template #icon><icon-download /></template>
            {{ t('cloud.download') }}
          </V2Button>
          <V2Button size="sm" type="secondary" :aria-label="t('cloud.move')" @click="$emit('move')">
            <template #icon><icon-sort /></template>
            {{ t('cloud.move') }}
          </V2Button>
          <V2Button
            size="sm"
            type="danger"
            :aria-label="t('cloud.delete')"
            @click="$emit('delete')"
          >
            <template #icon><icon-delete /></template>
            {{ t('cloud.delete') }}
          </V2Button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconDownload, IconSort, IconDelete } from '@arco-design/web-vue/es/icon'
import { V2Button } from '@/components/ui'

interface Props {
  selectedCount: number
  selectedTotalSize: number
  canDownload: boolean
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'select-all'): void
  (e: 'clear-selection'): void
  (e: 'download'): void
  (e: 'move'): void
  (e: 'delete'): void
}>()

const { t } = useI18n()

const formattedSize = computed(() => formatFileSize(props.selectedTotalSize))

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}
</script>

<style scoped>
.cloud-batch-actions {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 20px;
  z-index: 100;
  min-width: 480px;
  max-width: 90vw;
}

.batch-actions__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.batch-info {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.batch-size {
  margin-left: 8px;
  color: var(--text-tertiary);
  font-weight: normal;
}

.batch-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 100%);
}

@media (max-width: 768px) {
  .cloud-batch-actions {
    min-width: auto;
    width: calc(100% - 32px);
    bottom: 16px;
    padding: 10px 12px;
  }
  .batch-info {
    font-size: 13px;
  }
  .batch-buttons {
    width: 100%;
    justify-content: space-between;
  }
}
</style>