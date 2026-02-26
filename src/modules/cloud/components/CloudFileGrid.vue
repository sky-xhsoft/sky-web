<template>
  <div class="cloud-file-grid">
    <!-- 空状态 -->
    <a-empty
      v-if="items.length === 0 && !loading"
      :description="emptyText"
      class="cloud-file-grid__empty"
    >
      <template #image>
        <icon-folder />
      </template>
    </a-empty>

    <!-- 加载状态 -->
    <div v-if="loading" class="cloud-file-grid__loading">
      <a-spin :size="24" />
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
}

.cloud-file-grid__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.loading-text {
  font-size: 14px;
  color: #6b7280;
}

.cloud-file-grid__container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding: 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .cloud-file-grid__container {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    padding: 12px;
  }
}

@media (min-width: 1440px) {
  .cloud-file-grid__container {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    padding: 20px;
  }
}
</style>
