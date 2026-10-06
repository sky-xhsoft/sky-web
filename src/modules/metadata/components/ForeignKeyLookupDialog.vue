<template>
  <a-modal
    :visible="visible"
    :title="title"
    width="1200px"
    :footer="false"
    :align-center="false"
    @cancel="handleCancel"
  >
    <div class="fk-lookup-dialog">
      <!-- 左侧多选结果面板 -->
      <div v-if="isMulti" class="selection-panel">
        <div class="panel-header">
          <icon-list />
          <span>多选结果</span>
        </div>
        <div class="panel-body" ref="selectionPanelRef">
          <div v-if="selectedRows.length === 0" class="panel-empty">
            未选择任何项
          </div>
          <div
            v-for="row in selectedRows"
            :key="getRowId(row)"
            class="selected-item"
          >
            <span class="item-label">{{ getRowLabel(row) }}</span>
            <a-button
              type="text"
              size="mini"
              class="remove-btn"
              @click.stop="handleRemoveSelection(getRowId(row))"
            >
              <icon-close />
            </a-button>
          </div>
        </div>
        <div class="panel-footer">
          <a-button size="mini" @click="handleRemoveAll" class="footer-btn">
            移除全部
          </a-button>
        </div>
      </div>

      <!-- 右侧主内容区 -->
      <div class="main-content">
        <!-- 查询条件区域 -->
        <div class="query-area">
          <div class="query-title">
            <icon-search />
            查询条件
          </div>
          <DynamicQueryBar
            ref="queryBarRef"
            :columns="queryFields"
            :dict-options="dictOptions"
            @query="handleQueryBarQuery"
            @reset="handleQueryBarReset"
          />
          <div class="query-actions">
            <div class="query-actions-left">
              <a-button type="primary" size="small" @click="queryBarRef?.handleQuery()">
                <template #icon><icon-search /></template>
                查找
              </a-button>
            </div>
            <div class="query-actions-right">
              <a-button v-if="isMulti" type="primary" size="small" @click="handleConfirm">
                确定
              </a-button>
              <a-button v-else type="primary" size="small" @click="handleConfirm">
                确定
              </a-button>
              <a-button size="small" @click="handleAdd">
                <template #icon><icon-plus /></template>
                新增
              </a-button>
              <a-button size="small" @click="handleCancel">
                <template #icon><icon-close /></template>
                取消
              </a-button>
            </div>
          </div>
        </div>

        <!-- 数据表格 -->
        <a-table
          :columns="tableColumns"
          :data="tableRows"
          :loading="loading"
          :pagination="pagination"
          row-key="__rowKey"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
          @row-dblclick="handleRowDoubleClick"
        >
          <!-- 自定义全选列头 -->
          <template #selection-title>
            <a-checkbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="(v: boolean) => handleSelectAll(v)"
            />
          </template>
          <!-- 自定义选择列 -->
          <template #selection-cell="{ record }">
            <a-checkbox
              :model-value="isRowSelected(record)"
              @change="() => toggleRow(record)"
            />
          </template>
          <template #empty>
            <a-empty description="暂无数据" />
          </template>
        </a-table>

        <!-- 底部信息 -->
        <div class="bottom-info">
          <span class="filter-label">
            <icon-filter />
            当前过滤设置: {{ formatFilterInfo(currentFilters) }}
          </span>
          <span class="selection-result" v-if="isMulti">
            * 多选结果: {{ selectedRows.length }} 项
          </span>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconSearch,
  IconPlus,
  IconClose,
  IconList,
  IconFilter
} from '@arco-design/web-vue/es/icon'
import DynamicQueryBar from './DynamicTable/DynamicQueryBar.vue'
import * as metadataApi from '../api/metadata'
import type { SysColumn } from '../types'

interface Props {
  visible: boolean
  tableId: number
  columnId?: number
  title?: string
  currentValue?: any | any[]
  initIds?: (string | number)[]
  initLabels?: string[]
  selectionMode?: 'single' | 'multiple'
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select', result: { value: any; label: string } | { values: any[]; labels: string[]; records: any[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '查找 - 表',
  selectionMode: 'single'
})

const emit = defineEmits<Emits>()

const isMulti = computed(() => props.selectionMode === 'multiple')

const refTableColumns = ref<SysColumn[]>([])
const loading = ref(false)
const queryBarRef = ref<InstanceType<typeof DynamicQueryBar>>()
const selectionPanelRef = ref<HTMLElement>()

const queryFields = computed(() =>
  refTableColumns.value.filter(col =>
    col.IS_QUERY === 'Y' || (col as any).isQuery === 'Y'
  )
)

const dictOptions = computed(() => {
  const opts: Record<string, { value: string; label: string }[]> = {}
  refTableColumns.value.forEach(col => {
    const dictId = col.SYS_DICT_ID || (col as any).sysDictId
    if (dictId && (col as any).dictOptions) {
      opts[String(dictId)] = (col as any).dictOptions
    }
  })
  return opts
})

const displayColumns = computed(() => {
  return refTableColumns.value.filter(col => {
    const mask = col.MASK || (col as any).mask || '0000000000'
    const dbName = col.DB_NAME || (col as any).dbName
    const isListVisible = mask.length >= 5 && mask[4] === '1'
    const isId = dbName === 'ID'
    const isDk = col.IS_DK === 'Y' || (col as any).isDk === 'Y'
    return isId || isDk || isListVisible
  }).slice(0, 6)
})

const currentFilters = ref<Record<string, any>>({})
const tableData = ref<any[]>([])
const pageSelectedIds = ref<Set<string | number>>(new Set())

const selectedRow = ref<any>(null)
const selectedRows = ref<any[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [10, 15, 20, 50]
})

const columns = computed(() => {
  if (displayColumns.value.length === 0) {
    return [
      { title: '值', dataIndex: 'value', width: 100 },
      { title: '显示名称', dataIndex: 'label', ellipsis: true, tooltip: true }
    ]
  }

  return displayColumns.value.map(col => {
    const dbName = col.DB_NAME || (col as any).dbName
    const displayName = col.DISPLAY_NAME || (col as any).displayName || dbName
    const colType = col.COL_TYPE || (col as any).colType
    const isDk = col.IS_DK === 'Y' || (col as any).isDk === 'Y'

    let width: number | undefined
    if (dbName === 'ID') width = 80
    else if (colType === 'int' || colType === 'bigint') width = 100
    else if (colType === 'datetime' || colType === 'date') width = 180
    else if (!isDk) width = 150

    return { title: displayName, dataIndex: dbName, ellipsis: true, tooltip: true, width }
  })
})

const tableColumns = computed(() => {
  const selCol: any = {
    dataIndex: '__selection__',
    slotName: 'selection-cell',
    titleSlotName: 'selection-title',
    width: 44,
    fixed: 'left'
  }
  return [selCol, ...columns.value]
})

const isAllSelected = computed(() => {
  return tableData.value.length > 0 && tableData.value.every(r => pageSelectedIds.value.has(getRowId(r)))
})

const isIndeterminate = computed(() => {
  const pageChecked = tableData.value.filter(r => pageSelectedIds.value.has(getRowId(r))).length
  return pageChecked > 0 && pageChecked < tableData.value.length
})

function getRowKey(row: any): string | number {
  return row.ID || row.id || row.value || row.__id || 0
}

// 表格数据附加计算出的行键字段
const tableRows = computed(() => tableData.value.map(row => ({ ...row, __rowKey: getRowKey(row) })))

function getRowId(row: any): string | number {
  return row.ID || row.id || row.value
}

function isRowSelected(record: any): boolean {
  return pageSelectedIds.value.has(getRowId(record))
}

function toggleRow(record: any) {
  const rowKey = getRowId(record)
  if (isMulti.value) {
    if (pageSelectedIds.value.has(rowKey)) {
      // 取消本页勾选：从pageSelectedIds和selectedRows中移除
      pageSelectedIds.value.delete(rowKey)
      selectedRows.value = selectedRows.value.filter(r => getRowId(r) !== rowKey)
      return
    }
    // 本页未勾选，现在勾选
    const alreadyExists = selectedRows.value.find(r => !r.__label && getRowId(r) === rowKey)
    if (!alreadyExists) {
      // 移除同ID的stub
      const stubIdx = selectedRows.value.findIndex(r => r.__label && getRowId(r) === rowKey)
      if (stubIdx > -1) selectedRows.value.splice(stubIdx, 1)
      selectedRows.value.push(record)
    }
    pageSelectedIds.value.add(rowKey)
  } else {
    if (selectedRow.value && getRowId(selectedRow.value) === rowKey) {
      selectedRow.value = null
      selectedRows.value = []
      pageSelectedIds.value.clear()
    } else {
      selectedRow.value = record
      selectedRows.value = [record]
      pageSelectedIds.value = new Set([rowKey])
    }
  }
}

function getRowLabel(row: any): string {
  if (row.__label) return row.__label
  if (!refTableColumns.value.length) {
    return row.NAME || row.name || row.label || String(getRowId(row))
  }
  const akCol = refTableColumns.value.find(c => c.IS_AK === 'Y' || (c as any).isAk === 'Y')
    const dkCol = refTableColumns.value.find(c => c.IS_DK === 'Y' || (c as any).isDk === 'Y')
    // 输入(选择)场景优先展示输入键 AK，其次显示键 DK，最后兜底 NAME/ID
    const keyCol = akCol || dkCol
    const dkField = keyCol ? (keyCol.DB_NAME || (keyCol as any).dbName) : 'NAME'
    return row[dkField] || row.NAME || row.name || row.label || String(getRowId(row))
}

async function loadTableColumns() {
  try {
    refTableColumns.value = await metadataApi.fetchColumns(props.tableId)
  } catch (error: any) {
    console.error('[FKLookup] 加载列配置失败:', error)
    Message.error('加载列配置失败')
  }
}

async function loadData(filters?: Record<string, any>) {
  loading.value = true
  try {
    const response = await metadataApi.getForeignKeyOptions({
      tableId: props.tableId,
      columnId: props.columnId,
      page: pagination.current,
      pageSize: pagination.pageSize,
      filters: filters || currentFilters.value
    })

    const rawList = response.list || []
    tableData.value = rawList.map(row => {
      const newRow: any = { ID: (row as any).ID }
      Object.keys(row as any).forEach(key => {
        newRow[key] = (row as any)[key]
      })
      return newRow
    })

    // 不在当前页的预选项保留stub，当前页已加载的不额外勾选table checkbox
    pagination.total = response.total || 0
  } catch (error: any) {
    console.error('[FKLookup] loadData error:', error)
    Message.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleQueryBarQuery(form: Record<string, any>) {
  const filters: Record<string, any> = {}
  Object.keys(form).forEach(key => {
    if (form[key] !== '' && form[key] !== null && form[key] !== undefined) {
      filters[key] = form[key]
    }
  })
  currentFilters.value = filters
  pagination.current = 1
  loadData(filters)
}

function handleQueryBarReset() {
  currentFilters.value = {}
  pagination.current = 1
  loadData({})
}

function handleRowDoubleClick(record: any) {
  selectedRow.value = record
  selectedRows.value = [record]
  handleConfirm()
}

function handleSelectAll(checked: boolean) {
  if (checked) {
    tableData.value.forEach(row => {
      const rowKey = getRowId(row)
      pageSelectedIds.value.add(rowKey)
      if (!selectedRows.value.find(r => getRowId(r) === rowKey)) {
        const stubIdx = selectedRows.value.findIndex(r => r.__label && getRowId(r) === rowKey)
        if (stubIdx > -1) selectedRows.value.splice(stubIdx, 1)
        selectedRows.value.push(row)
      }
    })
  } else {
    const currentIds = new Set(tableData.value.map(r => getRowId(r)))
    currentIds.forEach(id => pageSelectedIds.value.delete(id))
    selectedRows.value = selectedRows.value.filter(r => r.__label || !currentIds.has(getRowId(r)))
  }
}

function handleRemoveSelection(rowKey: string | number) {
  selectedRows.value = selectedRows.value.filter(r => getRowId(r) !== rowKey)
}

function handleRemoveAll() {
  selectedRows.value = []
  pageSelectedIds.value.clear()
}

function handleAdd() {
  Message.info('新增功能待实现')
}

function handlePageChange(page: number) {
  pagination.current = page
  pageSelectedIds.value.clear()
  loadData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.current = 1
  pageSelectedIds.value.clear()
  loadData()
}

function handleConfirm() {
  if (isMulti.value) {
    emit('select', {
      values: selectedRows.value.map(r => getRowId(r)),
      labels: selectedRows.value.map(r => getRowLabel(r)),
      records: selectedRows.value
    })
  } else {
    const dkCol = refTableColumns.value.find(c => c.IS_DK === 'Y' || (c as any).isDk === 'Y')
    const dkField = dkCol ? (dkCol.DB_NAME || (dkCol as any).dbName) : 'NAME'
    if (selectedRow.value) {
      const recordId = getRowId(selectedRow.value)
      const label = selectedRow.value[dkField] || selectedRow.value.NAME || selectedRow.value.name || String(recordId)
      emit('select', { value: recordId, label })
    } else {
      emit('select', { value: '', label: '' })
    }
  }
  emit('update:visible', false)
}

function handleCancel() {
  emit('update:visible', false)
}

function formatFilterInfo(filters: Record<string, any>): string {
  const parts: string[] = []
  Object.keys(filters).forEach(key => {
    const value = filters[key]
    if (value) {
      parts.push(`${key}=${value}`)
    }
  })
  return parts.length > 0 ? parts.join('; ') : '(可用 = Y)'
}

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    selectedRow.value = null
    selectedRows.value = []
    pageSelectedIds.value.clear()
    currentFilters.value = {}
    pagination.current = 1

    // 预填当前已选中的项
    if (props.initLabels && props.initLabels.length > 0 && props.initIds && props.initIds.length > 0) {
      selectedRows.value = props.initIds.map((id, i) => ({
        ID: id,
        NAME: props.initLabels![i] || String(id),
        __label: props.initLabels![i] || String(id)
      }))
    }

    if (refTableColumns.value.length === 0) {
      await loadTableColumns()
    }
    loadData()
  }
})

onMounted(() => {
  if (props.visible) {
    loadTableColumns()
  }
})
</script>

<style scoped lang="less">
.fk-lookup-dialog {
  display: flex;
  height: 55vh;
  min-height: 420px;
  max-height: 65vh;
  gap: 0;
  border: 1px solid var(--info);

  .selection-panel {
    width: 280px;
    background: var(--bg-card);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;

    .panel-header {
      padding: 8px 12px;
      background: linear-gradient(to bottom, #fff, var(--border));
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-primary);
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 4px;
      min-height: 0;
      background: var(--bg-card);

      .panel-empty {
        text-align: center;
        color: var(--text-tertiary);
        font-size: 12px;
        padding: 20px 0;
      }

      .selected-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 6px;
        background: white;
        border: 1px solid var(--border);
        border-radius: 0;
        margin-bottom: 2px;
        font-size: 12px;
        cursor: pointer;

        &:hover {
          background: var(--info-bg);
        }

        .item-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 8px;
        }

        .remove-btn {
          color: var(--error);
          padding: 0 4px;
        }
      }
    }

    .panel-footer {
      padding: 8px 12px;
      background: var(--bg-hover);
      border-top: 1px solid var(--border);
      display: flex;
      gap: 8px;
      flex-direction: column;
      align-items: stretch;

      .footer-btn {
        text-align: left;
        padding: 4px 8px;
        color: var(--brand-blue);
      }
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 0;

    .query-area {
      background: var(--bg-card);
      border-bottom: 1px solid var(--info);
      padding: 8px 12px;
      margin-bottom: 0;

      .query-title {
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-primary);
      }

      .query-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;

        .query-actions-left, .query-actions-right {
          display: flex;
          gap: 8px;
        }
      }
    }

    .bottom-info {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border);

      .filter-label {
        font-size: 12px;
        color: var(--error);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .selection-result {
        margin-left: 16px;
        font-size: 12px;
        color: var(--error);
      }
    }
  }
}

:deep(.arco-table) {
  border: 1px solid var(--border);
  border-radius: 0;

  .arco-table-th {
    background: linear-gradient(to bottom, #fff, var(--border));
    border-bottom: 1px solid var(--border);
  }

  .arco-table-td {
      border-bottom: 1px solid var(--border);
    }

    /* 斑马纹: 偶数行 td 铺浅灰(与主列表 #eceef3 一致) */
    .arco-table-tr:nth-child(even) .arco-table-td {
      background-color: #eceef3 !important;
    }
    .arco-table-tr:nth-child(even):hover .arco-table-td {
      background-color: #e2e6f0 !important;
    }
}
</style>
