<template>
  <div class="cloud-file-list">
    <!-- 空状态 -->
    <a-empty
      v-if="items.length === 0 && !loading"
      :description="emptyText"
      class="cloud-file-list__empty"
    >
      <template #image>
        <icon-folder />
      </template>
    </a-empty>

    <!-- 加载状态 -->
    <div v-if="loading" class="cloud-file-list__loading">
      <a-spin size="large" />
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 表格视图 -->
    <a-table
      v-else-if="items.length > 0"
      :data="items"
      :columns="columns"
      :pagination="false"
      :row-selection="selectable ? rowSelection : undefined"
      :row-key="getRowKey"
      row-class="cloud-file-list__row"
      :scroll="{ x: false }"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDoubleClick"
    >
      <!-- 名称列 -->
      <template #name="{ record }">
        <div class="file-name-cell">
          <span
            class="file-icon"
            :style="{ backgroundColor: record.bg, color: record.color }"
          >
            {{ record.icon }}
          </span>
          <span class="file-name" :title="record.name">{{ record.name }}</span>
        </div>
      </template>

      <!-- 类型列 -->
      <template #type="{ record }">
        <a-tag v-if="record.type === 'folder'" color="orange">
          文件夹
        </a-tag>
        <span v-else class="file-ext">
          {{ record.file?.FileExt || '-' }}
        </span>
      </template>

      <!-- 大小列 -->
      <template #size="{ record }">
        <span v-if="record.type === 'file'">
          {{ formatSize(record.file?.FileSize || 0) }}
        </span>
        <span v-else class="text-muted">-</span>
      </template>

      <!-- 修改时间列 -->
      <template #time="{ record }">
        {{ formatDate(record.file?.CreateTime || record.folder?.CreateTime) }}
      </template>

      <!-- 操作列 -->
      <template #actions="{ record }">
        <a-space>
          <a-button
            v-if="record.type === 'file'"
            size="mini"
            type="text"
            @click.stop="handleAction('preview', record)"
            title="预览"
          >
            <icon-eye />
          </a-button>
          <a-button
            v-if="record.type === 'file'"
            size="mini"
            type="text"
            @click.stop="handleAction('download', record)"
            title="下载"
          >
            <icon-download />
          </a-button>
          <a-button
            size="mini"
            type="text"
            @click.stop="handleAction('rename', record)"
            title="重命名"
          >
            <icon-edit />
          </a-button>
          <a-dropdown trigger="click" @select="(v) => handleActionSelect(v, record)">
            <a-button size="mini" type="text" @click.stop>
              <icon-more />
            </a-button>
            <template #content>
              <a-doption value="move">
                <icon-export />
                移动
              </a-doption>
              <a-doption value="share">
                <icon-share-alt />
                分享
              </a-doption>
              <a-doption value="delete" class="danger-option">
                <icon-delete />
                删除
              </a-doption>
            </template>
          </a-dropdown>
        </a-space>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  IconFolder,
  IconEye,
  IconDownload,
  IconEdit,
  IconMore,
  IconExport,
  IconShareAlt,
  IconDelete,
} from '@arco-design/web-vue/es/icon'
import type { GridItem } from '@/modules/cloud/types'
import type { TableRowSelection } from '@arco-design/web-vue'
import { formatSize, formatDate } from '@/modules/cloud/utils/format'

interface Props {
  items: GridItem[]
  loading?: boolean
  selectedIds?: Set<string>
  selectable?: boolean
  emptyText?: string
}

interface Emits {
  (e: 'click', item: GridItem): void
  (e: 'dblclick', item: GridItem): void
  (e: 'select', selectedKeys: (string | number)[]): void
  (e: 'action', action: string, item: GridItem): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectable: false,
  emptyText: '此文件夹为空',
})

const emit = defineEmits<Emits>()

const columns = [
  {
    title: '名称',
    dataIndex: 'name',
    slotName: 'name',
    ellipsis: true,
    tooltip: true,
    // 不设置固定宽度，让名称列自适应填充剩余空间
  },
  {
    title: '类型',
    dataIndex: 'type',
    slotName: 'type',
    width: 100,
  },
  {
    title: '大小',
    dataIndex: 'size',
    slotName: 'size',
    width: 100,
  },
  {
    title: '修改时间',
    dataIndex: 'time',
    slotName: 'time',
    width: 160,
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 150,
    align: 'center' as const,
    fixed: 'right' as const,
  },
]

const rowSelection = computed<TableRowSelection>(() => ({
  type: 'checkbox',
  showCheckedAll: true,
  selectedRowKeys: props.selectedIds ? Array.from(props.selectedIds) : [],
  onSelect: (rowKeys: (string | number)[]) => {
    emit('select', rowKeys)
  },
}))

function getRowKey(record: GridItem) {
  return `${record.type}-${record.id}`
}

function handleRowClick(record: GridItem) {
  emit('click', record)
}

function handleRowDoubleClick(record: GridItem) {
  emit('dblclick', record)
}

function handleAction(action: string, item: GridItem) {
  emit('action', action, item)
}

function handleActionSelect(value: string | number | Record<string, any> | undefined, record: GridItem) {
  if (typeof value === 'string') {
    handleAction(value, record)
  }
}
</script>

<style scoped>
.cloud-file-list {
  width: 100%;
  min-height: 400px;
  overflow: hidden; /* 防止溢出 */
}

/* 确保表格容器不会产生横向滚动 */
:deep(.arco-table) {
  overflow-x: hidden !important;
}

:deep(.arco-table-container) {
  overflow-x: hidden !important;
}

:deep(.arco-table-content) {
  overflow-x: hidden !important;
}

.cloud-file-list__empty {
  padding: 80px 0;
}

.cloud-file-list__loading {
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

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden; /* 防止溢出 */
}

.file-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 18px;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-ext {
  text-transform: uppercase;
  font-size: 12px;
  color: #6b7280;
}

.text-muted {
  color: #9ca3af;
}

.danger-option {
  color: #f53f3f;
}

:deep(.cloud-file-list__row) {
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.cloud-file-list__row:hover) {
  background-color: #f9fafb;
}
</style>
