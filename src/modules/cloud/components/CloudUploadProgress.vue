<template>
  <aside class="cloud-transfer" :aria-label="t('cloud.transferDetails')">
    <div class="cloud-transfer__header">
      <span class="cloud-transfer__title">{{ t('cloud.transferDetails') }}</span>
      <div class="cloud-transfer__header-actions">
        <button
          v-if="hasFinished"
          type="button"
          class="link-btn"
          @click="emit('clearCompleted')"
        >
          {{ t('cloud.clearCompleted') }}
        </button>
        <button type="button" class="icon-btn" :aria-label="t('cloud.hideDetails')" @click="emit('close')">
          <icon-close />
        </button>
      </div>
    </div>

    <div class="cloud-transfer__list">
      <div v-for="task in uploadQueue" :key="task.id" class="cloud-transfer__task">
        <div class="task-head">
          <CloudFileIcon :name="task.file.name" :mime="task.file.type" :size="22" />
          <span class="task-name" :title="task.file.name">{{ task.file.name }}</span>
          <span class="task-tag" :class="`is-${stateOf(task)}`">{{ tagText(task) }}</span>
        </div>
        <div class="task-bar" role="progressbar" :aria-valuenow="barPercent(task)" aria-valuemin="0" aria-valuemax="100">
          <i :style="{ width: barPercent(task) + '%' }" :class="`is-${stateOf(task)}`" />
        </div>
        <div class="task-foot">
          <span class="task-meta" :class="{ 'is-error': task.status === 'failed' }" :title="taskDetail(task)">
            {{ taskDetail(task) }}
          </span>
          <button
            v-if="stateOf(task) === 'uploading' && task.resumable"
            type="button"
            class="task-btn"
            @click="emit('pause', task.id)"
          >
            {{ t('cloud.pause') }}
          </button>
          <button v-if="task.status === 'paused'" type="button" class="task-btn is-primary" @click="emit('resume', task.id)">
            {{ t('cloud.resume') }}
          </button>
          <button v-if="task.status === 'failed'" type="button" class="task-btn is-primary" @click="emit('retry', task.id)">
            {{ t('cloud.retry') }}
          </button>
          <button
            v-if="task.status !== 'completed'"
            type="button"
            class="task-btn is-plain"
            @click="emit('remove', task.id)"
          >
            {{ t('cloud.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconClose } from '@arco-design/web-vue/es/icon'
import type { UploadTask } from '@/modules/cloud/types'
import { formatSize, formatSpeed, formatRemainingTime } from '@/modules/cloud/utils/format'
import CloudFileIcon from './CloudFileIcon.vue'

type TaskState = 'hashing' | 'uploading' | 'merging' | 'paused' | 'failed' | 'done' | 'waiting'

interface Props {
  uploadQueue: UploadTask[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'retry', taskId: string): void
  (e: 'pause', taskId: string): void
  (e: 'resume', taskId: string): void
  (e: 'remove', taskId: string): void
  (e: 'clearCompleted'): void
  (e: 'close'): void
}>()

const { t } = useI18n()

const hasFinished = computed(() => props.uploadQueue.some((task) => task.status === 'completed' || task.status === 'failed'))

/** 任务显示状态：上传中再按阶段细分 */
function stateOf(task: UploadTask): TaskState {
  switch (task.status) {
    case 'completed':
      return 'done'
    case 'failed':
    case 'error':
    case 'cancelled':
      return 'failed'
    case 'paused':
      return 'paused'
    case 'uploading':
      if (task.phase === 'hashing') return 'hashing'
      if (task.phase === 'merging') return 'merging'
      return 'uploading'
    default:
      return 'waiting'
  }
}

function tagText(task: UploadTask) {
  const keys: Record<TaskState, string> = {
    hashing: 'cloud.taskHashing',
    uploading: 'cloud.taskUploading',
    merging: 'cloud.taskMerging',
    paused: 'cloud.taskPaused',
    failed: 'cloud.taskFailed',
    done: 'cloud.taskDone',
    waiting: 'cloud.taskWaiting',
  }
  return t(keys[stateOf(task)])
}

/** 进度条：校验阶段显示校验进度，其余显示上传进度（0-100） */
function barPercent(task: UploadTask) {
  const value = stateOf(task) === 'hashing' ? task.hashProgress ?? 0 : task.progress
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)))
}

/** 状态说明：已传/总大小、速度、剩余时间、失败原因 */
function taskDetail(task: UploadTask) {
  const size = formatSize(Number(task.totalSize) || task.file.size)
  switch (stateOf(task)) {
    case 'done':
      return size
    case 'failed':
      return task.error || t('cloud.taskFailed')
    case 'paused':
      return `${formatSize(task.uploadedSize)} / ${size}`
    case 'hashing':
      return `${task.hashProgress ?? 0}% · ${size}`
    case 'merging':
      return size
    case 'uploading': {
      if (!task.resumable) return size
      const parts = [`${formatSize(task.uploadedSize)} / ${size}`]
      if (task.speed > 0) {
        parts.push(formatSpeed(task.speed), t('cloud.transferRemaining', { time: formatRemainingTime(task.remainingTime) }))
      }
      return parts.join(' · ')
    }
    default:
      return size
  }
}
</script>

<style scoped>
.cloud-transfer {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.cloud-transfer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}

.cloud-transfer__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.cloud-transfer__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.link-btn,
.icon-btn,
.task-btn {
  border: 0;
  font: inherit;
  cursor: pointer;
}

.link-btn {
  height: 26px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
}

.link-btn:hover {
  background: var(--bg-hover);
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
}

.icon-btn:hover {
  background: var(--bg-hover);
}

.cloud-transfer__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.cloud-transfer__task {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}

.cloud-transfer__task:last-child {
  border-bottom: 0;
}

.task-head,
.task-foot {
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-tag {
  flex: 0 0 auto;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.task-tag.is-uploading,
.task-tag.is-merging {
  background: var(--info-bg);
  color: var(--brand-blue);
}

.task-tag.is-hashing {
  background: var(--warning-bg, #fff4db);
  color: var(--warning, #a15c00);
}

.task-tag.is-failed {
  background: var(--error-bg, #fdecea);
  color: var(--error);
}

.task-tag.is-done {
  background: var(--success-bg, #e6f6ee);
  color: var(--success);
}

.task-bar {
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--border);
}

.task-bar > i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--brand-blue);
  transition: width var(--duration-base) var(--ease-out);
}

.task-bar > i.is-hashing {
  background: var(--warning);
}

.task-bar > i.is-paused,
.task-bar > i.is-waiting {
  background: var(--text-tertiary);
}

.task-bar > i.is-failed {
  background: var(--error);
}

.task-bar > i.is-done {
  background: var(--success);
}

.task-bar > i.is-merging {
  animation: merging-pulse 1.2s ease-in-out infinite;
}

@keyframes merging-pulse {
  50% {
    opacity: 0.45;
  }
}

.task-meta {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}

.task-meta.is-error {
  color: var(--error);
}

.task-btn {
  flex: 0 0 auto;
  height: 24px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  color: var(--text-primary);
  font-size: 12px;
}

.task-btn.is-primary {
  background: var(--info-bg);
  color: var(--brand-blue);
}

.task-btn.is-plain {
  background: transparent;
  color: var(--text-tertiary);
}

.task-btn:hover {
  filter: brightness(0.96);
}
</style>
