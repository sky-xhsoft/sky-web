<template>
  <V2Card class="cloud-header-bar" :padding="true">
    <div class="cloud-header-bar__inner">
      <div class="header-left">
        <CloudBreadcrumb
          :items="breadcrumbs"
          :current-id="currentFolderId"
          @navigate="$emit('navigate', $event.id)"
        />
      </div>
      <div class="header-right">
        <!-- 配额显示 -->
        <div v-if="quota" class="quota-simple" :title="quotaLabel">
          <div class="quota-bar">
            <i :style="{ width: usagePercent * 100 + '%' }" />
          </div>
          <span class="quota-text">
            {{ formatFileSize(quota.usedSpace || 0) }} /
            {{ formatFileSize(quota.totalQuota || 0) }}
            （{{ Math.round(usagePercent * 100) }}%）
          </span>
        </div>
        <V2Button type="secondary" size="sm" :aria-label="t('cloud.myShares')" @click="$emit('open-shares')">
          <template #icon><icon-share-alt /></template>
          {{ t('cloud.myShares') }}
        </V2Button>
      </div>
    </div>
  </V2Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconShareAlt } from '@arco-design/web-vue/es/icon'
import { V2Button, V2Card } from '@/components/ui'
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
  const total = props.quota.totalQuota || 0
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, (props.quota.usedSpace || 0) / total))
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
  margin-bottom: 14px;
}

.cloud-header-bar :deep(.v2-card--pad) {
  padding: 14px 18px;
}

.cloud-header-bar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

/* 配额条 (对齐 drive.html 的 quota-bar) */
.quota-bar {
  width: 200px;
  height: 8px;
  background: var(--bg-hover);
  border-radius: 999px;
  overflow: hidden;
  margin: 2px 0;
}

.quota-bar > i {
  display: block;
  height: 100%;
  background: var(--brand-gradient);
  border-radius: 999px;
  transition: width var(--duration-base) var(--ease-out);
}

.quota-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

@media (max-width: 768px) {
  .quota-simple {
    min-width: 150px;
  }
  .quota-bar {
    width: 150px;
  }
}
</style>