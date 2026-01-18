<template>
  <a-modal
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :title="title"
    :footer="null"
    :closable="!inProgress"
    :mask-closable="false"
    :esc-to-close="!inProgress"
    width="600px"
    @cancel="handleCancel"
  >
    <div class="batch-progress-container">
      <!-- Progress Bar -->
      <div class="progress-section">
        <a-progress
          :percent="progressPercent"
          :status="progressStatus"
          :stroke-width="12"
        />
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
        <a-alert type="error" :show-icon="true">
          <template #icon>
            <icon-exclamation-circle-fill />
          </template>
          <template #title>
            以下 {{ failedItems.length }} 项操作失败
          </template>
        </a-alert>
        <div class="failed-list">
          <div v-for="(item, index) in failedItems" :key="index" class="failed-item">
            <icon-close-circle-fill class="failed-icon" />
            <span class="failed-name">{{ item }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="isComplete" class="action-buttons">
        <a-space>
          <a-button type="primary" @click="handleClose">
            确定
          </a-button>
          <a-button v-if="failed > 0" @click="handleRetry">
            重试失败项
          </a-button>
        </a-space>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IconExclamationCircleFill,
  IconCloseCircleFill,
} from '@arco-design/web-vue/es/icon'

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

// 计算进度状态
const progressStatus = computed(() => {
  if (props.inProgress) return 'normal'
  if (props.failed === 0) return 'success'
  return 'warning'
})

// 是否已完成
const isComplete = computed(() => {
  return !props.inProgress && props.completed === props.total
})

// Auto-close timer
let autoCloseTimer: number | null = null

// Watch for completion and auto-close
watch(
  () => isComplete.value,
  (complete) => {
    if (complete && props.autoClose && props.failed === 0) {
      // Only auto-close if there are no failures
      autoCloseTimer = window.setTimeout(() => {
        handleClose()
      }, props.autoCloseDelay)
    }
  }
)

// Handle close
function handleClose() {
  if (autoCloseTimer) {
    window.clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
  emit('update:visible', false)
  emit('close')
}

// Handle cancel (only when not in progress)
function handleCancel() {
  if (!props.inProgress) {
    handleClose()
  }
}

// Handle retry
function handleRetry() {
  emit('retry')
}
</script>

<style scoped lang="less">
.batch-progress-container {
  padding: 8px 0;

  .progress-section {
    margin-bottom: 24px;

    .progress-text {
      margin-top: 12px;
      text-align: center;
      font-size: 14px;
      color: var(--color-text-2);
      font-weight: 500;
    }
  }

  .stats-section {
    display: flex;
    justify-content: space-around;
    margin-bottom: 24px;
    padding: 16px;
    background: var(--color-fill-2);
    border-radius: 8px;

    .stat-item {
      text-align: center;
      flex: 1;

      .stat-label {
        font-size: 12px;
        color: var(--color-text-3);
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
      }

      &.success .stat-value {
        color: rgb(var(--success-6));
      }

      &.failed .stat-value {
        color: rgb(var(--danger-6));
      }

      &.total .stat-value {
        color: rgb(var(--primary-6));
      }
    }
  }

  .failed-section {
    margin-bottom: 16px;

    .failed-list {
      margin-top: 12px;
      max-height: 200px;
      overflow-y: auto;
      padding: 8px;
      background: var(--color-fill-1);
      border-radius: 4px;

      .failed-item {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        margin-bottom: 4px;
        background: var(--color-bg-2);
        border-radius: 4px;
        font-size: 13px;

        .failed-icon {
          color: rgb(var(--danger-6));
          margin-right: 8px;
          font-size: 14px;
          flex-shrink: 0;
        }

        .failed-name {
          color: var(--color-text-2);
          word-break: break-all;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    padding-top: 8px;
    border-top: 1px solid var(--color-border-2);
  }
}
</style>
