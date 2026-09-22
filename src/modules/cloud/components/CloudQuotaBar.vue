<template>
  <div v-if="quota" class="cloud-quota-bar">
    <!-- 对齐 drive.html 右侧配额卡：标题 + quota-bar 渐变填充 + 已用/共 -->
    <div class="cloud-quota-bar__title">{{ t('cloud.storageQuota') }}</div>

    <div class="quota-bar">
      <i :style="{ width: usagePercent * 100 + '%' }" />
    </div>

    <div class="cloud-quota-bar__text">
      {{ t('cloud.usedSpace') }} {{ formatSize(usedSpace) }} /
      {{ formatSize(totalSpace) }}
      <span class="quota-percent" :class="percentClass">{{ displayPercent }}%</span>
    </div>

    <div class="cloud-quota-bar__stats-grid">
      <div class="cloud-quota-bar__stat-item">
        <div class="stat-icon">
          <icon-file :size="16" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ quota.fileCount || 0 }}</div>
          <div class="stat-label">{{ t('cloud.files') }}</div>
        </div>
      </div>

      <div class="cloud-quota-bar__stat-item">
        <div class="stat-icon">
          <icon-folder :size="16" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ quota.folderCount || 0 }}</div>
          <div class="stat-label">{{ t('cloud.folders') }}</div>
        </div>
      </div>

      <div class="cloud-quota-bar__stat-item stat-item--usage">
        <div class="stat-icon" :class="percentClass">
          <icon-dashboard :size="16" />
        </div>
        <div class="stat-info">
          <div class="stat-value" :class="percentClass">{{ displayPercent }}%</div>
          <div class="stat-label">{{ t('cloud.usageRate') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconStorage, IconFile, IconFolder, IconDashboard } from '@arco-design/web-vue/es/icon'
import type { QuotaInfo } from '@/modules/cloud/types'
import { formatSize } from '@/modules/cloud/utils/format'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  quota: QuotaInfo | null
}

const props = defineProps<Props>()

// 兼容大驼峰和小驼峰两种字段名
const totalSpace = computed(() => Number(props.quota?.totalQuota || props.quota?.TotalQuota) || 0)
const usedSpace = computed(() => Number(props.quota?.usedSpace || props.quota?.UsedSpace) || 0)

const usagePercent = computed(() => {
  if (totalSpace.value <= 0) return 0
  return Math.min(1, Math.max(0, usedSpace.value / totalSpace.value))
})

const displayPercent = computed(() => {
  return (usagePercent.value * 100).toFixed(1)
})

const percentClass = computed(() => {
  const percent = usagePercent.value * 100
  if (percent >= 90) return 'is-danger'
  if (percent >= 70) return 'is-warning'
  return 'is-safe'
})
</script>

<style scoped>
.cloud-quota-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 18px;
}

.cloud-quota-bar__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 对齐原型 quota-bar：渐变填充 */
.quota-bar {
  height: 8px;
  background: var(--bg-hover);
  border-radius: 999px;
  overflow: hidden;
  margin: 4px 0;
}

.quota-bar > i {
  display: block;
  height: 100%;
  background: var(--brand-gradient);
  border-radius: 999px;
  transition: width var(--duration-base) var(--ease-out);
}

.cloud-quota-bar__text {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.quota-percent {
  font-size: 12px;
  font-weight: 600;
}

.quota-percent.is-safe {
  color: var(--success);
}

.quota-percent.is-warning {
  color: var(--warning);
}

.quota-percent.is-danger {
  color: var(--error);
}

.cloud-quota-bar__stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.cloud-quota-bar__stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
}

.cloud-quota-bar__stat-item.stat-item--usage {
  grid-column: 1 / -1;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: var(--info-bg);
  color: var(--info);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.stat-icon.is-safe {
  background: var(--success-bg);
  color: var(--success);
}

.stat-icon.is-warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.stat-icon.is-danger {
  background: var(--error-bg);
  color: var(--error);
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-value.is-safe {
  color: var(--success);
}

.stat-value.is-warning {
  color: var(--warning);
}

.stat-value.is-danger {
  color: var(--error);
}

.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

@media (max-width: 968px) {
  .cloud-quota-bar__stats-grid {
    grid-template-columns: 1fr;
  }
  .cloud-quota-bar__stat-item.stat-item--usage {
    grid-column: 1;
  }
}
</style>