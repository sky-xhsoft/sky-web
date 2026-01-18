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
          共 {{ formatSize(selectedSize) }}
        </span>
      </div>

      <div class="cloud-batch-actions__operations">
        <a-space>
          <a-button
            size="small"
            @click="handleDownload"
            :disabled="!hasSelectedFiles"
          >
            <icon-download />
            下载
          </a-button>
          <a-button
            size="small"
            @click="handleMove"
            :disabled="selectedCount === 0"
          >
            <icon-export />
            移动
          </a-button>
          <a-button
            size="small"
            status="danger"
            @click="handleDelete"
            :disabled="selectedCount === 0"
          >
            <icon-delete />
            删除
          </a-button>
          <a-button
            size="small"
            type="text"
            @click="handleClear"
          >
            取消选择
          </a-button>
        </a-space>
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
import { formatSize } from '@/modules/cloud/utils/format'

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

function handleSelectAll(value: boolean | (string | number | boolean)[]) {
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
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 12px;
  border: 2px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cloud-batch-actions:hover {
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
  transform: translateY(-2px);
}

.cloud-batch-actions__info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-count {
  font-size: 14px;
  color: #1f2937;
  padding-left: 28px; /* 对齐复选框 */
}

.selected-count strong {
  color: #3b82f6;
  font-weight: 600;
}

.selected-size {
  font-size: 13px;
  color: #6b7280;
  padding-left: 28px; /* 对齐复选框 */
}

.cloud-batch-actions__operations {
  width: 100%;
}

.cloud-batch-actions__operations :deep(.arco-space) {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.cloud-batch-actions__operations :deep(.arco-btn) {
  width: 100%;
  justify-content: center;
}

/* 取消选择按钮占满整行 */
.cloud-batch-actions__operations :deep(.arco-btn-text) {
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

  .cloud-batch-actions__operations :deep(.arco-space) {
    grid-template-columns: 1fr;
  }
}
</style>
