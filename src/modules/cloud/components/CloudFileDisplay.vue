<template>
  <div class="cloud-file-display">
    <!-- 网格视图 -->
    <CloudFileGrid
      v-if="props.viewMode === 'grid'"
      :items="props.items"
      :loading="props.loading"
      :selected-ids="props.selectedIds"
      :selectable="props.selectable"
      @click="$emit('item-click', $event)"
      @dblclick="$emit('item-double-click', $event)"
      @select="handleSelect"
      @action="handleAction"
    />

    <!-- 列表视图 -->
    <CloudFileList
      v-else
      :items="props.items"
      :loading="props.loading"
      :selected-ids="props.selectedIds"
      :selectable="props.selectable"
      @click="$emit('item-click', $event)"
      @dblclick="$emit('item-double-click', $event)"
      @select="$emit('list-select', $event)"
      @action="handleAction"
    />
  </div>
</template>

<script setup lang="ts">
import CloudFileGrid from './CloudFileGrid.vue'
import CloudFileList from './CloudFileList.vue'
import type { GridItem } from '@/modules/cloud/types'

interface Props {
  viewMode: 'grid' | 'list'
  items: GridItem[]
  loading: boolean
  selectedIds: Set<string>
  selectable: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'item-click', item: GridItem): void
  (e: 'item-double-click', item: GridItem): void
  (e: 'item-select', payload: { item: GridItem; selected: boolean }): void
  (e: 'list-select', selectedKeys: (string | number)[]): void
  (e: 'item-action', payload: { action: string; item: GridItem }): void
}>()

// 处理 select 事件，将两个参数转换为对象
function handleSelect(item: GridItem, selected: boolean) {
  emit('item-select', { item, selected })
}

// 处理 action 事件，将两个参数转换为对象
function handleAction(action: string, item: GridItem) {
  emit('item-action', { action, item })
}
</script>

<style scoped>
.cloud-file-display {
  flex: 1;
  background: transparent;
  overflow: auto;
  padding: 16px;
}
</style>
