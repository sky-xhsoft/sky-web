<template>
  <div ref="rootRef" class="cloud-file-list">
    <!-- 空状态 -->
    <div v-if="items.length === 0 && !loading" class="cloud-file-list__empty">
      <span class="empty-icon"><icon-folder /></span>
      <div class="empty-text">{{ emptyText || t('cloud.folderEmpty') }}</div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="cloud-file-list__loading">
      <a-spin :size="32" class="cloud-loading-spin" />
      <div class="loading-text">{{ t('cloud.loading') }}</div>
    </div>

    <!-- 表格视图 (dt-table 风格) -->
    <a-table
      v-else-if="items.length > 0"
      class="cloud-dt-table"
      :data="items"
      :columns="columns"
      :pagination="false"
      :row-selection="selectable ? rowSelection : undefined"
      :row-key="getRowKey"
      row-class="cloud-file-list__row"
      :scroll="{ x: 'auto', y: tableHeight }"
      :virtual-list-props="{ height: tableHeight, fixedSize: true, estimatedSize: 48 }"
      :bordered="false"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDoubleClick"
    >
      <!-- 名称列 -->
      <template #name="{ record }">
        <div class="file-name-cell">
          <span class="file-thumb">
            <CloudFileThumb
              :file-id="record.type === 'file' ? record.id : 0"
              :folder="record.type === 'folder'"
              :name="record.name"
              :ext="record.file?.FileExt"
              :mime="record.file?.FileType"
              :icon-size="26"
              compact
            />
          </span>
          <span class="file-name" :title="record.name">{{ record.name }}</span>
        </div>
      </template>

      <!-- 类型列 -->
      <template #type="{ record }">
        <V2Tag v-if="record.type === 'folder'" type="warning" class="nowrap-tag">
          {{ t('cloud.folder') }}
        </V2Tag>
        <span v-else class="file-ext">
          {{ record.file?.FileExt || '-' }}
        </span>
      </template>

      <!-- 大小列 -->
      <template #size="{ record }">
        <span v-if="record.type === 'file'" class="nowrap-tag">
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
        <div class="row-actions">
          <V2Button
            v-if="record.type === 'file'"
            size="sm"
            type="text"
            @click.stop="handleAction('preview', record)"
            :title="t('cloud.preview')"
          >
            <template #icon><icon-eye /></template>
          </V2Button>
          <V2Button
            v-if="record.type === 'file'"
            size="sm"
            type="text"
            @click.stop="handleAction('download', record)"
            :title="t('cloud.download')"
          >
            <template #icon><icon-download /></template>
          </V2Button>
          <V2Button
            size="sm"
            type="text"
            @click.stop="handleAction('rename', record)"
            :title="t('cloud.rename')"
          >
            <template #icon><icon-edit /></template>
          </V2Button>
          <a-dropdown trigger="click" @select="(v) => handleActionSelect(v, record)">
            <V2Button size="sm" type="text" @click.stop>
              <icon-more />
            </V2Button>
            <template #content>
              <a-doption value="move">
                <icon-export />
                {{ t('cloud.move') }}
              </a-doption>
              <a-doption value="share">
                <icon-share-alt />
                {{ t('cloud.share') }}
              </a-doption>
              <a-doption value="permission">
                <icon-safe />
                {{ t('cloud.permission') }}
              </a-doption>
              <a-doption value="delete" class="danger-option">
                <icon-delete />
                {{ t('cloud.deleteItem') }}
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import {
  IconFolder,
  IconEye,
  IconDownload,
  IconEdit,
  IconMore,
  IconExport,
  IconShareAlt,
  IconSafe,
  IconDelete,
} from '@arco-design/web-vue/es/icon'
import type { GridItem } from '@/modules/cloud/types'
import type { TableRowSelection } from '@arco-design/web-vue'
import { formatSize, formatDate } from '@/modules/cloud/utils/format'
import CloudFileThumb from './CloudFileThumb.vue'
import { useI18n } from 'vue-i18n'
import { V2Button, V2Tag } from '@/components/ui'

const { t } = useI18n()

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
  emptyText: undefined,
})

const emit = defineEmits<Emits>()

// 表格高度：填满所在滚动区域的剩余高度（原先固定 600px，下方大片留白）
const rootRef = ref<HTMLElement>()
const tableHeight = ref(600)
let resizeObserver: ResizeObserver | undefined

function measureHeight() {
  const el = rootRef.value
  if (!el) return
  const box = el.closest('.cloud-view__files-wrapper') as HTMLElement | null
  const bottom = box ? box.getBoundingClientRect().bottom - 24 : window.innerHeight - 24
  const header = 40
  tableHeight.value = Math.max(240, Math.floor(bottom - el.getBoundingClientRect().top - header))
}

onMounted(() => {
  measureHeight()
  const box = rootRef.value?.closest('.cloud-view__files-wrapper')
  if (box && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measureHeight)
    resizeObserver.observe(box)
  }
  window.addEventListener('resize', measureHeight)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', measureHeight)
})

const columns = [
  {
    title: t('cloud.fileName'),
    dataIndex: 'name',
    slotName: 'name',
    ellipsis: true,
    tooltip: true,
  },
  {
    title: t('cloud.fileType'),
    dataIndex: 'type',
    slotName: 'type',
    width: 110,
  },
  {
    title: t('cloud.fileSize'),
    dataIndex: 'size',
    slotName: 'size',
    width: 110,
  },
  {
    title: t('cloud.modified'),
    dataIndex: 'time',
    slotName: 'time',
    width: 160,
  },
  {
    title: t('cloud.actions'),
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
  min-height: 240px;
  overflow: hidden; /* 防止溢出 */
}

/* dt-table 风格：白卡 + 小灰表头 + hover */
.cloud-dt-table {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.cloud-dt-table :deep(.arco-table-container) {
  overflow-x: auto;
}

.cloud-dt-table :deep(.arco-table-th) {
  background: var(--bg-card);
  color: var(--text-tertiary);
  font-weight: 500;
  font-size: 12px;
  border-bottom: 1px solid var(--border-light);
}

.cloud-dt-table :deep(.arco-table-td) {
  color: var(--text-primary);
  font-size: 13px;
  border-bottom: 1px solid var(--border-light);
  padding: 12px 16px;
}

.cloud-dt-table :deep(.arco-table-tr:hover .arco-table-td) {
  background: var(--bg-hover);
}

.cloud-file-list__empty {
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

.cloud-file-list__loading {
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

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden; /* 防止溢出 */
}

.file-thumb {
  flex: 0 0 auto;
  width: 40px;
  height: 30px;
  border-radius: 4px;
  overflow: hidden;
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  font-weight: 500;
}

.file-ext {
  text-transform: uppercase;
  font-size: 12px;
  color: var(--text-secondary);
}

.text-muted {
  color: var(--text-tertiary);
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.danger-option {
  color: var(--error);
}

:deep(.cloud-file-list__row) {
  cursor: pointer;
  transition: background-color var(--duration-fast);
}
.nowrap-tag {
  white-space: nowrap;
}
</style>