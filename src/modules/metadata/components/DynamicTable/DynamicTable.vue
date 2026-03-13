<!-- 动态表格组件 -->
<template>
  <div class="dynamic-table">
    <!-- 查询区域 - 始终显示 -->
    <div class="dynamic-table__query">
      <div class="query-header">
        <icon-search class="query-icon" />
        <span class="query-title">查询条件</span>
      </div>

      <a-form
        :model="queryForm"
        layout="inline"
        @submit="handleQuery"
        class="query-form"
      >
        <template v-if="queryColumns.length > 0">
          <a-form-item
            v-for="column in visibleQueryColumns"
            :key="column.DB_NAME || column.DB_NAME"
            :label="column.DISPLAY_NAME || column.DISPLAY_NAME"
            :field="column.DB_NAME || column.DB_NAME"
          >
              <!-- 外键下拉选择 -->
              <ForeignKeyField
                v-if="isForeignKeyColumn(column)"
                :column="column"
                :model-value="queryForm[column.DB_NAME || column.DB_NAME]"
                mode="edit"
                @update:model-value="val => queryForm[column.DB_NAME || column.DB_NAME] = val"
              />

              <!-- 文本输入 -->
              <a-input
                v-else-if="column.CONTROL_TYPE === 'text' || column.CONTROL_TYPE === 'email' || column.CONTROL_TYPE === 'url'"
                v-model="queryForm[column.DB_NAME || column.DB_NAME]"
                :placeholder="`请输入${column.DISPLAY_NAME || column.DISPLAY_NAME}`"
                allow-clear
                @input="(value: string) => handleQueryInputChange(column, value)"
              />

              <!-- 数字输入 -->
              <a-input-number
                v-else-if="column.CONTROL_TYPE === 'number'"
                v-model="queryForm[column.DB_NAME || column.DB_NAME]"
                :placeholder="`请输入${column.DISPLAY_NAME || column.DISPLAY_NAME}`"
                style="width: 100%"
              />

              <!-- 下拉选择 -->
              <a-select
                v-else-if="column.CONTROL_TYPE === 'select'"
                v-model="queryForm[column.DB_NAME || column.DB_NAME]"
                :placeholder="`请选择${column.DISPLAY_NAME || column.DISPLAY_NAME}`"
                allow-clear
              >
                <a-option
                  v-for="option in getDictOptions(column)"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-option>
              </a-select>

              <!-- 日期选择 -->
              <a-date-picker
                v-else-if="column.CONTROL_TYPE === 'date'"
                v-model="queryForm[column.DB_NAME || column.DB_NAME]"
                :placeholder="`请选择${column.DISPLAY_NAME || column.DISPLAY_NAME}`"
                allow-clear
                style="width: 100%"
              />

              <!-- 日期时间选择 -->
              <a-date-picker
                v-else-if="column.CONTROL_TYPE === 'datetime'"
                v-model="queryForm[column.DB_NAME || column.DB_NAME]"
                :placeholder="`请选择${column.DISPLAY_NAME || column.DISPLAY_NAME}`"
                show-time
                allow-clear
                style="width: 100%"
              />

              <!-- 默认文本输入 -->
              <a-input
                v-else
                v-model="queryForm[column.DB_NAME || column.DB_NAME]"
                :placeholder="`请输入${column.DISPLAY_NAME || column.DISPLAY_NAME}`"
                allow-clear
                @input="(value: string) => handleQueryInputChange(column, value)"
              />
            </a-form-item>
        </template>

        <!-- 无查询字段提示 -->
        <div v-else class="query-empty">
          <span class="query-empty-text">暂无查询字段</span>
        </div>

        <!-- 查询按钮区域 -->
        <div v-if="queryColumns.length > 0" class="query-actions">
          <a-space>
            <a-button
              v-if="queryColumns.length > 3"
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
                      @change="(checked: boolean) => handleColumnToggle(column.dataIndex as string, checked)"
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
      :row-class="getRowClass"
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
            @change="(checked: boolean) => handleSingleSelect(record[pkField], checked)"
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
        <div class="fk-cell">
          <!-- 显示文本 -->
          <span
            v-if="record[column.dataIndex + '_display']"
            class="fk-text"
            :class="{ 'has-link': record[column.dataIndex + '_ref'] }"
            :title="record[column.dataIndex + '_ref'] ? '点击查看关联记录' : ''"
            @click="record[column.dataIndex + '_ref'] && handleForeignKeyJump(record[column.dataIndex + '_ref'])"
          >
            {{ record[column.dataIndex + '_display'] }}
          </span>
          <!-- 降级到前端查询 -->
          <ForeignKeyCell
            v-else
            :column-config="column"
            :value="record[column.dataIndex]"
          />
        </div>
      </template>

      <!-- 下拉选择列自定义渲染 -->
      <template #select="{ record, column }">
        <template v-if="getDictLabelWithStyle(column.dataIndex, record[column.dataIndex]).cssClass">
          <a-tag
            v-if="['success', 'danger', 'warning', 'primary', 'info'].includes(getDictLabelWithStyle(column.dataIndex, record[column.dataIndex]).cssClass!)"
            :color="getDictLabelWithStyle(column.dataIndex, record[column.dataIndex]).cssClass"
          >
            {{ getDictLabelWithStyle(column.dataIndex, record[column.dataIndex]).label }}
          </a-tag>
          <span
            v-else
            :class="`dict-label-${getDictLabelWithStyle(column.dataIndex, record[column.dataIndex]).cssClass}`"
          >
            {{ getDictLabelWithStyle(column.dataIndex, record[column.dataIndex]).label }}
          </span>
        </template>
        <span v-else>
          {{ getDictLabelWithStyle(column.dataIndex, record[column.dataIndex]).label }}
        </span>
      </template>

      <!-- 图片列自定义渲染 -->
      <template #image="{ record, column }">
        <div class="image-cell">
          <template v-if="record[column.dataIndex]">
            <a-image
              :src="record[column.dataIndex]"
              :width="60"
              :height="60"
              fit="cover"
              :preview="true"
              style="border-radius: 4px;"
            />
          </template>
          <span v-else class="image-empty">-</span>
        </div>
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
        :key="column"
        #[column]="{ record }"
      >
        <slot
          :name="column"
          :record="record"
          :column="{ dataIndex: column }"
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

    <!-- 图例 -->
    <div v-if="legendItems.length > 0" class="table-legend">
      <span class="legend-title">图例</span>
      <div
        v-for="legend in legendItems"
        :key="legend.fieldName"
        class="legend-group"
      >
        <span class="legend-field-label">{{ legend.fieldLabel }}:</span>
        <span
          v-for="item in legend.items"
          :key="item.value"
          class="legend-item"
        >
          <!-- 有 CSS 样式的项 -->
          <template v-if="item.cssClass">
            <a-tag
              v-if="item.isTag"
              :color="item.cssClass"
              size="small"
            >
              {{ item.label }}
            </a-tag>
            <span
              v-else
              :class="`dict-label-${item.cssClass}`"
            >
              {{ item.label }}
            </span>
          </template>
          <!-- 没有 CSS 样式的项（默认样式） -->
          <span v-else class="legend-default">
            {{ item.label }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useNavigationStore } from '@/stores/navigation'
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
  IconPrinter,
  IconCopy,
  IconEdit,
  IconDragDotVertical,
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

// ==================== Router ====================

const navigationStore = useNavigationStore()

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
 * 可见的查询字段（支持展开/收起）
 */
const visibleQueryColumns = computed(() => {
  if (showAdvancedQuery.value) {
    return queryColumns.value
  }
  // 默认只显示前3个
  return queryColumns.value.slice(0, 3)
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
    const displayType = originalColumn?.DISPLAY_TYPE || (originalColumn as any)?.displayType

    if (displayType === 'image') {
      // 图片列
      col.slotName = 'image'
      ;(col as any).originalColumn = originalColumn
    } else if (setValueType === 'fk') {
      // 外键列
      col.slotName = 'foreignkey'
      // 保存原始列配置到 col，供 slot 使用
      ;(col as any).originalColumn = originalColumn
    } else if (setValueType === 'select') {
      // 下拉选择列
      col.slotName = 'select'
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
    .filter((col: TableColumnData) => selectedColumnKeys.value.includes(col.dataIndex as string))
    .map((col: TableColumnData) => {
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
    y: 'auto'  // 竖向高度自动适应，由父容器flex布局控制
  }
})

/**
 * 图例项（按字段分组显示所有字典值）
 */
const legendItems = computed(() => {
  if (!tableConfig.value?.dictData || !tableConfig.value?.columns) return []

  const legends: Array<{
    fieldName: string
    fieldLabel: string
    items: Array<{
      value: string
      label: string
      cssClass?: string
      isTag: boolean
    }>
  }> = []

  // 查找所有 select 类型的列
  const selectColumns = tableConfig.value.columns.filter(col => {
    const setValueType = col.SET_VALUE_TYPE || (col as any).setValueType
    return setValueType === 'select'
  })


  // 为每个 select 列生成图例
  selectColumns.forEach(column => {
    const sysDictID = column.SYS_DICT_ID || (column as any).sysDictId || column.DICT_TABLE_ID || (column as any).dictTableId
    if (!sysDictID) return

    const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
    const dictItems = tableConfig.value!.dictData && tableConfig.value!.dictData[dictID]


    if (!dictItems || dictItems.length === 0) return

    const items = dictItems.map(item => {
      const cssClass = item.CSS_CLASS || (item as any).cssClass
      const isTag = cssClass ? ['success', 'danger', 'warning', 'primary', 'info'].includes(cssClass) : false
      return {
        value: item.VALUE || (item as any).value,
        label: item.DISPLAY_NAME || (item as any).displayName,
        cssClass: cssClass || undefined,
        isTag
      }
    })

    legends.push({
      fieldName: column.DB_NAME || (column as any).dbName,
      fieldLabel: column.DISPLAY_NAME || (column as any).displayName,
      items
    })
  })

  return legends
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
    return true
  }

  const column = tableConfig.value?.columns.find(c => c.DB_NAME === dataIndex)
  const isDateTime = column?.CONTROL_TYPE === 'datetime'
  if (isDateTime) {
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
 * 获取字典标签（包含样式）
 */
function getDictLabelWithStyle(dataIndex: string, value: any): { label: string; cssClass?: string } {
  if (!value) return { label: '-' }
console.log(dataIndex,value)
  // 获取列配置
  const column = tableConfig.value?.columns.find(c => {
    const dbName = c.DB_NAME || (c as any).dbName
    return dbName === dataIndex
  })

  if (!column) return { label: String(value) }

  // 特殊处理 check 类型（只有 Y/N），兼容大小写和不同字段名
  const displayType = (column.DISPLAY_TYPE || (column as any).displayType || column.CONTROL_TYPE || (column as any).controlType || '').toLowerCase()
  if (displayType === 'check' || displayType === 'checkbox' || displayType === 'bool' || displayType === 'boolean') {
    return {
      label: String(value) === 'Y' || String(value) === '1' || value === true ? '是' : String(value) === 'N' || String(value) === '0' || value === false ? '否' : String(value),
      cssClass: String(value) === 'Y' || String(value) === '1' || value === true ? 'success' : 'danger'
    }
  }

  // 获取字典ID（同时支持SYS_DICT_ID和DICT_TABLE_ID）
  const sysDictID = column.SYS_DICT_ID || (column as any).sysDictId || column.DICT_TABLE_ID || (column as any).dictTableId
  if (!sysDictID || !tableConfig.value?.dictData) {
    return { label: String(value) }
  }

  // 转换字典ID为数字
  const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
  const dictItems = tableConfig.value.dictData[dictID]

  if (!dictItems) return { label: String(value) }

  // 查找匹配的字典项
  const item = dictItems.find(item => {
    const itemValue = item.VALUE || (item as any).value
    return itemValue === String(value)
  })

  if (item) {
    const displayName = item.DISPLAY_NAME || (item as any).displayName
    const cssClass = item.CSS_CLASS || (item as any).cssClass
    return {
      label: displayName || String(value),
      cssClass: cssClass || undefined
    }
  }

  return { label: String(value) }
}

/**
 * 获取字段的字典选项
 */
function getDictOptions(column: SysColumn): Array<{ value: string; label: string }> {
  // 特殊处理 check 类型（只有 Y/N）
  const displayType = column.DISPLAY_TYPE || (column as any).displayType
  // 获取字典ID（同时支持SYS_DICT_ID和DICT_TABLE_ID）
  const sysDictID = column.SYS_DICT_ID || (column as any).sysDictId || column.DICT_TABLE_ID || (column as any).dictTableId
  if (!sysDictID || !tableConfig.value?.dictData) {
    return []
  }

  // 转换字典ID为数字
  const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
  const dictItems = tableConfig.value.dictData[dictID]

  if (!dictItems) return []

  // 转换为选项格式
  return dictItems.map(item => ({
    value: item.VALUE || (item as any).value,
    label: item.DISPLAY_NAME || (item as any).displayName
  }))
}

/**
 * 处理查询输入框变化（支持自动转大写）
 */
function handleQueryInputChange(column: any, value: string) {
  const fieldName = column.DB_NAME || column.DB_NAME

  // 如果配置了自动转大写，则转换为大写
  if (value && (column.IS_UPPERCASE === 'Y' || column.isUppercase === 'Y')) {
    queryForm.value[fieldName] = value.toUpperCase()
  } else {
    queryForm.value[fieldName] = value
  }
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
 * 外键跳转 - 跳转到关联记录的查看页面
 */
function handleForeignKeyJump(refInfo: any) {

  if (!refInfo || !refInfo.table_id || !refInfo.record_id) {
    Message.warning('无法跳转：缺少关联信息')
    return
  }

  // 使用 navigationStore 跳转到关联记录的查看页面
  navigationStore.navigateTo('MetadataFormView', '查看关联记录', {
    tableId: refInfo.table_id,
    recordId: refInfo.record_id,
    mode: 'view'
  })
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
function handleSorterChange(dataIndex: string, direction: string) {

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


  // 发送到后端
  tableStore.updateSorters(tableName.value, sorters)
}

/**
 * 处理表头点击（切换排序）
 */
function handleHeaderClick(dataIndex: string) {

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
    if (columnSorters.value[dataIndex]) {
      columnSorters.value[dataIndex].direction = 'descend'
    }
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
  const keys = checked ? records.value.map(r => r[pkField.value] as string | number) : []
  onSelectionChange(keys)
  emit('selection-change', keys)
}

/**
 * 获取行样式类（根据字典项的 CSS_CLASS 给整行添加样式）
 */
function getRowClass(record: FormData, _rowIndex: number): string | string[] {
  if (!tableConfig.value?.dictData) {
    return ''
  }

  // 查找所有 select 类型的列
  const selectColumns = tableColumns.value.filter(col => {
    const originalColumn = tableConfig.value?.columns.find(c => {
      const dbName = c.DB_NAME || (c as any).dbName
      return dbName === col.dataIndex
    })
    const setValueType = originalColumn?.SET_VALUE_TYPE || (originalColumn as any)?.setValueType
    return setValueType === 'select'
  })


  // 遍历所有 select 列，找到第一个有 CSS_CLASS 的值
  for (const column of selectColumns) {
    const value = record[column.dataIndex]
    if (!value) {
      continue
    }

    const originalColumn = tableConfig.value?.columns.find(c => {
      const dbName = c.DB_NAME || (c as any).dbName
      return dbName === column.dataIndex
    })


    const sysDictID = originalColumn?.SYS_DICT_ID || (originalColumn as any)?.sysDictId || originalColumn?.DICT_TABLE_ID || (originalColumn as any)?.dictTableId
    if (!sysDictID) {
      continue
    }

    const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
    const dictItems = tableConfig.value.dictData[dictID]
    if (!dictItems) continue

    const item = dictItems.find(item => {
      const itemValue = item.VALUE || (item as any).value
      return itemValue === String(value)
    })


    if (item) {
      const cssClass = item.CSS_CLASS || (item as any).cssClass
      if (cssClass) {
        // 如果是 Arco tag 颜色，转换为行样式类
        if (['success', 'danger', 'warning', 'primary', 'info'].includes(cssClass)) {
          return `row-${cssClass}`
        }
        // 自定义样式类
        return `row-dict-label-${cssClass}`
      }
    }
  }

  return ''
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
  allColumns.value = columns.value.filter((col: TableColumnData) =>
    col.dataIndex !== '__selection_index__' && col.dataIndex !== 'actions'
  )
  selectedColumnKeys.value = allColumns.value.map((col: TableColumnData) => col.dataIndex as string)
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

      // 清空查询表单，避免旧表的查询字段带入新表
      queryForm.value = {}


      // 同时清空 store 的 filters（因为可能之前点过查询按钮）
      const tableStore = useDynamicTableStore()
      tableStore.filters = {}
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

.dynamic-table__query .query-form {
  padding: 16px;
  padding-right: 260px; /* 为按钮留出足够空间 */
  position: relative;
  min-height: 50px;
}

.dynamic-table__query .query-form :deep(.arco-form-item) {
  margin-bottom: 12px !important;
  margin-right: 24px !important;
  min-width: 180px;
  max-width: 220px;
}

.dynamic-table__query .query-actions {
  position: absolute !important;
  top: 16px !important;
  right: 16px !important;
  display: flex !important;
  justify-content: flex-end !important;
  z-index: 999 !important;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 查询区域空状态 */
.query-empty {
  padding: 24px 16px;
  text-align: center;
}

.query-empty-text {
  color: #86909c;
  font-size: 14px;
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

/* 外键单元格样式 */
.fk-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fk-text {
  display: inline-block;
}

/* 有链接的文本样式 */
.fk-text.has-link {
  color: #3370ff;
  cursor: pointer;
  transition: all 0.2s;
}

.fk-text.has-link:hover {
  color: #0e42d2;
  text-decoration: underline;
}

/* 字典标签自定义样式 */
/* 禁用/停用状态 - 灰色斜体 */
.dict-label-disabled {
  color: #999;
  font-style: italic;
}

/* 非活动状态 - 灰色斜体 + 删除线 */
.dict-label-inactive {
  color: #999;
  font-style: italic;
  text-decoration: line-through;
}

/* 草稿状态 - 浅灰色 */
.dict-label-draft {
  color: #bbb;
}

/* 待审核状态 - 橙色 */
.dict-label-pending {
  color: #ff7d00;
}

/* 已完成状态 - 绿色加粗 */
.dict-label-completed {
  color: #00b42a;
  font-weight: 600;
}

/* 已拒绝状态 - 红色 */
.dict-label-rejected {
  color: #f53f3f;
}

/* 已过期状态 - 灰色 + 删除线 */
.dict-label-expired {
  color: #999;
  text-decoration: line-through;
}

/* 表格行样式 - 根据字典项 CSS_CLASS */
/* Arco tag 颜色对应的行样式 */
.dynamic-table :deep(tr.row-success),
.dynamic-table :deep(.arco-table-tr.row-success) {
  background-color: rgba(0, 180, 42, 0.05) !important;
}

.dynamic-table :deep(tr.row-success:hover),
.dynamic-table :deep(.arco-table-tr.row-success:hover) {
  background-color: rgba(0, 180, 42, 0.1) !important;
}

.dynamic-table :deep(tr.row-danger),
.dynamic-table :deep(.arco-table-tr.row-danger) {
  background-color: rgba(245, 63, 63, 0.05) !important;
}

.dynamic-table :deep(tr.row-danger:hover),
.dynamic-table :deep(.arco-table-tr.row-danger:hover) {
  background-color: rgba(245, 63, 63, 0.1) !important;
}

.dynamic-table :deep(tr.row-warning),
.dynamic-table :deep(.arco-table-tr.row-warning) {
  background-color: rgba(255, 125, 0, 0.05) !important;
}

.dynamic-table :deep(tr.row-warning:hover),
.dynamic-table :deep(.arco-table-tr.row-warning:hover) {
  background-color: rgba(255, 125, 0, 0.1) !important;
}

.dynamic-table :deep(tr.row-primary),
.dynamic-table :deep(.arco-table-tr.row-primary) {
  background-color: rgba(51, 112, 255, 0.05) !important;
}

.dynamic-table :deep(tr.row-primary:hover),
.dynamic-table :deep(.arco-table-tr.row-primary:hover) {
  background-color: rgba(51, 112, 255, 0.1) !important;
}

.dynamic-table :deep(tr.row-info),
.dynamic-table :deep(.arco-table-tr.row-info) {
  background-color: rgba(134, 144, 156, 0.05) !important;
}

.dynamic-table :deep(tr.row-info:hover),
.dynamic-table :deep(.arco-table-tr.row-info:hover) {
  background-color: rgba(134, 144, 156, 0.1) !important;
}

/* 自定义样式类对应的行样式 */
.dynamic-table :deep(tr.row-dict-label-disabled),
.dynamic-table :deep(.arco-table-tr.row-dict-label-disabled) {
  color: #999 !important;
  font-style: italic !important;
  background-color: rgba(153, 153, 153, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-disabled:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-disabled:hover) {
  background-color: rgba(153, 153, 153, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-disabled td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-disabled td) {
  color: #999 !important;
  font-style: italic !important;
}

.dynamic-table :deep(tr.row-dict-label-inactive),
.dynamic-table :deep(.arco-table-tr.row-dict-label-inactive) {
  color: #999 !important;
  font-style: italic !important;
  text-decoration: line-through !important;
  background-color: rgba(153, 153, 153, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-inactive:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-inactive:hover) {
  background-color: rgba(153, 153, 153, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-inactive td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-inactive td) {
  color: #999 !important;
  font-style: italic !important;
  text-decoration: line-through !important;
}

.dynamic-table :deep(tr.row-dict-label-draft),
.dynamic-table :deep(.arco-table-tr.row-dict-label-draft) {
  color: #bbb !important;
  background-color: rgba(187, 187, 187, 0.03) !important;
}

.dynamic-table :deep(tr.row-dict-label-draft:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-draft:hover) {
  background-color: rgba(187, 187, 187, 0.08) !important;
}

.dynamic-table :deep(tr.row-dict-label-draft td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-draft td) {
  color: #bbb !important;
}

.dynamic-table :deep(tr.row-dict-label-pending),
.dynamic-table :deep(.arco-table-tr.row-dict-label-pending) {
  color: #ff7d00 !important;
  background-color: rgba(255, 125, 0, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-pending:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-pending:hover) {
  background-color: rgba(255, 125, 0, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-pending td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-pending td) {
  color: #ff7d00 !important;
}

.dynamic-table :deep(tr.row-dict-label-completed),
.dynamic-table :deep(.arco-table-tr.row-dict-label-completed) {
  color: #00b42a !important;
  font-weight: 600 !important;
  background-color: rgba(0, 180, 42, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-completed:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-completed:hover) {
  background-color: rgba(0, 180, 42, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-completed td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-completed td) {
  color: #00b42a !important;
  font-weight: 600 !important;
}

.dynamic-table :deep(tr.row-dict-label-rejected),
.dynamic-table :deep(.arco-table-tr.row-dict-label-rejected) {
  color: #f53f3f !important;
  background-color: rgba(245, 63, 63, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-rejected:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-rejected:hover) {
  background-color: rgba(245, 63, 63, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-rejected td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-rejected td) {
  color: #f53f3f !important;
}

.dynamic-table :deep(tr.row-dict-label-expired),
.dynamic-table :deep(.arco-table-tr.row-dict-label-expired) {
  color: #999 !important;
  text-decoration: line-through !important;
  background-color: rgba(153, 153, 153, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-expired:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-expired:hover) {
  background-color: rgba(153, 153, 153, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-expired td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-expired td) {
  color: #999 !important;
  text-decoration: line-through !important;
}

/* 图例样式 - 固定在页面底部 */
.table-legend {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 12px 16px;
  background: #f7f8fa;
  border-top: 1px solid #e5e6eb;
  font-size: 13px;
  flex-wrap: wrap;
  position: sticky;
  bottom: 0;
  z-index: 10;
  max-height: 100px;
  overflow-y: auto;
}

/* 隐藏图例内部滚动条 */
.table-legend::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.legend-title {
  font-weight: 600;
  color: #1d2129;
  flex-shrink: 0;
}

.legend-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.legend-field-label {
  font-weight: 500;
  color: #4e5969;
  flex-shrink: 0;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
}

.legend-item:not(:last-child)::after {
  content: '|';
  margin-left: 8px;
  color: #c9cdd4;
}

.legend-default {
  color: #1d2129;
  padding: 0 4px;
}

/* 让表格自动填充剩余空间 */
.dynamic-table :deep(.arco-table) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dynamic-table :deep(.arco-table-body) {
  flex: 1;
  overflow-y: auto;
}

/* 图片单元格样式 */
.image-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
}

.image-cell .arco-image {
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}

.image-empty {
  color: #c9cdd4;
}
</style>
