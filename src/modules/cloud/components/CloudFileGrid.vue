<template>
  <div class="cloud-file-grid">
    <!-- 空状态 -->
    <div v-if="items.length === 0 && !loading" class="cloud-file-grid__empty">
      <span class="empty-icon"><icon-folder /></span>
      <div class="empty-text">{{ emptyText }}</div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="cloud-file-grid__loading">
      <a-spin :size="24" class="cloud-loading-spin" />
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 网格列表 -->
    <div v-else-if="items.length > 0" class="cloud-file-grid__container">
      <CloudFileCard
        v-for="item in items"
        :key="`${item.type}-${item.id}`"
        :item="item"
        :selected="isSelected(item)"
        :selectable="selectable"
        :show-actions="showActions"
        @click="handleClick(item)"
        @dblclick="handleDoubleClick(item)"
        @select="handleSelect"
        @action="handleAction($event, item)"
        @contextmenu="handleContextMenu($event, item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconFolder } from '@arco-design/web-vue/es/icon'
import CloudFileCard from './CloudFileCard.vue'
import type { GridItem } from '@/modules/cloud/types'

interface Props {
  items: GridItem[]
  loading?: boolean
  selectedIds?: Set<string>
  selectable?: boolean
  showActions?: boolean
  emptyText?: string
}

interface Emits {
  (e: 'click', item: GridItem): void
  (e: 'dblclick', item: GridItem): void
  (e: 'select', item: GridItem, selected: boolean): void
  (e: 'action', action: string, item: GridItem): void
  (e: 'contextmenu', event: MouseEvent, item: GridItem): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectable: false,
  showActions: true,
  emptyText: '此文件夹为空',
})

const emit = defineEmits<Emits>()

// Fix: Use composite key (type-id) to check selection
function isSelected(item: GridItem): boolean {
  const compositeKey = `${item.type}-${item.id}`
  const result = props.selectedIds ? props.selectedIds.has(compositeKey) : false
  return result
}

function handleClick(item: GridItem) {
  emit('click', item)
}

function handleDoubleClick(item: GridItem) {
  emit('dblclick', item)
}

function handleSelect(item: GridItem, selected: boolean) {
  emit('select', item, selected)
}

function handleAction(action: string, item: GridItem) {
  emit('action', action, item)
}

function handleContextMenu(event: MouseEvent, item: GridItem) {
  emit('contextmenu', event, item)
}
</script>

<style scoped>
.cloud-file-grid {
  width: 100%;
  min-height: 400px;
  position: relative;
}

.cloud-file-grid__empty {
  padding: 80px 0;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 40px;
  opacity: 0.5;
  display: block;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 13px;
}

.cloud-file-grid__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.cloud-loading-spin :deep(.arco-icon) {
  color: var(--brand-blue);
}

.loading-text {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 对齐原型的 cloud-grid */
.cloud-file-grid__container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.cloud-file-grid__container :deep(.cloud-file-card) {
  content-visibility: auto;
  contain-intrinsic-size: auto 156px;
}

@media (max-width: 768px) {
  .cloud-file-grid__container {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .cloud-file-grid__container {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media (min-width: 1440px) {
  .cloud-file-grid__container {
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  }
}
</style>