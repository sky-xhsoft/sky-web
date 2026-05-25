<template>
  <div class="cloud-header-bar">
    <div class="header-left">
      <CloudBreadcrumb
        :items="breadcrumbs"
        :current-id="currentFolderId"
        @navigate="$emit('navigate', $event.id)"
      />
    </div>
    <div class="header-right">
      <!-- 配额显示 -->
      <div v-if="quota" class="quota-simple">
        <div class="quota-info">
          <span class="quota-text" :aria-label="quotaLabel">
            {{ formatFileSize(quota.usedSpace || 0) }} /
            {{ formatFileSize(quota.totalQuota || 0) }}
          </span>
        </div>
        <a-progress
          :percent="usagePercent"
          :show-text="false"
          :stroke-width="6"
          :status="usageStatus"
          class="quota-progress"
          :aria-label="t('cloud.storageUsage')"
        />
      </div>
      <a-button type="text" :aria-label="t('cloud.myShares')" @click="$emit('open-shares')">
        <template #icon><icon-share-alt /></template>
        {{ t('cloud.myShares') }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconShareAlt } from '@arco-design/web-vue/es/icon'
import CloudBreadcrumb from './CloudBreadcrumb.vue'

interface Quota {
  usedSpace?: number
  totalQuota?: number
}

interface Breadcrumb {
  id: number | null
  name: string
}

interface Props {
  breadcrumbs: Breadcrumb[]
  currentFolderId: number | null
  quota?: Quota | null
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'navigate', folderId: number | null): void
  (e: 'open-shares'): void
}>()

const { t } = useI18n()

const usagePercent = computed(() => {
  if (!props.quota) return 0
  return (props.quota.usedSpace || 0) / (props.quota.totalQuota || 1)
})

const usageStatus = computed<'success' | 'warning' | 'danger'>(() => {
  const p = usagePercent.value
  if (p > 0.9) return 'danger'
  if (p > 0.7) return 'warning'
  return 'success'
})

const quotaLabel = computed(() => {
  const used = formatFileSize(props.quota?.usedSpace || 0)
  const total = formatFileSize(props.quota?.totalQuota || 0)
  return `${t('cloud.usedSpace')}: ${used} / ${total}`
})

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
.cloud-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
  min-width: 200px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.quota-simple {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 200px;
}

.quota-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.quota-text {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.quota-progress {
  width: 200px;
}

@media (max-width: 768px) {
  .cloud-header-bar {
    padding: 12px 16px;
  }
  .quota-simple {
    min-width: 150px;
  }
  .quota-progress {
    width: 150px;
  }
}
</style>
