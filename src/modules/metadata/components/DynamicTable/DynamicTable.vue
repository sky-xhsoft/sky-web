<!-- 动态表格组件 -->
<template>
  <div class="dynamic-table">
    <!-- 查询区域 -->
    <div v-if="queryColumns.length > 0" class="dynamic-table__query">
      <div class="query-header">
        <icon-search class="query-icon" />
        <span class="query-title">查询条件</span>
      </div>

      <a-form
        :model="queryForm"
        layout="inline"
        @submit="handleQuery"
      >
        <a-row :gutter="[16, 16]" class="query-row">
          <a-col
            v-for="column in visibleQueryColumns"
            :key="column.DB_NAME"
            :span="6"
          >
            <a-form-item
              :label="column.DISPLAY_NAME"
              :field="column.DB_NAME"
            >
              <!-- 文本输入 -->
              <a-input
                v-if="column.CONTROL_TYPE === 'text' || column.CONTROL_TYPE === 'email' || column.CONTROL_TYPE === 'url'"
                v-model="queryForm[column.DB_NAME]"
                :placeholder="`请输入${column.DISPLAY_NAME}`"
                allow-clear
              />

              <!-- 数字输入 -->
              <a-input-number
                v-else-if="column.CONTROL_TYPE === 'number'"
                v-model="queryForm[column.DB_NAME]"
                :placeholder="`请输入${column.DISPLAY_NAME}`"
                style="width: 100%"
              />

              <!-- 下拉选择 -->
              <a-select
                v-else-if="column.CONTROL_TYPE === 'select'"
                v-model="queryForm[column.DB_NAME]"
                :placeholder="`请选择${column.DISPLAY_NAME}`"
                allow-clear
              >
                <!-- TODO: 加载字典数据 -->
                <a-option value="Y">是</a-option>
                <a-option value="N">否</a-option>
              </a-select>

              <!-- 日期选择 -->
              <a-date-picker
                v-else-if="column.CONTROL_TYPE === 'date'"
                v-model="queryForm[column.DB_NAME]"
                :placeholder="`请选择${column.DISPLAY_NAME}`"
                allow-clear
                style="width: 100%"
              />

              <!-- 日期时间选择 -->
              <a-date-picker
                v-else-if="column.CONTROL_TYPE === 'datetime'"
                v-model="queryForm[column.DB_NAME]"
                :placeholder="`请选择${column.DISPLAY_NAME}`"
                show-time
                allow-clear
                style="width: 100%"
              />

              <!-- 默认文本输入 -->
              <a-input
                v-else
                v-model="queryForm[column.DB_NAME]"
                :placeholder="`请输入${column.DISPLAY_NAME}`"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 查询按钮区域 - 固定在右下角 -->
        <div class="query-actions">
          <a-space>
            <a-button
              v-if="queryColumns.length > 4"
              type="text"
              @click="showAdvancedQuery = !showAdvancedQuery"
            >
              {{ showAdvancedQuery ? '收起' : '展开' }}
              <icon-down v-if="!showAdvancedQuery" />
              <icon-up v-else />
            </a-button>
            <a-button @click="handleReset">
              <template #icon><icon-refresh /></template>
              重置
            </a-button>
            <a-button
              type="primary"
              html-type="submit"
              :loading="loading"
            >
              <template #icon><icon-search /></template>
              查询
            </a-button>
          </a-space>
        </div>
      </a-form>
    </div>

    <!-- 工具栏 -->
    <div v-if="showToolbar" class="dynamic-table__toolbar">
      <div class="toolbar-left">
        <a-space>
          <!-- 新增按钮 -->
          <a-button
            v-if="canCreate"
            type="primary"
            @click="handleCreate"
          >
            <template #icon><icon-plus /></template>
            新增
          </a-button>

          <!-- 批量删除按钮 -->
          <a-button
            v-if="canDelete && hasSelection"
            status="danger"
            @click="handleBatchDelete"
          >
            <template #icon><icon-delete /></template>
            批量删除 ({{ selectedCount }})
          </a-button>

          <!-- 导出按钮 -->
          <a-button
            v-if="showExport"
            @click="handleExport"
          >
            <template #icon><icon-download /></template>
            导出
          </a-button>

          <!-- 自定义工具栏插槽 -->
          <slot name="toolbar-left" />
        </a-space>
      </div>

      <div class="toolbar-right">
        <a-space>
          <!-- 自定义工具栏右侧插槽 -->
          <slot name="toolbar-right" />

          <!-- 列设置 -->
          <a-tooltip content="列设置">
            <a-button
              type="text"
              @click="showColumnSettings = true"
            >
              <template #icon><icon-settings /></template>
            </a-button>
          </a-tooltip>

          <!-- 刷新 -->
          <a-tooltip content="刷新">
            <a-button
              type="text"
              :loading="loading"
              @click="handleRefresh"
            >
              <template #icon><icon-refresh /></template>
            </a-button>
          </a-tooltip>
        </a-space>
      </div>
    </div>

    <!-- 表格 -->
    <a-table
      :columns="visibleColumns"
      :data="records"
      :loading="loading"
      :pagination="paginationConfig"
      :row-selection="rowSelectionConfig"
      :bordered="bordered"
      :stripe="stripe"
      :hoverable="hoverable"
      :row-key="pkField"
      :size="size"
      style="width: 100%;"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @sorter-change="handleSorterChange"
      @selection-change="handleSelectionChange"
    >
      <!-- 自定义选择列：复选框 + 序号 -->
      <template #selection-cell="{ rowIndex }">
        <div class="selection-cell">
          {{ (pagination.page - 1) * pagination.pageSize + rowIndex + 1 }}
        </div>
      </template>

      <!-- 状态列自定义渲染 -->
      <template #status="{ record, column }">
        <a-tag
          :color="getStatusColor(record[column.dataIndex])"
        >
          {{ getStatusText(record[column.dataIndex]) }}
        </a-tag>
      </template>

      <!-- 日期列自定义渲染 -->
      <template #date="{ record, column }">
        {{ formatDate(record[column.dataIndex]) }}
      </template>

      <!-- 日期时间列自定义渲染 -->
      <template #datetime="{ record, column }">
        {{ formatDateTime(record[column.dataIndex]) }}
        <!-- DEBUG: column={{ column.dataIndex }}, value={{ record[column.dataIndex] }} -->
      </template>

      <!-- 操作列 -->
      <template #actions="{ record }">
        <a-space>
          <!-- 查看 -->
          <a-button
            type="text"
            size="small"
            @click="handleView(record)"
          >
            查看
          </a-button>

          <!-- 编辑 -->
          <a-button
            v-if="canEdit"
            type="text"
            size="small"
            @click="handleEdit(record)"
          >
            编辑
          </a-button>

          <!-- 删除 -->
          <a-popconfirm
            v-if="canDelete"
            content="确定要删除这条记录吗？"
            @ok="handleDelete(record)"
          >
            <a-button
              type="text"
              status="danger"
              size="small"
            >
              删除
            </a-button>
          </a-popconfirm>

          <!-- 自定义操作插槽 -->
          <slot name="actions" :record="record" />
        </a-space>
      </template>

      <!-- 自定义单元格插槽 -->
      <template
        v-for="column in customColumns"
        :key="column.dataIndex"
        #[column.dataIndex]="{ record }"
      >
        <slot
          :name="column.dataIndex"
          :record="record"
          :column="column"
        />
      </template>
    </a-table>

    <!-- 列设置抽屉 -->
    <a-drawer
      v-model:visible="showColumnSettings"
      title="列设置"
      width="400px"
      @ok="handleApplyColumnSettings"
      @cancel="showColumnSettings = false"
    >
      <a-checkbox-group
        v-model="selectedColumnKeys"
        direction="vertical"
      >
        <a-checkbox
          v-for="column in allColumns"
          :key="column.dataIndex"
          :value="column.dataIndex"
        >
          {{ column.title }}
        </a-checkbox>
      </a-checkbox-group>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconPlus,
  IconDelete,
  IconDownload,
  IconSettings,
  IconRefresh,
  IconSearch,
  IconDown,
  IconUp
} from '@arco-design/web-vue/es/icon'
import { useDynamicList } from '../../composables'
import { useDynamicTableStore } from '../../stores'
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from '@/utils/format'
import type { TableColumnData } from '@arco-design/web-vue'
import type { FormData } from '../../types'

// ==================== Props ====================

interface Props {
  tableId: number                    // 表单ID
  filters?: Record<string, any>      // 筛选条件
  pageSize?: number                  // 每页条数
  showToolbar?: boolean              // 显示工具栏
  showExport?: boolean               // 显示导出按钮
  bordered?: boolean                 // 显示边框
  stripe?: boolean                   // 斑马纹
  hoverable?: boolean                // 悬停效果
  size?: 'mini' | 'small' | 'medium' | 'large'  // 表格尺寸
  customColumns?: string[]           // 自定义列（使用插槽）
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  showToolbar: true,
  showExport: true,
  bordered: true,
  stripe: true,
  hoverable: true,
  size: 'medium',
  customColumns: () => []
})

// ==================== Emits ====================

const emit = defineEmits<{
  create: []
  view: [record: FormData]
  edit: [record: FormData]
  delete: [record: FormData]
  'selection-change': [keys: (string | number)[]]
}>()

// ==================== 使用 Composable ====================

const {
  tableConfig,
  records,
  pagination,
  loading,
  selectedRowKeys,
  hasSelection,
  selectedCount,
  tableColumns,
  queryColumns,
  pkField,
  tableName,
  displayName,
  canCreate,
  canEdit,
  canDelete,
  loadData,
  refresh,
  handlePageChange,
  handlePageSizeChange,
  handleSortChange,
  handleSelectionChange: onSelectionChange,
  handleDelete: onDelete,
  handleBatchDelete: onBatchDelete
} = useDynamicList(props.tableId)

// ==================== 状态 ====================

const showColumnSettings = ref(false)
const selectedColumnKeys = ref<string[]>([])
const allColumns = ref<TableColumnData[]>([])

// 查询相关状态
const queryForm = ref<Record<string, any>>({})
const showAdvancedQuery = ref(false)

// ==================== 计算属性 ====================

/**
 * 可见的查询字段（支持展开/收起）
 */
const visibleQueryColumns = computed(() => {
  if (showAdvancedQuery.value) {
    return queryColumns.value
  }
  // 默认只显示前4个
  return queryColumns.value.slice(0, 4)
})

/**
 * 表格列配置
 */
const columns = computed<TableColumnData[]>(() => {
  const cols: TableColumnData[] = []

  // 不再添加独立的序号列，序号将与复选框合并显示

  // 业务列
  tableColumns.value.forEach(column => {
    const col: TableColumnData = {
      title: column.title,
      dataIndex: column.dataIndex,
      // 不设置固定宽度，让列动态分配剩余空间
      // width: column.width || 150,
      ellipsis: column.ellipsis,
      tooltip: column.tooltip,
      sortable: column.sortable ? { sortDirections: ['ascend', 'descend'] } : undefined,
      align: getColumnAlign(column.dataIndex)
    }

    // 自定义渲染
    if (isStatusColumn(column.dataIndex)) {
      col.slotName = 'status'
    } else if (isDateColumn(column.dataIndex)) {
      col.slotName = 'date'
    } else if (isDateTimeColumn(column.dataIndex)) {
      col.slotName = 'datetime'
    } else if (props.customColumns.includes(column.dataIndex)) {
      col.slotName = column.dataIndex
    }

    cols.push(col)
  })

  // 操作列
  cols.push({
    title: '操作',
    dataIndex: 'actions',
    width: 200,
    align: 'center',
    fixed: 'right',
    slotName: 'actions'
  })

  return cols
})

/**
 * 可见列
 */
const visibleColumns = computed(() => {
  if (selectedColumnKeys.value.length === 0) {
    return columns.value
  }
  return columns.value.filter(col =>
    col.dataIndex === 'actions' ||
    selectedColumnKeys.value.includes(col.dataIndex as string)
  )
})

/**
 * 分页配置
 */
const paginationConfig = computed(() => ({
  current: pagination.value.page,
  pageSize: pagination.value.pageSize,
  total: pagination.value.total,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50, 100],
  // 自定义总数显示
  showTotalText: (total: number) => `共 ${total} 条数据`
}))

/**
 * 行选择配置
 */
const rowSelectionConfig = computed(() => ({
  type: 'checkbox' as const,
  showCheckedAll: true,
  selectedRowKeys: selectedRowKeys.value
}))

/**
 * 滚动配置
 */
const scrollConfig = computed(() => {
  // 不设置固定总宽度，让表格自适应
  return {
    x: '100%'  // 使用百分比而不是固定宽度
  }
})

// ==================== 方法 ====================

/**
 * 判断是否为状态列
 */
function isStatusColumn(dataIndex: string): boolean {
  if (!dataIndex) return false
  return dataIndex.toUpperCase().includes('STATUS') ||
         dataIndex.toUpperCase().includes('STATE') ||
         dataIndex === 'IS_ACTIVE'
}

/**
 * 判断是否为日期列
 */
function isDateColumn(dataIndex: string): boolean {
  const column = tableConfig.value?.columns.find(c => c.DB_NAME === dataIndex)
  return column?.CONTROL_TYPE === 'date'
}

/**
 * 判断是否为日期时间列
 */
function isDateTimeColumn(dataIndex: string): boolean {
  // 常见的时间字段名（系统审计字段）- 支持大写下划线和小写驼峰两种格式
  const commonDateTimeFields = [
    'CREATE_TIME', 'UPDATE_TIME', 'CREATED_AT', 'UPDATED_AT',
    'createTime', 'updateTime', 'createdAt', 'updatedAt'
  ]

  const upperDataIndex = dataIndex.toUpperCase()
  if (commonDateTimeFields.includes(dataIndex) ||
      upperDataIndex === 'CREATE_TIME' ||
      upperDataIndex === 'UPDATE_TIME') {
    console.log(`[DynamicTable] ${dataIndex} 识别为系统时间字段`)
    return true
  }

  const column = tableConfig.value?.columns.find(c => c.DB_NAME === dataIndex)
  const isDateTime = column?.CONTROL_TYPE === 'datetime'
  if (isDateTime) {
    console.log(`[DynamicTable] ${dataIndex} 识别为datetime类型字段`)
  }
  return isDateTime
}

/**
 * 获取列对齐方式
 */
function getColumnAlign(dataIndex: string): 'left' | 'center' | 'right' {
  const column = tableConfig.value?.columns.find(c => c.DB_NAME === dataIndex)
  if (!column) return 'left'

  // 数字类型右对齐
  if (column.CONTROL_TYPE === 'number') {
    return 'right'
  }

  // 状态、操作等居中
  if (isStatusColumn(dataIndex)) {
    return 'center'
  }

  return 'left'
}

/**
 * 获取状态颜色
 */
function getStatusColor(value: any): string {
  if (value === 'Y' || value === '1' || value === true || value === 'active' || value === '启用') {
    return 'green'
  }
  if (value === 'N' || value === '0' || value === false || value === 'inactive' || value === '禁用') {
    return 'red'
  }
  return 'gray'
}

/**
 * 获取状态文本
 */
function getStatusText(value: any): string {
  if (value === 'Y' || value === '1' || value === true || value === 'active') {
    return '启用'
  }
  if (value === 'N' || value === '0' || value === false || value === 'inactive') {
    return '禁用'
  }
  return String(value || '-')
}

/**
 * 格式化日期
 */
function formatDate(value: any): string {
  return formatDateUtil(value)
}

/**
 * 格式化日期时间
 */
function formatDateTime(value: any): string {
  return formatDateTimeUtil(value)
}

/**
 * 查询
 */
async function handleQuery() {
  try {
    const tableStore = useDynamicTableStore()

    // 更新 store 中的 filters
    tableStore.filters = { ...queryForm.value }

    // 重置到第一页
    tableStore.pagination.page = 1

    // 重新加载数据
    await tableStore.loadRecords(tableName.value)

    Message.success('查询成功')
  } catch (error: any) {
    Message.error(error.message || '查询失败')
  }
}

/**
 * 重置查询条件
 */
async function handleReset() {
  // 清空查询表单
  queryForm.value = {}

  try {
    const tableStore = useDynamicTableStore()

    // 清空 store 中的 filters
    tableStore.filters = {}

    // 重置到第一页
    tableStore.pagination.page = 1

    // 重新加载数据
    await tableStore.loadRecords(tableName.value)

    Message.success('已重置')
  } catch (error: any) {
    Message.error(error.message || '重置失败')
  }
}

/**
 * 新增
 */
function handleCreate() {
  emit('create')
}

/**
 * 查看
 */
function handleView(record: FormData) {
  emit('view', record)
}

/**
 * 编辑
 */
function handleEdit(record: FormData) {
  emit('edit', record)
}

/**
 * 删除
 */
async function handleDelete(record: FormData) {
  try {
    await onDelete(record)
    emit('delete', record)
  } catch (error: any) {
    // 错误已在 composable 中处理
  }
}

/**
 * 批量删除
 */
async function handleBatchDelete() {
  const confirmed = await Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedCount.value} 条记录吗？此操作不可恢复。`,
    okButtonProps: { status: 'danger' }
  })

  if (confirmed) {
    try {
      await onBatchDelete()
      Message.success('批量删除成功')
    } catch (error: any) {
      // 错误已在 composable 中处理
    }
  }
}

/**
 * 导出
 */
function handleExport() {
  Message.info('导出功能开发中')
  // TODO: 实现导出逻辑
}

/**
 * 刷新
 */
async function handleRefresh() {
  try {
    await refresh()
  } catch (error: any) {
    // 错误已在 composable 中处理
  }
}

/**
 * 排序变化
 */
function handleSorterChange(dataIndex: string, direction: string) {
  const order = direction === 'ascend' ? 'asc' : direction === 'descend' ? 'desc' : null
  handleSortChange(dataIndex, order as any)
}

/**
 * 选中变化
 */
function handleSelectionChange(keys: (string | number)[]) {
  onSelectionChange(keys)
  emit('selection-change', keys)
}

/**
 * 应用列设置
 */
function handleApplyColumnSettings() {
  showColumnSettings.value = false
  Message.success('列设置已保存')
}

/**
 * 初始化列设置
 */
function initColumnSettings() {
  allColumns.value = columns.value.filter(col =>
    col.dataIndex !== 'index' && col.dataIndex !== 'actions'
  )
  selectedColumnKeys.value = allColumns.value.map(col => col.dataIndex as string)
}

// ==================== 生命周期 ====================

/**
 * 设置单个单元格的宽度
 */
function setCellWidth(el: HTMLElement, width: number) {
  const widthPx = `${width}px`
  // 使用 cssText 完全覆盖样式，并添加 !important
  el.style.cssText = `width: ${widthPx} !important; min-width: ${widthPx} !important; max-width: ${widthPx} !important; flex: 0 0 ${widthPx} !important;`
  // 再次强制设置，确保生效
  el.setAttribute('width', String(width))
}

/**
 * 强制设置选择框和序号列宽度
 */
async function forceSetColumnWidth() {
  await nextTick()

  // 再次延迟确保 ArcoDesign 完成渲染
  setTimeout(() => {
    console.log('[DynamicTable] 开始设置列宽')
    const container = document.querySelector('.dynamic-table')
    if (!container) {
      console.warn('[DynamicTable] 未找到容器')
      return
    }

    // 设置表格为 100% 宽度
    const tableElements = container.querySelectorAll('.arco-table-element')
    tableElements.forEach(table => {
      const el = table as HTMLElement
      el.style.width = '100%'
      el.style.minWidth = '100%'

      // 使用 colgroup 设置列宽
      let colgroup = table.querySelector('colgroup')
      if (!colgroup) {
        colgroup = document.createElement('colgroup')
        table.insertBefore(colgroup, table.firstChild)
      }

      // 清空现有 col
      colgroup.innerHTML = ''

      // 获取列数
      const headerRow = table.querySelector('thead tr')
      if (headerRow) {
        const colCount = headerRow.children.length

        for (let i = 0; i < colCount; i++) {
          const col = document.createElement('col')
          if (i === 0) {
            // 第一列：选择框
            col.style.width = '50px'
            col.setAttribute('width', '50')
          } else if (i === 1) {
            // 第二列：序号
            col.style.width = '70px'
            col.setAttribute('width', '70')
          }
          // 其他列不设置宽度，让它们自动分配
          colgroup.appendChild(col)
        }
      }
    })

    // 设置所有第一列（选择框）
    const firstCols = container.querySelectorAll('th:first-child, td:first-child')
    console.log('[DynamicTable] 第一列单元格数量:', firstCols.length)
    firstCols.forEach(cell => {
      setCellWidth(cell as HTMLElement, 50)
    })

    // 设置所有第二列（序号）
    const secondCols = container.querySelectorAll('th:nth-child(2), td:nth-child(2)')
    console.log('[DynamicTable] 第二列单元格数量:', secondCols.length)
    secondCols.forEach(cell => {
      const el = cell as HTMLElement
      setCellWidth(el, 70)
      if (el.classList.contains('arco-table-col-fixed-left')) {
        el.style.left = '50px'
      }
    })

    console.log('[DynamicTable] 列宽设置完成')

    // 使用 MutationObserver 监控样式变化并强制重设
    const observer = new MutationObserver(() => {
      const firstColsCheck = container.querySelectorAll('th:first-child, td:first-child')
      firstColsCheck.forEach(cell => {
        const el = cell as HTMLElement
        if (el.style.width !== '50px') {
          setCellWidth(el, 50)
        }
      })

      const secondColsCheck = container.querySelectorAll('th:nth-child(2), td:nth-child(2)')
      secondColsCheck.forEach(cell => {
        const el = cell as HTMLElement
        if (el.style.width !== '70px') {
          setCellWidth(el, 70)
          if (el.classList.contains('arco-table-col-fixed-left')) {
            el.style.left = '50px'
          }
        }
      })
    })

    // 开始监控
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true
    })

    console.log('[DynamicTable] 开始监控列宽变化')
  }, 200)
}

onMounted(() => {
  initColumnSettings()
  forceSetColumnWidth()
})

// 监听数据变化后重新设置列宽
watch(
  () => records.value,
  () => {
    forceSetColumnWidth()
  }
)

// 监听列变化
watch(
  () => columns.value,
  () => {
    if (selectedColumnKeys.value.length === 0) {
      initColumnSettings()
    }
  }
)

// ==================== 暴露方法 ====================

defineExpose({
  refresh,
  loadData
})
</script>

<style scoped>
.dynamic-table {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

/* 选择列：复选框 + 序号 */
.selection-cell {
  display: inline-block;
  margin-left: 8px;
  color: #86909c;
  font-size: 14px;
}

/* 查询区域 */
.dynamic-table__query {
  flex-shrink: 0;
  padding: 0;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  margin-bottom: 16px;
}

.query-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(to right, #f7f8fa, #ffffff);
  border-bottom: 1px solid #e5e6eb;
  border-radius: 4px 4px 0 0;
}

.query-icon {
  font-size: 16px;
  color: #3370ff;
  margin-right: 8px;
}

.query-title {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.dynamic-table__query :deep(.arco-form) {
  padding: 16px;
  padding-bottom: 60px; /* 为按钮区域留出空间 */
  position: relative;
}

.dynamic-table__query :deep(.arco-form-item) {
  margin-bottom: 0;
}

.dynamic-table__query .query-row {
  width: 100%;
}

.query-actions {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  justify-content: flex-end;
}

.dynamic-table__toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}

/* 表格容器 - 支持固定列 */
.dynamic-table :deep(.arco-table-container) {
  flex: 1;
  overflow: auto;
}

.dynamic-table :deep(.arco-table) {
  width: 100%;
  table-layout: auto;
}

.dynamic-table :deep(.arco-table-element) {
  table-layout: auto !important;
  width: 100% !important;
  min-width: 100% !important;
}

/* 表格样式优化 */
.dynamic-table :deep(.arco-table) {
  border-radius: 0 0 4px 4px;
}

/* 表格单元格不换行 */
.dynamic-table :deep(.arco-table-td),
.dynamic-table :deep(.arco-table-th) {
  white-space: nowrap;
}

.dynamic-table :deep(.arco-table-td-content),
.dynamic-table :deep(.arco-table-th-content) {
  white-space: nowrap;
}

.dynamic-table :deep(.arco-table-th) {
  background: #fafafa;
  font-weight: 600;
  color: var(--color-text-1);
  padding: 5px 12px;
  height: 30px;
  line-height: 20px;
}

.dynamic-table :deep(.arco-table-tr:hover) {
  background: #e6f7ff;
}

.dynamic-table :deep(.arco-table-tr.arco-table-tr-checked) {
  background: #bae7ff;
}

.dynamic-table :deep(.arco-table-td) {
  padding: 5px 12px;
  height: 30px;
  line-height: 20px;
}

/* 操作按钮样式 */
.dynamic-table :deep(.arco-btn-text) {
  padding: 4px 8px;
}

.dynamic-table :deep(.arco-btn-text):hover {
  background: rgba(var(--primary-6), 0.1);
}

/* 选择框列宽度固定 */
.dynamic-table :deep(.arco-table-th.arco-table-operation),
.dynamic-table :deep(.arco-table-td.arco-table-operation),
.dynamic-table :deep(.arco-table-th.arco-table-col-fixed-left:nth-of-type(1)),
.dynamic-table :deep(.arco-table-td.arco-table-col-fixed-left:nth-of-type(1)) {
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
  flex: 0 0 50px !important;
}

/* 序号列宽度固定 */
.dynamic-table :deep(.arco-table-th.arco-table-col-fixed-left-last),
.dynamic-table :deep(.arco-table-td.arco-table-col-fixed-left-last),
.dynamic-table :deep(.arco-table-th.arco-table-col-fixed-left:nth-of-type(2)),
.dynamic-table :deep(.arco-table-td.arco-table-col-fixed-left:nth-of-type(2)) {
  width: 70px !important;
  min-width: 70px !important;
  max-width: 70px !important;
  flex: 0 0 70px !important;
  left: 50px !important;
}

/* 固定列样式 - 使用 Arco Design 原生支持 */
.dynamic-table :deep(.arco-table-th-fixed-left),
.dynamic-table :deep(.arco-table-td-fixed-left) {
  position: sticky !important;
  left: 0 !important;
  z-index: 2 !important;
  background: #fff !important;
}

.dynamic-table :deep(.arco-table-th-fixed-right),
.dynamic-table :deep(.arco-table-td-fixed-right) {
  position: sticky !important;
  right: 0 !important;
  z-index: 2 !important;
  background: #fff !important;
}

.dynamic-table :deep(.arco-table-th-fixed-left),
.dynamic-table :deep(.arco-table-th-fixed-right) {
  background: #fafafa !important;
}

/* 固定列阴影效果 */
.dynamic-table :deep(.arco-table-td-fixed-left::after) {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 30px;
  transform: translateX(100%);
  transition: box-shadow 0.3s;
  content: '';
  pointer-events: none;
}

.dynamic-table :deep(.arco-table-td-fixed-right::before) {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 30px;
  transform: translateX(-100%);
  transition: box-shadow 0.3s;
  content: '';
  pointer-events: none;
}

/* 分页样式 */
.dynamic-table :deep(.arco-pagination) {
  padding: 16px;
  justify-content: flex-end;
}

/* 状态标签样式 */
.dynamic-table :deep(.arco-tag) {
  border: none;
}

/* 复选框样式 */
.dynamic-table :deep(.arco-checkbox) {
  --color-primary: #2b9e91;
}

/* 空状态样式 */
.dynamic-table :deep(.arco-empty) {
  padding: 48px 0;
}

/* 加载状态样式 */
.dynamic-table :deep(.arco-spin) {
  min-height: 300px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dynamic-table__toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .dynamic-table :deep(.arco-table-td) {
    padding: 8px 12px;
  }

  .dynamic-table :deep(.arco-pagination) {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
