<!-- 动态表格批量操作组件 -->
<template>
  <transition name="slide-up">
    <div v-if="selectedCount > 0" class="dynamic-batch-actions">
      <div class="batch-actions-inner">
        <div class="batch-info">
          已选中 <span class="batch-count">{{ selectedCount }}</span> 项
          <span class="batch-size" v-if="selectedSize > 0">
            共 {{ formatFileSize(selectedSize) }}
          </span>
        </div>
        <div class="batch-buttons">
          <a-space>
            <a-button size="small" @click="$emit('selectAll')">
              全选
            </a-button>
            <a-button size="small" @click="$emit('clear')">
              取消
            </a-button>
            <a-button
              size="small"
              @click="$emit('download')"
              :disabled="!hasFiles"
            >
              <template #icon><icon-download /></template>
              下载
            </a-button>
            <a-button size="small" @click="$emit('move')">
              <template #icon><icon-sort /></template>
              移动
            </a-button>
            <a-button
              size="small"
              status="danger"
              @click="$emit('delete')"
            >
              <template #icon><icon-delete /></template>
              删除
            </a-button>
            <!-- 自定义插槽 -->
            <slot />
          </a-space>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { IconDownload, IconSort, IconDelete } from '@arco-design/web-vue/es/icon'
import { formatFileSize } from '@/utils/format'

interface Props {
  selectedCount: number
  selectedSize?: number
  hasFiles?: boolean
}

interface Emits {
  (e: 'selectAll'): void
  (e: 'clear'): void
  (e: 'download'): void
  (e: 'move'): void
  (e: 'delete'): void
}

withDefaults(defineProps<Props>(), {
  selectedSize: 0,
  hasFiles: true
})

defineEmits<Emits>()

</script>

<style scoped>
.dynamic-batch-actions {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: 90%;
  max-width: 800px;
}

.batch-actions-inner {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(8px);
  border: 1px solid #e8e8e8;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #333;
}

.batch-count {
  color: #165dff;
  font-weight: 600;
  font-size: 16px;
}

.batch-size {
  color: #666;
  font-size: 13px;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* 响应式 */
@media (max-width: 768px) {
  .dynamic-batch-actions {
    width: 95%;
    bottom: 16px;
  }

  .batch-actions-inner {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .batch-info {
    width: 100%;
    justify-content: center;
  }

  .batch-buttons {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>