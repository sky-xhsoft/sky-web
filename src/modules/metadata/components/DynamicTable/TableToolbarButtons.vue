<template>
  <div v-if="showToolbar" class="dynamic-table__toolbar">
    <div class="toolbar-left">
      <a-space>
        <V2Button type="primary" size="sm" @click="$emit('query')">
          <template #icon><icon-search /></template>
          查询
        </V2Button>
        <V2Button type="secondary" size="sm" @click="$emit('reset')">
          <template #icon><icon-refresh /></template>
          重置
        </V2Button>
        <slot name="toolbar-left" />
      </a-space>
    </div>

    <div class="toolbar-right">
      <a-space>
        <!-- 选中批量快捷操作条 -->
        <transition name="batch-fade">
          <div v-if="hasSelection && selectedCount > 0" class="batch-quick-bar">
            <span class="batch-quick-count">已选 <b>{{ selectedCount }}</b> 项</span>
            <V2Button v-if="canEdit" type="text" size="sm" @click="$emit('batchEdit')">
              <template #icon><icon-edit /></template>
              修改选中行
            </V2Button>
            <V2Button type="text" size="sm" class="danger" @click="$emit('batchDelete')">
              <template #icon><icon-delete /></template>
              删除选中
            </V2Button>
          </div>
        </transition>

        <V2Button v-if="canCreate" type="gradient" size="sm" @click="$emit('create')">
          <template #icon><icon-plus /></template>
          新增
        </V2Button>
        <!-- 动作定义动态按钮（list_button） -->
        <V2Button
          v-for="act in listActions"
          :key="act.id"
          type="primary"
          size="sm"
          :loading="executingAction === act.id"
          @click="$emit('action', act)"
        >
          <template #icon><icon-thunderbolt /></template>
          {{ act.displayName || act.name }}
        </V2Button>
        <V2Button v-if="canSubmit" type="primary" size="sm" @click="$emit('submit')">提交</V2Button>
        <V2Button v-if="canUnsubmit" type="secondary" size="sm" @click="$emit('unsubmit')">反提交</V2Button>
        <slot name="toolbar-right" />

        <a-dropdown :popup-max-height="false">
          <a-button type="text">
            <template #icon><icon-more /></template>
            更多
          </a-button>
          <template #content>
            <a-doption v-if="canDelete" status="danger" @click="$emit('batchDelete')">
              <template #icon><icon-delete /></template>
              删除
            </a-doption>
            <a-doption v-if="canImport" @click="$emit('import')">
              <template #icon><icon-upload /></template>
              导入
            </a-doption>
            <a-doption v-if="canExport" @click="$emit('export')">
              <template #icon><icon-download /></template>
              导出
            </a-doption>
            <a-doption v-if="canPrint" @click="$emit('print')">
              <template #icon><icon-printer /></template>
              套打
            </a-doption>
            <a-doption v-if="canCreate" @click="$emit('copy')">
              <template #icon><icon-copy /></template>
              复制
            </a-doption>
            <a-doption v-if="canEdit" @click="$emit('batchEdit')">
              <template #icon><icon-edit /></template>
              修改选中行
            </a-doption>
            <a-doption v-if="canEdit" @click="$emit('batchEditAll')">
              <template #icon><icon-edit /></template>
              修改结果集
            </a-doption>
          </template>
        </a-dropdown>

        <a-popover v-model:popup-visible="showColumnSettings" trigger="click" position="bl" :popup-container="'body'">
          <a-tooltip content="列设置">
            <a-button type="text"><template #icon><icon-settings /></template></a-button>
          </a-tooltip>
          <template #content>
            <div class="column-settings-popover">
              <div class="settings-header"><span>列设置</span></div>
              <div class="settings-body">
                <div v-for="(column, index) in allColumns" :key="column.dataIndex" class="column-item"
                  draggable="true" @dragstart="$emit('dragStart', index)" @dragover.prevent @drop="$emit('drop', index)">
                  <icon-drag-dot-vertical class="drag-handle" />
                  <a-checkbox :model-value="selectedColumnKeys.includes(column.dataIndex as string)"
                    @change="(checked: boolean) => $emit('columnToggle', column.dataIndex as string, checked)">
                    {{ column.title }}
                  </a-checkbox>
                </div>
              </div>
              <div class="settings-footer">
                <a-button type="text" size="small" @click="$emit('resetColumns')">重置</a-button>
              </div>
            </div>
          </template>
        </a-popover>

        <a-tooltip content="刷新">
          <a-button type="text" :loading="loading" @click="$emit('refresh')">
            <template #icon><icon-refresh /></template>
          </a-button>
        </a-tooltip>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IconSearch, IconRefresh, IconPlus, IconMore,
  IconDelete, IconUpload, IconDownload, IconPrinter,
  IconCopy, IconEdit, IconSettings, IconDragDotVertical, IconThunderbolt
} from '@arco-design/web-vue/es/icon'
import { V2Button } from '@/components/ui'
import type { TableColumnData } from '@arco-design/web-vue'
import type { SysAction } from '../../types'

interface Props {
  showToolbar?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canSubmit?: boolean
  canUnsubmit?: boolean
  canImport?: boolean
  canExport?: boolean
  canPrint?: boolean
  loading?: boolean
  hasSelection?: boolean
  selectedCount?: number
  allColumns: TableColumnData[]
  selectedColumnKeys: string[]
  listActions?: SysAction[]
  executingAction?: number | null
}

withDefaults(defineProps<Props>(), {
  showToolbar: true,
  hasSelection: false,
  selectedCount: 0,
  listActions: () => []
})

const emit = defineEmits<{
  query: []
  reset: []
  create: []
  submit: []
  unsubmit: []
  batchDelete: []
  import: []
  export: []
  print: []
  copy: []
  batchEdit: []
  batchEditAll: []
  columnToggle: [key: string, checked: boolean]
  dragStart: [index: number]
  drop: [index: number]
  resetColumns: []
  refresh: []
  action: [action: SysAction]
}>()

const showColumnSettings = ref(false)
</script>

<style scoped>
/* 选中批量快捷操作条 */
.batch-quick-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  margin-right: 4px;
  background: rgba(22, 93, 255, 0.08);
  border: 1px solid rgba(22, 93, 255, 0.2);
  border-radius: 8px;
}
.batch-quick-count {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.batch-quick-count b {
  color: var(--brand-blue);
  font-size: 14px;
}
.batch-quick-bar .danger {
  color: var(--error) !important;
}
.batch-fade-enter-active,
.batch-fade-leave-active {
  transition: all 0.25s ease;
}
.batch-fade-enter-from,
.batch-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
