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
      :bordered="bordered"
      :stripe="stripe"
      :hoverable="hoverable"
      :row-key="pkField"
      :size="size"
      :scroll="scrollConfig"
      style="width: 100%;"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @sorter-change="handleSorterChange"
    >
      <!-- 选择+序号列表头 -->
      <template #selection-index-title>
        <div class="selection-index-header">
          <a-checkbox
            :model-value="isAllSelected"
            :indeterminate="hasSelection && !isAllSelected"
            @change="handleSelectAll"
          />
          <span>序号</span>
        </div>
      </template>

      <!-- 选择+序号列 -->
      <template #__selection_index__="{ record, rowIndex }">
        <div class="selection-index-cell">
          <a-checkbox
            :model-value="selectedRowKeys.includes(record[pkField])"
            @change="(checked) => handleSingleSelect(record[pkField], checked)"
          />
          <span class="row-number">
            {{ (pagination.page - 1) * pagination.pageSize + rowIndex + 1 }}
          </span>
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

  // 添加自定义选择+序号列
  cols.push({
    title: '序号',
    dataIndex: '__selection_index__',
    width: 80,
    align: 'center',
    slotName: '__selection_index__',
    titleSlotName: 'selection-index-title',
    fixed: 'left'
  })

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
    col.dataIndex === '__selection_index__' ||
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
 * 滚动配置
 */
const scrollConfig = computed(() => {
  return {
    x: '100%',  // 水平滚动：使用百分比而不是固定宽度
    y: 'calc(100vh - 380px)'  // 竖向滚动：根据视口高度自动计算（减去顶部导航、面包屑、查询区、工具栏、分页的高度）
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
function handleBatchDelete() {
  if (!hasSelection.value) {
    Message.warning('请先选择要删除的记录')
    return
  }

  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedCount.value} 条记录吗？此操作不可恢复。`,
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      // 用户点击确定按钮后执行
      // onBatchDelete 内部已经处理了成功/失败提示
      await onBatchDelete()
    },
    onCancel: () => {
      // 用户点击取消按钮，不执行任何操作
    }
  })
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
 * 是否全选
 */
const isAllSelected = computed(() => {
  return records.value.length > 0 && selectedRowKeys.value.length === records.value.length
})

/**
 * 处理单行选择
 */
function handleSingleSelect(key: string | number, checked: boolean) {
  const keys = [...selectedRowKeys.value]
  if (checked) {
    if (!keys.includes(key)) {
      keys.push(key)
    }
  } else {
    const index = keys.indexOf(key)
    if (index > -1) {
      keys.splice(index, 1)
    }
  }
  onSelectionChange(keys)
  emit('selection-change', keys)
}

/**
 * 处理全选
 */
function handleSelectAll(checked: boolean) {
  const keys = checked ? records.value.map(r => r[pkField.value]) : []
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
    col.dataIndex !== '__selection_index__' && col.dataIndex !== 'actions'
  )
  selectedColumnKeys.value = allColumns.value.map(col => col.dataIndex as string)
}

// ==================== 生命周期 ====================

onMounted(() => {
  initColumnSettings()
})

// 监听列变化 - 当业务列加载后重新初始化
watch(
  () => columns.value.length,
  (newLength, oldLength) => {
    // 当列数量增加时（业务列加载完成），重新初始化
    if (newLength > oldLength) {
      initColumnSettings()
    }
  }
)

// 监听 tableId 变化 - 切换表时清空查询表单
watch(
  () => props.tableId,
  (newTableId, oldTableId) => {
    if (newTableId !== oldTableId && oldTableId !== undefined) {
      console.log('[DynamicTable] tableId 变化：', oldTableId, '->', newTableId)
      console.log('[DynamicTable] 清空前 queryForm=', JSON.stringify(queryForm.value))

      // 清空查询表单，避免旧表的查询字段带入新表
      queryForm.value = {}

      console.log('[DynamicTable] 清空后 queryForm=', JSON.stringify(queryForm.value))

      // 同时清空 store 的 filters（因为可能之前点过查询按钮）
      const tableStore = useDynamicTableStore()
      tableStore.filters = {}
      console.log('[DynamicTable] 已清空 tableStore.filters')
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

/* 选择+序号列样式 */
.selection-index-header,
.selection-index-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.selection-index-header span {
  font-weight: 600;
}

.row-number {
  color: #86909c;
  font-size: 14px;
  min-width: 24px;
  text-align: center;
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
