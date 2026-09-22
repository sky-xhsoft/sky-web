<template>
  <transition name="slide-up">
    <div v-if="visible" class="cloud-batch-actions">
      <div class="cloud-batch-actions__info">
        <a-checkbox
          :model-value="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
        >
          全选
        </a-checkbox>
        <span class="selected-count">
          已选择 <strong>{{ selectedCount }}</strong> 项
        </span>
        <span v-if="selectedSize > 0" class="selected-size">
          共 {{ formatFileSize(selectedSize) }}
        </span>
      </div>

      <div class="cloud-batch-actions__operations">
        <div class="op-grid">
          <V2Button
            type="secondary"
            size="sm"
            @click="handleDownload"
            :disabled="!hasSelectedFiles"
          >
            <template #icon><icon-download /></template>
            下载
          </V2Button>
          <V2Button
            type="secondary"
            size="sm"
            @click="handleMove"
            :disabled="selectedCount === 0"
          >
            <template #icon><icon-export /></template>
            移动
          </V2Button>
          <V2Button
            type="danger"
            size="sm"
            @click="handleDelete"
            :disabled="selectedCount === 0"
          >
            <template #icon><icon-delete /></template>
            删除
          </V2Button>
          <V2Button
            size="sm"
            type="text"
            class="op-clear"
            @click="handleClear"
          >
            取消选择
          </V2Button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  IconDownload,
  IconExport,
  IconDelete,
} from '@arco-design/web-vue/es/icon'
import { formatFileSize } from '@/utils/format'
import { V2Button } from '@/components/ui'

interface Props {
  visible?: boolean
  selectedCount?: number
  selectedSize?: number
  totalCount?: number
  hasSelectedFiles?: boolean
}

interface Emits {
  (e: 'selectAll'): void
  (e: 'clear'): void
  (e: 'download'): void
  (e: 'move'): void
  (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  selectedCount: 0,
  selectedSize: 0,
  totalCount: 0,
  hasSelectedFiles: false,
})

const emit = defineEmits<Emits>()

const isAllSelected = computed(() => {
  return props.totalCount > 0 && props.selectedCount === props.totalCount
})

const isIndeterminate = computed(() => {
  return props.selectedCount > 0 && props.selectedCount < props.totalCount
})

function handleSelectAll(_value: boolean | (string | number | boolean)[]) {
  emit('selectAll')
}

function handleClear() {
  emit('clear')
}

function handleDownload() {
  emit('download')
}

function handleMove() {
  emit('move')
}

function handleDelete() {
  emit('delete')
}
</script>

<style scoped>
.cloud-batch-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--brand-blue);
  box-shadow: var(--shadow-menu, 0 4px 12px rgba(0, 0, 0, 0.06));
  transition: box-shadow var(--duration-base) var(--ease-out);
}

.cloud-batch-actions:hover {
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.18);
}

.cloud-batch-actions__info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-count {
  font-size: 14px;
  color: var(--text-primary);
  padding-left: 28px; /* 对齐复选框 */
}

.selected-count strong {
  color: var(--brand-blue);
  font-weight: 600;
}

.selected-size {
  font-size: 13px;
  color: var(--text-secondary);
  padding-left: 28px; /* 对齐复选框 */
}

.cloud-batch-actions__operations {
  width: 100%;
}

.op-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.op-grid :deep(.v2-button) {
  width: 100%;
}

.op-grid :deep(.op-clear) {
  grid-column: 1 / -1;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 响应式调整 */
@media (max-width: 968px) {
  .cloud-batch-actions {
    padding: 16px;
  }

  .op-grid {
    grid-template-columns: 1fr;
  }
}
</style>