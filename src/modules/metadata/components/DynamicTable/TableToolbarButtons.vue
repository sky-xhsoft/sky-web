<template>
  <div v-if="showToolbar" class="dynamic-table__toolbar">
    <div class="toolbar-left">
      <a-space>
        <a-button type="primary" @click="$emit('query')">
          <template #icon><icon-search /></template>
          查询
        </a-button>
        <a-button @click="$emit('reset')">
          <template #icon><icon-refresh /></template>
          重置
        </a-button>
        <slot name="toolbar-left" />
      </a-space>
    </div>

    <div class="toolbar-right">
      <a-space>
        <a-button v-if="canCreate" type="primary" @click="$emit('create')">
          <template #icon><icon-plus /></template>
          新增
        </a-button>
        <a-button v-if="canSubmit" type="primary" @click="$emit('submit')">提交</a-button>
        <a-button v-if="canUnsubmit" @click="$emit('unsubmit')">反提交</a-button>
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
  IconCopy, IconEdit, IconSettings, IconDragDotVertical
} from '@arco-design/web-vue/es/icon'
import type { TableColumnData } from '@arco-design/web-vue'

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
  allColumns: TableColumnData[]
  selectedColumnKeys: string[]
}

withDefaults(defineProps<Props>(), {
  showToolbar: true
})

defineEmits<{
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
}>()

const showColumnSettings = ref(false)
</script>
