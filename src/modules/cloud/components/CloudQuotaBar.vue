<template>
  <div class="cloud-quota-bar" v-if="quota">
    <div class="cloud-quota-bar__header">
      <div class="cloud-quota-bar__icon">
        <icon-storage :size="24" />
      </div>
      <div class="cloud-quota-bar__title-section">
        <h3 class="cloud-quota-bar__title">存储空间</h3>
        <span class="cloud-quota-bar__text">
          {{ formatSize(quota.usedSpace || 0) }} / {{ formatSize(quota.totalQuota || 0) }}
        </span>
      </div>
    </div>

    <a-progress
      :percent="usagePercent"
      :show-text="false"
      :stroke-width="10"
      :class="['cloud-quota-bar__progress', `progress-${progressStatus}`]"
    />

    <div class="cloud-quota-bar__stats-grid">
      <div class="cloud-quota-bar__stat-item">
        <div class="stat-icon">
          <icon-file :size="16" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ quota.fileCount || 0 }}</div>
          <div class="stat-label">文件</div>
        </div>
      </div>

      <div class="cloud-quota-bar__stat-item">
        <div class="stat-icon">
          <icon-folder :size="16" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ quota.folderCount || 0 }}</div>
          <div class="stat-label">文件夹</div>
        </div>
      </div>

      <div class="cloud-quota-bar__stat-item stat-item--usage">
        <div class="stat-icon" :class="percentClass">
          <icon-dashboard :size="16" />
        </div>
        <div class="stat-info">
          <div class="stat-value" :class="percentClass">{{ displayPercent }}%</div>
          <div class="stat-label">使用率</div>
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

interface Props {
  quota: QuotaInfo | null
}

const props = defineProps<Props>()

const usagePercent = computed(() => {
  if (!props.quota) return 0
  const total = Number(props.quota.totalQuota) || 0
  const used = Number(props.quota.usedSpace) || 0

  if (total <= 0) return 0

  // 计算比例（0-1），Arco Design 会自动乘以 100 来显示
  const ratio = used / total
  return Math.min(1, Math.max(0, ratio))
})

// 用于显示的百分比文本（需要手动乘以 100）
const displayPercent = computed(() => {
  return (usagePercent.value * 100).toFixed(1)
})

const progressColor = computed(() => {
  const percent = usagePercent.value * 100 // 转换为百分比
  if (percent >= 90) return '#f53f3f'
  if (percent >= 70) return '#ff7d00'
  return '#00b42a'
})

const progressStatus = computed(() => {
  const percent = usagePercent.value * 100 // 转换为百分比
  if (percent >= 90) return 'danger'
  if (percent >= 70) return 'warning'
  return 'success'
})

const percentClass = computed(() => {
  const percent = usagePercent.value * 100 // 转换为百分比
  if (percent >= 90) return 'is-danger'
  if (percent >= 70) return 'is-warning'
  return 'is-safe'
})
</script>

<style scoped>
.cloud-quota-bar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cloud-quota-bar:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.cloud-quota-bar__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.cloud-quota-bar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgb(var(--primary-6)) 0%, rgb(var(--primary-5)) 100%);
  border-radius: 12px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(var(--primary-6), 0.3);
}

.cloud-quota-bar__title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cloud-quota-bar__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.cloud-quota-bar__text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  font-family: 'Consolas', 'Monaco', monospace;
}

.cloud-quota-bar__progress {
  margin: 0;
}

/* 进度条轨道背景（灰色） */
.cloud-quota-bar__progress :deep(.arco-progress-line-wrapper) {
  background-color: #f2f3f5 !important;
  border-radius: 5px;
}

/* 进度条填充部分（根据使用率变色） */
.cloud-quota-bar__progress :deep(.arco-progress-line-bar) {
  border-radius: 5px;
  transition: all 0.3s ease;
}

/* 根据使用率显示不同颜色 */
.progress-success :deep(.arco-progress-line-bar),
.progress-success :deep(.arco-progress-line-bar-fill) {
  background-color: #00b42a !important; /* 绿色：0-69% */
}

.progress-warning :deep(.arco-progress-line-bar),
.progress-warning :deep(.arco-progress-line-bar-fill) {
  background-color: #ff7d00 !important; /* 橙色：70-89% */
}

.progress-danger :deep(.arco-progress-line-bar),
.progress-danger :deep(.arco-progress-line-bar-fill) {
  background-color: #f53f3f !important; /* 红色：90-100% */
}

.cloud-quota-bar__stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.cloud-quota-bar__stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.cloud-quota-bar__stat-item:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgb(var(--primary-2));
  transform: translateY(-1px);
}

.cloud-quota-bar__stat-item.stat-item--usage {
  grid-column: 1 / -1;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(var(--primary-1), 0.5);
  border-radius: 8px;
  color: rgb(var(--primary-6));
  flex-shrink: 0;
}

.stat-icon.is-safe {
  background: rgba(0, 180, 42, 0.1);
  color: #00b42a;
}

.stat-icon.is-warning {
  background: rgba(255, 125, 0, 0.1);
  color: #ff7d00;
}

.stat-icon.is-danger {
  background: rgba(245, 63, 63, 0.1);
  color: #f53f3f;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-value.is-safe {
  color: #00b42a;
}

.stat-value.is-warning {
  color: #ff7d00;
}

.stat-value.is-danger {
  color: #f53f3f;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

@media (max-width: 968px) {
  .cloud-quota-bar {
    padding: 20px;
  }

  .cloud-quota-bar__stats-grid {
    grid-template-columns: 1fr;
  }

  .cloud-quota-bar__stat-item.stat-item--usage {
    grid-column: 1;
  }
}
</style>
