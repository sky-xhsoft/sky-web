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
            :key="column.DB_NAME || column.dbName"
            :span="6"
          >
            <a-form-item
              :label="column.DISPLAY_NAME || column.displayName"
              :field="column.DB_NAME || column.dbName"
            >
              <!-- 外键下拉选择 -->
              <ForeignKeyField
                v-if="isForeignKeyColumn(column)"
                :column="column"
                :model-value="queryForm[column.DB_NAME || column.dbName]"
                mode="edit"
                @update:model-value="val => queryForm[column.DB_NAME || column.dbName] = val"
              />

              <!-- 文本输入 -->
              <a-input
                v-else-if="column.CONTROL_TYPE === 'text' || column.CONTROL_TYPE === 'email' || column.CONTROL_TYPE === 'url'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请输入${column.DISPLAY_NAME || column.displayName}`"
                allow-clear
              />

              <!-- 数字输入 -->
              <a-input-number
                v-else-if="column.CONTROL_TYPE === 'number'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请输入${column.DISPLAY_NAME || column.displayName}`"
                style="width: 100%"
              />

              <!-- 下拉选择 -->
              <a-select
                v-else-if="column.CONTROL_TYPE === 'select'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请选择${column.DISPLAY_NAME || column.displayName}`"
                allow-clear
              >
                <!-- TODO: 加载字典数据 -->
                <a-option value="Y">是</a-option>
                <a-option value="N">否</a-option>
              </a-select>

              <!-- 日期选择 -->
              <a-date-picker
                v-else-if="column.CONTROL_TYPE === 'date'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请选择${column.DISPLAY_NAME || column.displayName}`"
                allow-clear
                style="width: 100%"
              />

              <!-- 日期时间选择 -->
              <a-date-picker
                v-else-if="column.CONTROL_TYPE === 'datetime'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请选择${column.DISPLAY_NAME || column.displayName}`"
                show-time
                allow-clear
                style="width: 100%"
              />

              <!-- 默认文本输入 -->
              <a-input
                v-else
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请输入${column.DISPLAY_NAME || column.displayName}`"
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

          <!-- 自定义工具栏插槽 -->
          <slot name="toolbar-left" />
        </a-space>
      </div>

      <div class="toolbar-right">
        <a-space>
          <!-- 提交按钮 -->
          <a-button
            v-if="canSubmit"
            type="primary"
            @click="handleSubmit"
          >
            提交
          </a-button>

          <!-- 反提交按钮 -->
          <a-button
            v-if="canUnsubmit"
            @click="handleUnsubmit"
          >
            反提交
          </a-button>

          <!-- 自定义工具栏右侧插槽 -->
          <slot name="toolbar-right" />

          <!-- 更多操作 -->
          <a-dropdown :popup-max-height="false">
            <a-button type="text">
              <template #icon><icon-more /></template>
              更多
            </a-button>
            <template #content>
              <a-doption v-if="canDelete" status="danger" @click="handleBatchDelete">
                <template #icon><icon-delete /></template>
                删除
              </a-doption>
              <a-doption v-if="canImport" @click="handleImport">
                <template #icon><icon-upload /></template>
                导入
              </a-doption>
              <a-doption v-if="canExport" @click="handleExport">
                <template #icon><icon-download /></template>
                导出
              </a-doption>
              <a-doption v-if="canPrint" @click="handlePrint">
                <template #icon><icon-printer /></template>
                套打
              </a-doption>
              <a-doption v-if="canCreate" @click="handleCopy">
                <template #icon><icon-copy /></template>
                复制
              </a-doption>
              <a-doption v-if="canEdit" @click="handleBatchEdit">
                <template #icon><icon-edit /></template>
                修改选中行
              </a-doption>
              <a-doption v-if="canEdit" @click="handleBatchEditAll">
                <template #icon><icon-edit /></template>
                修改结果集
              </a-doption>
            </template>
          </a-dropdown>

          <!-- 列设置 -->
          <a-popover
            v-model:popup-visible="showColumnSettings"
            trigger="click"
            position="bl"
            :popup-container="'body'"
          >
            <a-tooltip content="列设置">
              <a-button type="text">
                <template #icon><icon-settings /></template>
              </a-button>
            </a-tooltip>
            <template #content>
              <div class="column-settings-popover">
                <div class="settings-header">
                  <span>列设置</span>
                </div>
                <div class="settings-body">
                  <div
                    v-for="(column, index) in allColumns"
                    :key="column.dataIndex"
                    class="column-item"
                    draggable="true"
                    @dragstart="handleDragStart(index)"
                    @dragover.prevent
                    @drop="handleDrop(index)"
                  >
                    <icon-drag-dot-vertical class="drag-handle" />
                    <a-checkbox
                      :model-value="selectedColumnKeys.includes(column.dataIndex as string)"
                      @change="(checked) => handleColumnToggle(column.dataIndex as string, checked)"
                    >
                      {{ column.title }}
                    </a-checkbox>
                  </div>
                </div>
                <div class="settings-footer">
                  <a-button type="text" size="small" @click="handleResetColumns">
                    重置
                  </a-button>
                </div>
              </div>
            </template>
          </a-popover>

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
      show-sorter-tooltip
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

      <!-- 外键列自定义渲染 -->
      <template #foreignkey="{ record, column }">
        <!-- 优先使用后端返回的 _display 字段 -->
        <span v-if="record[column.dataIndex + '_display']">
          {{ record[column.dataIndex + '_display'] }}
        </span>
        <!-- 降级到前端查询 -->
        <ForeignKeyCell
          v-else
          :column-config="column"
          :value="record[column.dataIndex]"
        />
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

      <!-- 动态表头插槽 - 显示排序序号和箭头 -->
      <template
        v-for="column in tableColumns"
        :key="`title-${column.dataIndex}`"
        #[`title-${column.dataIndex}`]
      >
        <span
          style="display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none;"
          @click="handleHeaderClick(column.dataIndex)"
        >
          <span>{{ column.title }}</span>
          <template v-if="columnSorters[column.dataIndex]">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 16px; padding: 0 4px; background: #3370ff; color: white; border-radius: 2px; font-size: 12px; line-height: 1;">
              {{ columnSorters[column.dataIndex]?.priority }}
            </span>
            <icon-arrow-up
              v-if="columnSorters[column.dataIndex]?.direction === 'ascend'"
              style="font-size: 12px; color: #3370ff; flex-shrink: 0;"
            />
            <icon-arrow-down
              v-else
              style="font-size: 12px; color: #3370ff; flex-shrink: 0;"
            />
          </template>
        </span>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconPlus,
  IconDelete,
  IconDownload,
  IconUpload,
  IconMore,
  IconSettings,
  IconRefresh,
  IconSearch,
  IconDown,
  IconUp,
  IconInfoCircle,
  IconPrinter,
  IconCopy,
  IconEdit,
  IconDragDotVertical,
  IconClose,
  IconArrowUp,
  IconArrowDown
} from '@arco-design/web-vue/es/icon'
import { useDynamicList } from '../../composables'
import { useDynamicTableStore } from '../../stores'
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from '@/utils/format'
import ForeignKeyCell from './ForeignKeyCell.vue'
import ForeignKeyField from '../FieldRenderers/ForeignKeyField.vue'
import type { TableColumnData } from '@arco-design/web-vue'
import type { FormData, SysColumn } from '../../types'

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
  canExport,
  canImport,
  canPrint,
  canSubmit,
  canUnsubmit,
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
const draggedIndex = ref<number>(-1)

// 排序状态（跟踪多字段排序）
// 存储格式：{ field: { direction, priority } }
const columnSorters = ref<Record<string, { direction: 'ascend' | 'descend', priority: number }>>({})

// 查询相关状态
const queryForm = ref<Record<string, any>>({})
const showAdvancedQuery = ref(false)

// ==================== 计算属性 ====================

/**
 * 已排序的列（用于显示表头插槽）
 */
const sortedColumns = computed(() => {
  return tableColumns.value.filter(col => columnSorters.value[col.dataIndex])
})

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
    const sorterInfo = columnSorters.value[column.dataIndex]

    const col: TableColumnData = {
      title: column.title,
      dataIndex: column.dataIndex,
      width: column.width || 180,
      ellipsis: true,
      tooltip: true,
      align: getColumnAlign(column.dataIndex)
    }

    // 如果列可排序，添加自定义表头插槽
    if (column.sortable) {
      col.titleSlotName = `title-${column.dataIndex}`
    }

    // 获取原始列配置（用于判断外键等特殊类型）
    const originalColumn = tableConfig.value?.columns.find(c => {
      const dbName = c.DB_NAME || (c as any).dbName
      return dbName === column.dataIndex
    })

    // 自定义渲染
    const setValueType = originalColumn?.SET_VALUE_TYPE || (originalColumn as any)?.setValueType
    if (setValueType === 'fk') {
      // 外键列
      col.slotName = 'foreignkey'
      // 保存原始列配置到 col，供 slot 使用
      ;(col as any).originalColumn = originalColumn
    } else if (isStatusColumn(column.dataIndex)) {
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
 * 可见列（按 allColumns 顺序排列）
 */
const visibleColumns = computed(() => {
  if (selectedColumnKeys.value.length === 0) {
    return columns.value
  }

  // 固定列（选择列和操作列）
  const fixedCols = columns.value.filter(col =>
    col.dataIndex === '__selection_index__' || col.dataIndex === 'actions'
  )

  // 业务列按 allColumns 顺序排列，但使用 columns.value 中的最新配置（包含排序序号）
  const businessCols = allColumns.value
    .filter(col => selectedColumnKeys.value.includes(col.dataIndex as string))
    .map(col => {
      // 从 columns.value 中找到对应的列配置（包含排序序号）
      return columns.value.find(c => c.dataIndex === col.dataIndex) || col
    })

  // 组合：选择列 + 业务列（按顺序） + 操作列
  const selectionCol = fixedCols.find(col => col.dataIndex === '__selection_index__')
  const actionCol = fixedCols.find(col => col.dataIndex === 'actions')

  return [
    ...(selectionCol ? [selectionCol] : []),
    ...businessCols,
    ...(actionCol ? [actionCol] : [])
  ]
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
  // 计算所有列的总宽度
  const totalWidth = columns.value.reduce((sum, col) => {
    return sum + (col.width || 180)
  }, 0)

  return {
    x: totalWidth,  // 水平滚动：设置为所有列宽度之和
    y: 'calc(100vh - 380px)'  // 竖向滚动：根据视口高度自动计算
  }
})

/**
 * 默认排序配置（用于显示多排序序号）
 */
const defaultSorters = computed(() => {
  const result = Object.entries(columnSorters.value)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([field, sorter]) => ({
      dataIndex: field,
      direction: sorter.direction
    }))
  console.log('[DynamicTable] defaultSorters computed:', result)
  return result
})

// ==================== 方法 ====================

/**
 * 判断是否为外键列
 */
function isForeignKeyColumn(column: SysColumn): boolean {
  const setValueType = column.SET_VALUE_TYPE || (column as any).setValueType
  return setValueType === 'fk'
}

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
 * 导入
 */
function handleImport() {
  Message.info('导入功能开发中')
  // TODO: 实现导入逻辑
}

/**
 * 导出
 */
function handleExport() {
  Message.info('导出功能开发中')
  // TODO: 实现导出逻辑
}

/**
 * 套打
 */
function handlePrint() {
  Message.info('套打功能开发中')
  // TODO: 实现套打逻辑
}

/**
 * 复制
 */
function handleCopy() {
  Message.info('复制功能开发中')
  // TODO: 实现复制逻辑
}

/**
 * 修改选中行
 */
function handleBatchEdit() {
  if (!hasSelection.value) {
    Message.warning('请先选择要修改的记录')
    return
  }
  Message.info('修改选中行功能开发中')
  // TODO: 实现批量修改选中行逻辑
}

/**
 * 修改结果集
 */
function handleBatchEditAll() {
  Message.info('修改结果集功能开发中')
  // TODO: 实现批量修改结果集逻辑
}

/**
 * 提交
 */
function handleSubmit() {
  if (!hasSelection.value) {
    Message.warning('请先选择要提交的记录')
    return
  }
  Message.info('提交功能开发中')
  // TODO: 实现提交逻辑
}

/**
 * 反提交
 */
function handleUnsubmit() {
  if (!hasSelection.value) {
    Message.warning('请先选择要反提交的记录')
    return
  }
  Message.info('反提交功能开发中')
  // TODO: 实现反提交逻辑
}

/**
 * 刷新
 */
async function handleRefresh() {
  try {
    // 清空排序状态
    columnSorters.value = {}

    // 清空 store 中的排序
    const tableStore = useDynamicTableStore()
    tableStore.sorters = []

    await refresh()
  } catch (error: any) {
    // 错误已在 composable 中处理
  }
}

/**
 * 排序变化（支持多字段排序）
 */
function handleSorterChange(dataIndex: string, direction: string, sorterResult: any) {
  console.log('[DynamicTable] 排序事件触发:', { dataIndex, direction, sorterResult })

  const tableStore = useDynamicTableStore()

  // 更新当前字段的排序状态
  if (direction) {
    // 如果字段已存在，只更新方向，保持优先级
    if (columnSorters.value[dataIndex]) {
      columnSorters.value[dataIndex].direction = direction as 'ascend' | 'descend'
    } else {
      // 新增排序字段，优先级为当前最大优先级+1
      const maxPriority = Math.max(
        0,
        ...Object.values(columnSorters.value).map(s => s.priority)
      )
      columnSorters.value[dataIndex] = {
        direction: direction as 'ascend' | 'descend',
        priority: maxPriority + 1
      }
    }
  } else {
    // 取消排序，删除该字段
    delete columnSorters.value[dataIndex]

    // 重新调整优先级，保持连续性
    const sortedEntries = Object.entries(columnSorters.value)
      .sort(([, a], [, b]) => a.priority - b.priority)

    columnSorters.value = {}
    sortedEntries.forEach(([field, sorter], index) => {
      columnSorters.value[field] = {
        direction: sorter.direction,
        priority: index + 1
      }
    })
  }

  // 按优先级排序，收集所有有排序的字段
  const sorters = Object.entries(columnSorters.value)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([field, sorter]) => ({
      field,
      direction: sorter.direction
    }))

  console.log('[DynamicTable] 当前排序状态:', columnSorters.value)
  console.log('[DynamicTable] 发送排序参数:', sorters)

  // 发送到后端
  tableStore.updateSorters(tableName.value, sorters)
}

/**
 * 取消单个字段的排序
 */
function handleCancelSort(dataIndex: string) {
  // 删除该字段的排序
  delete columnSorters.value[dataIndex]

  // 重新调整优先级，保持连续性
  const sortedEntries = Object.entries(columnSorters.value)
    .sort(([, a], [, b]) => a.priority - b.priority)

  columnSorters.value = {}
  sortedEntries.forEach(([field, sorter], index) => {
    columnSorters.value[field] = {
      direction: sorter.direction,
      priority: index + 1
    }
  })

  // 按优先级排序，收集所有有排序的字段
  const sorters = Object.entries(columnSorters.value)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([field, sorter]) => ({
      field,
      direction: sorter.direction
    }))

  console.log('[DynamicTable] 取消排序:', dataIndex)
  console.log('[DynamicTable] 当前排序状态:', columnSorters.value)
  console.log('[DynamicTable] 发送排序参数:', sorters)

  // 发送到后端
  const tableStore = useDynamicTableStore()
  tableStore.updateSorters(tableName.value, sorters)
}

/**
 * 处理表头点击（切换排序）
 */
function handleHeaderClick(dataIndex: string) {
  console.log('[DynamicTable] 表头点击:', dataIndex)

  const tableStore = useDynamicTableStore()
  const current = columnSorters.value[dataIndex]

  if (!current) {
    // 没有排序，添加升序
    const maxPriority = Math.max(
      0,
      ...Object.values(columnSorters.value).map(s => s.priority)
    )
    columnSorters.value[dataIndex] = {
      direction: 'ascend',
      priority: maxPriority + 1
    }
  } else if (current.direction === 'ascend') {
    // 升序 -> 降序
    columnSorters.value[dataIndex].direction = 'descend'
  } else {
    // 降序 -> 取消排序
    delete columnSorters.value[dataIndex]

    // 重新调整优先级
    const sortedEntries = Object.entries(columnSorters.value)
      .sort(([, a], [, b]) => a.priority - b.priority)

    columnSorters.value = {}
    sortedEntries.forEach(([field, sorter], index) => {
      columnSorters.value[field] = {
        direction: sorter.direction,
        priority: index + 1
      }
    })
  }

  // 按优先级排序，收集所有有排序的字段
  const sorters = Object.entries(columnSorters.value)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([field, sorter]) => ({
      field,
      direction: sorter.direction
    }))

  console.log('[DynamicTable] 当前排序状态:', columnSorters.value)
  console.log('[DynamicTable] 发送排序参数:', sorters)

  // 发送到后端
  tableStore.updateSorters(tableName.value, sorters)
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
 * 列复选框切换
 */
function handleColumnToggle(key: string, checked: boolean) {
  if (checked) {
    if (!selectedColumnKeys.value.includes(key)) {
      selectedColumnKeys.value.push(key)
    }
  } else {
    const index = selectedColumnKeys.value.indexOf(key)
    if (index > -1) {
      selectedColumnKeys.value.splice(index, 1)
    }
  }
}

/**
 * 拖拽开始
 */
function handleDragStart(index: number) {
  draggedIndex.value = index
}

/**
 * 拖拽放下
 */
function handleDrop(targetIndex: number) {
  if (draggedIndex.value === -1 || draggedIndex.value === targetIndex) return

  const draggedItem = allColumns.value[draggedIndex.value]
  const newColumns = [...allColumns.value]
  newColumns.splice(draggedIndex.value, 1)
  newColumns.splice(targetIndex, 0, draggedItem)
  allColumns.value = newColumns

  draggedIndex.value = -1
}

/**
 * 重置列设置
 */
function handleResetColumns() {
  initColumnSettings()
  Message.success('已重置为默认设置')
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
  padding: 6px;
  border-bottom: 1px solid #e8e8e8;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}

/* 表格容器 - 支持固定列和滚动 */
.dynamic-table :deep(.arco-table-container) {
  flex: 1;
  overflow: auto;
}

/* 表格布局 - 使用固定布局以确保列对齐 */
.dynamic-table :deep(.arco-table-element) {
  table-layout: fixed !important;
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

/* 隐藏默认的排序图标 */
.dynamic-table :deep(.arco-table-sorter) {
  display: none;
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

/* 列设置 Popover 样式 */
.column-settings-popover {
  width: 150px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.settings-header {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e6eb;
  font-weight: 600;
  font-size: 14px;
  color: #1d2129;
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.column-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: move;
  user-select: none;
  transition: background-color 0.2s;
}

.column-item:hover {
  background-color: #f7f8fa;
}

.drag-handle {
  margin-right: 8px;
  color: #86909c;
  font-size: 14px;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.column-item :deep(.arco-checkbox) {
  flex: 1;
}

.settings-footer {
  padding: 8px 12px;
  border-top: 1px solid #e5e6eb;
  text-align: center;
}

.settings-footer :deep(.arco-btn-text) {
  color: #3370ff;
}
</style>
