<template>
  <div class="v2-data-table">
    <div v-if="title || $slots.toolbar" class="v2-data-table__header">
      <div v-if="title" class="v2-data-table__title">{{ title }}</div>
      <div v-else class="v2-data-table__title"><!-- spacer --></div>
      <div v-if="$slots.toolbar" class="v2-data-table__toolbar">
        <slot name="toolbar" />
      </div>
    </div>
    <a-table
      :data="data"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
      :row-key="rowKey"
      :bordered="bordered"
      :scroll="scroll"
      :stripe="stripe"
      @page-change="$emit('page-change', $event)"
      @page-size-change="$emit('page-size-change', $event)"
      @selection-change="$emit('selection-change', $event)"
      @select-all="$emit('select-all', $event)"
      @row-click="$emit('row-click', $event)"
    >
      <template v-for="slot in Object.keys($slots)" :key="slot" #[slot]="scope">
        <slot :name="slot" v-bind="scope || {}" />
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnData, TableRowSelection } from '@arco-design/web-vue/es/table/interface'

interface Props {
  data: any[]
  columns?: TableColumnData[]
  loading?: boolean
  title?: string
  pagination?: any
  rowSelection?: TableRowSelection
  rowKey?: string
  bordered?: { wrapper?: boolean; cell?: boolean; headerCell?: boolean; bodyCell?: boolean }
  scroll?: { x?: number | string; y?: number | string }
  stripe?: boolean
}

withDefaults(defineProps<Props>(), {
  columns: () => [],
  loading: false,
  title: '',
  pagination: false,
  rowSelection: undefined,
  rowKey: 'id',
  bordered: () => ({ wrapper: true, cell: true }),
  scroll: undefined,
  stripe: false,
})

defineEmits<{
  'page-change': [page: number]
  'page-size-change': [pageSize: number]
  'selection-change': [rowKeys: (string | number)[]]
  'select-all': [checked: boolean]
  'row-click': [record: any]
}>()
</script>

<style scoped>
.v2-data-table {
  overflow: hidden;
}

.v2-data-table__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  min-height: 28px;
}

.v2-data-table__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.v2-data-table__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.v2-data-table :deep(.arco-table-th) {
  background: var(--bg-card);
  color: var(--text-tertiary);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.v2-data-table :deep(.arco-table-td) {
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
}

.v2-data-table :deep(.arco-table-tr:hover .arco-table-td) {
  background: var(--bg-hover) !important;
}

.v2-data-table :deep(.arco-table-cell) {
  padding: 10px 12px;
}

.v2-data-table :deep(.arco-pagination-item-active) {
  background: var(--brand-blue);
  border-color: var(--brand-blue);
  color: #fff;
}

.v2-data-table :deep(.arco-table-border .arco-table-container) {
  border-color: var(--border);
}

.v2-data-table :deep(.arco-table-border .arco-table-th),
.v2-data-table :deep(.arco-table-border .arco-table-td) {
  border-color: var(--border-light);
}
</style>
