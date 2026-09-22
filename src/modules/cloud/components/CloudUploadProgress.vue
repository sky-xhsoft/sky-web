<template>
  <V2Card
    v-if="hasUploadingTasks"
    class="cloud-upload-progress"
    :padding="false"
  >
    <div class="cloud-upload-progress__header">
      <span class="cloud-upload-progress__title">
        <icon-upload /> 上传中（{{ uploadingCount }}/{{ totalCount }}）
      </span>
      <div class="cloud-upload-progress__header-actions">
        <V2Button size="sm" type="secondary" @click="handleClearCompleted">清除已完成</V2Button>
        <V2Button size="sm" type="text" @click="handleToggle">
          <template #icon>
            <icon-down v-if="!collapsed" />
            <icon-up v-else />
          </template>
        </V2Button>
      </div>
    </div>

    <div v-if="!collapsed" class="cloud-upload-progress__body">
      <div class="overall-bar">
        <i
          :style="{ width: Math.min(100, Math.max(0, safeOverallProgress.percent)) + '%' }"
          :class="{ 'is-error': hasFailedTasks }"
        />
      </div>
      <div class="cloud-upload-progress__stats">
        <span>{{ formatSize(safeOverallProgress.loaded) }} / {{ formatSize(safeOverallProgress.total) }}</span>
        <span>{{ Math.round(safeOverallProgress.percent) }}%</span>
        <span>剩余 {{ uploadQueue.length - completedCount }} 个</span>
      </div>

      <div class="cloud-upload-progress__list">
        <div
          v-for="task in visibleTasks"
          :key="task.id"
          class="cloud-upload-progress__task"
          :class="`task-${task.status}`"
        >
          <div class="task-info">
            <span class="task-name">{{ task.file.name }}</span>
            <span class="task-size">{{ formatSize(task.file.size) }}</span>
          </div>
          <div class="task-progress-bar">
            <i
              :style="{ width: task.progress * 100 + '%' }"
              :class="{ 'is-done': task.status === 'completed', 'is-error': task.status === 'failed' }"
            />
          </div>
          <div class="task-actions">
            <V2Button
              v-if="task.status === 'failed'"
              size="sm"
              type="danger"
              @click="handleRetry(task.id)"
            >
              重试
            </V2Button>
            <V2Button
              size="sm"
              type="text"
              class="remove-btn"
              @click="handleRemove(task.id)"
            >
              <template #icon><icon-close /></template>
            </V2Button>
          </div>
        </div>
      </div>
    </div>
  </V2Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconUpload, IconDown, IconUp, IconClose } from '@arco-design/web-vue/es/icon'
import type { UploadTask } from '@/modules/cloud/types'
import { formatSize } from '@/modules/cloud/utils/format'
import { V2Button, V2Card } from '@/components/ui'

interface Props {
  uploadQueue: UploadTask[]
  hasUploadingTasks: boolean
  overallProgress: {
    percent: number
    loaded: number
    total: number
  }
}

interface Emits {
  (e: 'retry', taskId: string): void
  (e: 'remove', taskId: string): void
  (e: 'clearCompleted'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const collapsed = ref(false)
const maxVisibleTasks = ref(5)

const uploadingCount = computed(() =>
  props.uploadQueue.filter((t) => t.status === 'uploading').length
)

const completedCount = computed(() =>
  props.uploadQueue.filter((t) => t.status === 'completed').length
)

const totalCount = computed(() => props.uploadQueue.length)

const hasFailedTasks = computed(() =>
  props.uploadQueue.some((t) => t.status === 'failed')
)

const visibleTasks = computed(() =>
  props.uploadQueue.slice(0, maxVisibleTasks.value)
)

// 确保百分比在 0-100% 之间
const safeOverallProgress = computed(() => {
  return {
    ...props.overallProgress,
    percent: Math.min(100, Math.max(0, props.overallProgress.percent))
  }
})

function handleRetry(taskId: string) {
  emit('retry', taskId)
}

function handleRemove(taskId: string) {
  emit('remove', taskId)
}

function handleClearCompleted() {
  emit('clearCompleted')
}

function handleToggle() {
  collapsed.value = !collapsed.value
}
</script>

<style scoped>
.cloud-upload-progress {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.cloud-upload-progress :deep(.v2-card) {
  padding: 16px;
}

.cloud-upload-progress__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cloud-upload-progress__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

.cloud-upload-progress__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cloud-upload-progress__body {
  margin-top: 12px;
}

/* 总进度条（品牌渐变填充） */
.overall-bar {
  height: 6px;
  background: var(--bg-hover);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.overall-bar > i {
  display: block;
  height: 100%;
  background: var(--brand-gradient);
  border-radius: 999px;
  transition: width var(--duration-base) var(--ease-out);
}

.overall-bar > i.is-error {
  background: var(--error);
}

.cloud-upload-progress__stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.cloud-upload-progress__list {
  max-height: 300px;
  overflow-y: auto;
}

.cloud-upload-progress__task {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: var(--bg-hover);
  margin-bottom: 8px;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  display: block;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-size {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.task-progress-bar {
  flex: 0 0 100px;
  height: 5px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
}

.task-progress-bar > i {
  display: block;
  height: 100%;
  background: var(--brand-blue);
  border-radius: 999px;
  transition: width var(--duration-base) var(--ease-out);
}

.task-progress-bar > i.is-done {
  background: var(--success);
}

.task-progress-bar > i.is-error {
  background: var(--error);
}

.task-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
  align-items: center;
}

.remove-btn {
  color: var(--text-tertiary);
}
</style>