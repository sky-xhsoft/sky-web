<template>
  <a-card
    v-if="hasUploadingTasks"
    class="cloud-upload-progress"
    :bordered="false"
    size="small"
  >
    <div class="cloud-upload-progress__header">
      <span class="cloud-upload-progress__title">
        <icon-upload /> 上传中（{{ uploadingCount }}/{{ totalCount }}）
      </span>
      <a-space>
        <a-button size="mini" @click="handleClearCompleted">清除已完成</a-button>
        <a-button size="mini" type="text" @click="handleToggle">
          <icon-down v-if="!collapsed" />
          <icon-up v-else />
        </a-button>
      </a-space>
    </div>

    <div v-if="!collapsed" class="cloud-upload-progress__body">
      <a-progress
        :percent="overallProgress.percent"
        :status="hasFailedTasks ? 'danger' : undefined"
        class="cloud-upload-progress__bar"
      />
      <div class="cloud-upload-progress__stats">
        <span>{{ formatSize(overallProgress.loaded) }} / {{ formatSize(overallProgress.total) }}</span>
        <span>剩余 {{ uploadQueue.length - completedCount }} 个</span>
      </div>

      <div class="cloud-upload-progress__list">
        <div
          v-for="task in visibleTasks"
          :key="task.id"
          class="cloud-upload-progress__task"
        >
          <div class="task-info">
            <span class="task-name">{{ task.file.name }}</span>
            <span class="task-size">{{ formatSize(task.file.size) }}</span>
          </div>
          <div class="task-progress">
            <a-progress
              :percent="task.progress"
              :status="getTaskStatus(task)"
              size="small"
              :show-text="false"
            />
          </div>
          <div class="task-actions">
            <a-button
              v-if="task.status === 'failed'"
              size="mini"
              type="primary"
              @click="handleRetry(task.id)"
            >
              重试
            </a-button>
            <a-button
              size="mini"
              type="text"
              status="danger"
              @click="handleRemove(task.id)"
            >
              <icon-close />
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconUpload, IconDown, IconUp, IconClose } from '@arco-design/web-vue/es/icon'
import type { UploadTask } from '@/modules/cloud/types'
import { formatSize } from '@/modules/cloud/utils/format'

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

function getTaskStatus(task: UploadTask) {
  if (task.status === 'completed') return 'success'
  if (task.status === 'failed') return 'danger'
  return undefined
}

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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
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
  color: #1f2937;
}

.cloud-upload-progress__body {
  margin-top: 12px;
}

.cloud-upload-progress__bar {
  margin-bottom: 8px;
}

.cloud-upload-progress__stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
}

.cloud-upload-progress__list {
  max-height: 300px;
  overflow-y: auto;
}

.cloud-upload-progress__task {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  background: #f9fafb;
  margin-bottom: 8px;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  display: block;
  font-size: 13px;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-size {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.task-progress {
  flex: 0 0 100px;
}

.task-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
}
</style>
