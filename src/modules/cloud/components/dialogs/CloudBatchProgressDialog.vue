<template>
  <V2Modal
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :title="title"
    :footer="false"
    :closable="!inProgress"
    :mask-closable="false"
    :esc-to-close="!inProgress"
    width="600px"
    @cancel="handleCancel"
  >
    <div class="batch-progress-container">
      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-track">
          <i
            :style="{ width: progressPercent + '%' }"
            class="progress-fill"
            :class="progressColorClass"
          />
        </div>
        <div class="progress-text">
          <template v-if="inProgress">
            正在处理: {{ completed }} / {{ total }}
          </template>
          <template v-else-if="isComplete">
            <template v-if="failed === 0">
              全部完成！成功处理 {{ successCount }} 项
            </template>
            <template v-else>
              处理完成：成功 {{ successCount }} 项，失败 {{ failed }} 项
            </template>
          </template>
        </div>
      </div>

      <!-- Statistics -->
      <div class="stats-section">
        <div class="stat-item success">
          <div class="stat-label">成功</div>
          <div class="stat-value">{{ successCount }}</div>
        </div>
        <div class="stat-item failed" v-if="failed > 0">
          <div class="stat-label">失败</div>
          <div class="stat-value">{{ failed }}</div>
        </div>
        <div class="stat-item total">
          <div class="stat-label">总计</div>
          <div class="stat-value">{{ total }}</div>
        </div>
      </div>

      <!-- Failed Items List -->
      <div v-if="failedItems.length > 0" class="failed-section">
        <div class="failed-alert">
          <icon-exclamation-circle-fill />
          <span>以下 {{ failedItems.length }} 项操作失败</span>
        </div>
        <div class="failed-list">
          <div v-for="(item, index) in failedItems" :key="index" class="failed-item">
            <icon-close-circle-fill class="failed-icon" />
            <span class="failed-name">{{ item }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="isComplete" class="action-buttons">
        <V2Button type="primary" @click="handleClose">
          确定
        </V2Button>
        <V2Button v-if="failed > 0" type="secondary" @click="handleRetry">
          重试失败项
        </V2Button>
      </div>
    </div>
  </V2Modal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  IconExclamationCircleFill,
  IconCloseCircleFill,
} from '@arco-design/web-vue/es/icon'
import { V2Modal, V2Button } from '@/components/ui'

interface Props {
  visible: boolean
  title?: string
  total: number
  completed: number
  successCount: number
  failed: number
  failedItems?: string[]
  inProgress: boolean
  autoClose?: boolean
  autoCloseDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '批量操作进度',
  failedItems: () => [],
  autoClose: false,
  autoCloseDelay: 2000,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  retry: []
}>()

// 计算进度百分比
const progressPercent = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.completed / props.total) * 100)
})

const progressColorClass = computed(() => {
  if (props.inProgress) return 'is-progress'
  if (props.failed === 0) return 'is-success'
  return 'is-warning'
})

// 是否已完成
const isComplete = computed(() => {
  return !props.inProgress && props.completed === props.total
})

// Auto-close timer
let autoCloseTimer: number | null = null

watch(
  () => isComplete.value,
  (complete) => {
    if (complete && props.autoClose && props.failed === 0) {
      autoCloseTimer = window.setTimeout(() => {
        handleClose()
      }, props.autoCloseDelay)
    }
  }
)

function handleClose() {
  if (autoCloseTimer) {
    window.clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
  emit('update:visible', false)
  emit('close')
}

function handleCancel() {
  if (!props.inProgress) {
    handleClose()
  }
}

function handleRetry() {
  emit('retry')
}
</script>

<style scoped>
.batch-progress-container {
  padding: 8px 0;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-track {
  height: 10px;
  background: var(--bg-hover);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--brand-gradient);
  transition: width var(--duration-base) var(--ease-out);
}

.progress-fill.is-success {
  background: var(--success);
}

.progress-fill.is-warning {
  background: var(--warning);
}

.progress-text {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-hover);
  border-radius: var(--radius-lg);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-item.success .stat-value {
  color: var(--success);
}

.stat-item.failed .stat-value {
  color: var(--error);
}

.stat-item.total .stat-value {
  color: var(--info);
}

.failed-section {
  margin-bottom: 16px;
}

.failed-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--error-bg);
  color: var(--error);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.failed-list {
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
}

.failed-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  margin-bottom: 4px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.failed-icon {
  color: var(--error);
  margin-right: 8px;
  font-size: 14px;
  flex-shrink: 0;
}

.failed-name {
  color: var(--text-primary);
  word-break: break-all;
}

.failed-item:last-child {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
</style>