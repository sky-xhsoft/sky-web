<template>
  <div class="cloud-transfer-bar" :class="{ 'is-done': allDone }">
    <icon-upload class="cloud-transfer-bar__icon" />
    <span class="cloud-transfer-bar__title">
      {{ allDone ? t('cloud.transferDone', { count: completed }) : t('cloud.transferUploading', { count: active }) }}
    </span>
    <div class="cloud-transfer-bar__bar" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
      <i :style="{ width: percent + '%' }" />
    </div>
    <span class="cloud-transfer-bar__stats">{{ stats }}</span>
    <span v-if="failed > 0" class="cloud-transfer-bar__failed">{{ t('cloud.transferFailed', { count: failed }) }}</span>
    <span v-if="paused > 0" class="cloud-transfer-bar__paused">{{ t('cloud.transferPaused', { count: paused }) }}</span>
    <button type="button" class="cloud-transfer-bar__toggle" :aria-expanded="detailsOpen" @click="emit('toggle')">
      {{ detailsOpen ? t('cloud.hideDetails') : t('cloud.showDetails') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconUpload } from '@arco-design/web-vue/es/icon'
import type { UploadTask } from '@/modules/cloud/types'
import { formatSpeed, formatRemainingTime } from '@/modules/cloud/utils/format'

interface Props {
  uploadQueue: UploadTask[]
  detailsOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'toggle'): void }>()
const { t } = useI18n()

const count = (status: UploadTask['status']) => props.uploadQueue.filter((task) => task.status === status).length
const active = computed(() => count('uploading') + count('pending'))
const completed = computed(() => count('completed'))
const failed = computed(() => count('failed'))
const paused = computed(() => count('paused'))
const allDone = computed(() => props.uploadQueue.length > 0 && completed.value === props.uploadQueue.length)

/** 总体进度：按字节计算（不含已失败的任务） */
const totals = computed(() => {
  let total = 0
  let loaded = 0
  let speed = 0
  for (const task of props.uploadQueue) {
    if (task.status === 'failed') continue
    const size = Number(task.totalSize) || task.file.size || 0
    total += size
    loaded += task.status === 'completed' ? size : Math.min(Number(task.uploadedSize) || 0, size)
    if (task.status === 'uploading') speed += Number(task.speed) || 0
  }
  return { total, loaded, speed }
})

const percent = computed(() => {
  const { total, loaded } = totals.value
  return total > 0 ? Math.min(100, Math.floor((loaded / total) * 100)) : 0
})

const stats = computed(() => {
  const { total, loaded, speed } = totals.value
  const parts = [`${percent.value}%`]
  if (speed > 0 && !allDone.value) {
    parts.push(formatSpeed(speed), t('cloud.transferRemaining', { time: formatRemainingTime(Math.ceil((total - loaded) / speed)) }))
  }
  return parts.join(' · ')
})
</script>

<style scoped>
.cloud-transfer-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 9px 14px;
  border: 1px solid var(--info-border, rgba(29, 95, 214, 0.18));
  border-radius: var(--radius-md);
  background: var(--info-bg);
  font-size: 13px;
  color: var(--text-primary);
}

.cloud-transfer-bar.is-done {
  border-color: var(--border);
  background: var(--bg-hover);
}

.cloud-transfer-bar__icon {
  color: var(--brand-blue);
  font-size: 16px;
}

.cloud-transfer-bar__title {
  font-weight: 600;
}

.cloud-transfer-bar__bar {
  flex: 1 1 140px;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--border);
}

.cloud-transfer-bar__bar > i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--brand-blue);
  transition: width var(--duration-base) var(--ease-out);
}

.cloud-transfer-bar.is-done .cloud-transfer-bar__bar > i {
  background: var(--success);
}

.cloud-transfer-bar__stats {
  color: var(--text-secondary);
}

.cloud-transfer-bar__failed {
  color: var(--error);
}

.cloud-transfer-bar__paused {
  color: var(--text-secondary);
}

.cloud-transfer-bar__toggle {
  height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--brand-blue);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
</style>
