<!-- 动态表格组件 -->
<template>
  <div class="dynamic-table">
    <DynamicQueryBar
      ref="queryBarRef"
      :columns="queryColumns"
      @query="handleQuery"
      @reset="handleReset"
    />

    <!-- 工具栏 -->
    <TableToolbarButtons
      v-bind="toolbarProps"
      @query="() => queryBarRef?.handleQuery()"
      @reset="handleReset"
      @create="handleCreate"
      @submit="handleSubmit"
      @unsubmit="handleUnsubmit"
      @batch-delete="handleBatchDelete"
      @import="handleImport"
      @export="handleExport"
      @print="handlePrint"
      @copy="handleCopy"
      @batch-edit="handleBatchEdit"
      @batch-edit-all="handleBatchEditAll"
      @column-toggle="handleColumnToggle"
      @drag-start="handleDragStart"
      @drop="handleDrop"
      @reset-columns="handleResetColumns"
      @refresh="handleRefresh"
      @action="handleListAction"
    >
      <template #toolbar-left><slot name="toolbar-left" /></template>
      <template #toolbar-right><slot name="toolbar-right" /></template>
    </TableToolbarButtons>

    <!-- 表格（外套一层弹性容器，ResizeObserver 动态计算高度，消除加载时高度跳越） -->
    <div ref="tableWrapRef" class="table-flex">
    <a-table
      :columns="visibleColumns"
      :data="records"
      :loading="loading"
      :pagination="false"
      :bordered="bordered"
      :stripe="stripe"
      :hoverable="hoverable"
      :row-key="pkField"
      :size="size"
      :scroll="scrollConfig"
      :row-class="getRowClass"
      :row-style="canEdit ? editableRowStyle : undefined"
      show-sorter-tooltip
      style="width: 100%;"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @sorter-change="handleSorterChange"
      @row-click="handleRowClick"
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
            :model-value="selectedRowKeys.includes(getRecordKey(record))"
            @change="(checked: boolean) => handleSingleSelect(getRecordKey(record), checked)"
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
          <!-- 显示文本: 有跳转时 = 外跳图标 + 可点击名称(门户风格) -->
          <span
            v-if="record[column.dataIndex + '_display']"
            class="fk-text"
            :class="{ 'has-link': record[column.dataIndex + '_ref'] }"
            :title="record[column.dataIndex + '_ref'] ? '点击查看关联记录' : ''"
            @click="record[column.dataIndex + '_ref'] && handleForeignKeyJump(record[column.dataIndex + '_ref'])"
          >
            <span v-if="record[column.dataIndex + '_ref']" class="fk-jump-icon">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                <path d="M12 8.5V12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3.5a.5.5 0 0 1 0 1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8.5a.5.5 0 0 1 1 0z M13.5 2.5V6a.5.5 0 0 1-1 0V3.7L8.85 7.35a.5.5 0 1 1-.7-.7L11.8 3H10a.5.5 0 0 1 0-1h3a.5.5 0 0 1 .5.5z"/>
              </svg>
            </span>
            {{ record[column.dataIndex + '_display'] }}
          </span>
          <!-- 降级到前端查询 -->
          <ForeignKeyCell
            v-else
            :column-config="column"
            :value="record[column.dataIndex]"
            :jump-ref="record[column.dataIndex + '_ref']"
            @jump="handleForeignKeyJump"
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
                <!-- 编辑（默认：点击行即进入编辑页，行内保留编辑入口） -->
                <V2Button v-if="canEdit" type="text" size="sm" @click="handleEdit(record)">编辑</V2Button>

                <!-- 删除 -->
                <a-popconfirm
                  v-if="canDelete"
                  content="确定要删除这条记录吗？"
                  @ok="handleDelete(record)"
                >
                  <V2Button type="text" size="sm" class="danger">删除</V2Button>
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
    </div>

    <!-- 底部固定：图例(左) + 分页(右) -->
    <div class="table-footer">
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
            <span v-else class="legend-default">
              {{ item.label }}
            </span>
          </span>
        </div>
      </div>

      <a-pagination
        :current="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :show-total="true"
        :show-jumper="true"
        :show-page-size="true"
        :page-size-options="[10, 15, 20, 50, 100]"
        size="small"
        @change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #total>
          共 {{ pagination.total }} 条
        </template>
      </a-pagination>
    </div>
  </div>

  <!-- 导入弹窗：下载模板 + 选择文件 -->
  <a-modal
    v-model:visible="importVisible"
    title="导入数据"
    :width="480"
    :footer="false"
    @cancel="handleImportCancel"
  >
    <div class="import-modal-body">
      <div class="import-modal-tip">
        请先下载导入模板，按模板列格式填写后上传文件。外键/字典列请填写对应的显示名称。
      </div>
      <div class="import-modal-actions">
        <a-button type="outline" long :loading="importing" @click="handleDownloadTemplate">
          <template #icon><icon-download /></template>
          下载导入模板
        </a-button>
        <a-button type="primary" long :loading="importing" @click="handleChooseFile">
          <template #icon><icon-upload /></template>
          选择文件并上传
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import api from '@/api/http'
import { useNavigationStore } from '@/stores/navigation'
import {
  IconArrowUp,
  IconArrowDown,
  IconDownload,
  IconUpload
} from '@arco-design/web-vue/es/icon'
import { V2Button } from '@/components/ui'
import { useDynamicList } from '../../composables'
import { useDynamicTableStore } from '../../stores'
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from '@/utils/format'
import ForeignKeyCell from './ForeignKeyCell.vue'
import DynamicQueryBar from './DynamicQueryBar.vue'
import TableToolbarButtons from './TableToolbarButtons.vue'
import { useTableColumns } from './useTableColumns'
import { submitRecord, unsubmitRecord, getImportTemplate, fetchTableActions } from '../../api/metadata'
import type { TableColumnData } from '@arco-design/web-vue'
import type { FormData, SysAction } from '../../types'

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
  copy: [record: FormData]
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
  handleBatchDelete: onBatchDelete,
  handleExport: onExport,
  handleImport: onImport,
} = useDynamicList(props.tableId)

// ==================== 状态 ====================

const selectedColumnKeys = ref<string[]>([])
const allColumns = ref<TableColumnData[]>([])

const { columns, visibleColumns } =
  useTableColumns({
    tableConfig,
    tableColumns,
    allColumns,
    selectedColumnKeys,
    customColumns: props.customColumns,
  })

const toolbarProps = computed(() => ({
  showToolbar: props.showToolbar,
  loading: loading.value,
  hasSelection: hasSelection.value,
  selectedCount: selectedCount.value,
  allColumns: allColumns.value,
  selectedColumnKeys: selectedColumnKeys.value,
  canCreate: canCreate.value,
  canEdit: canEdit.value,
  canDelete: canDelete.value,
  canSubmit: canSubmit.value,
  canUnsubmit: canUnsubmit.value,
  canImport: canImport.value,
  canExport: canExport.value,
  canPrint: canPrint.value,
  listActions: listActions.value,
  executingAction: executingAction.value
}))
const draggedIndex = ref<number>(-1)

// ==================== 动作按钮（list_button 动态加载） ====================
const listActions = ref<SysAction[]>([])
const executingAction = ref<number | null>(null)

/** 加载该表的动作定义，取 list_button 类型（列表栏按钮） */
async function loadListActions() {
  if (!props.tableId) return
  try {
    const all = await fetchTableActions(Number(props.tableId))
    listActions.value = (all || []).filter(a => (a.displayType || '').toLowerCase() === 'list_button')
  } catch (e) {
    listActions.value = []
  }
}

/** 执行动作：POST /actions/{id}/execute */
async function handleListAction(action: SysAction) {
  if (executingAction.value) return
  executingAction.value = action.id
  try {
    const { data } = await api.post(`/actions/${action.id}/execute`, {})
    const res = data?.data || data
    const ok = data?.code === 200 || res?.success
    Message.success(action.displayName || action.name + ' 执行成功')
    await refresh()
  } catch (error: any) {
    Message.error(error?.message || `动作「${action.displayName || action.name}」执行失败`)
  } finally {
    executingAction.value = null
  }
}

// 排序状态（跟踪多字段排序）
// 存储格式：{ field: { direction, priority } }
const columnSorters = ref<Record<string, { direction: 'ascend' | 'descend', priority: number }>>({})

// 查询相关状态
const queryForm = ref<Record<string, any>>({})
const queryBarRef = ref<InstanceType<typeof DynamicQueryBar>>()

// ==================== 计算属性 ====================

/**
 * 滚动配置
 */
const scrollConfig = computed(() => {
  return {
    x: 1800,
    y: tableHeight.value
  }
})

// 动态表格高度：监听表格容器高度，让 scroll.y 跟随容器（消除硬编码 810 导致的加载高度跳越）
const tableWrapRef = ref<HTMLDivElement>()
const tableHeight = ref(480)
let resizeObserver: ResizeObserver | null = null
let scrollResetTimer: number | null = null

onMounted(() => {
  const el = tableWrapRef.value
  if (el) {
    const update = () => {
      if (el.clientHeight > 0) {
        tableHeight.value = el.clientHeight
      } else if (el.getBoundingClientRect().height > 0) {
        tableHeight.value = el.getBoundingClientRect().height
      }
    }
    update()
    resizeObserver = new ResizeObserver(() => {
      // 高度稳定后再应用，避免加载瞬间反复跳变
      update()
    })
    resizeObserver.observe(el)
  }
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (scrollResetTimer) window.clearTimeout(scrollResetTimer)
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
        label: String(item.DISPLAY_NAME || (item as any).displayName || ''),
        cssClass: cssClass || undefined,
        isTag
      }
    })

    // 仅当该字段的字典至少有一项配置了 CSS 样式才纳入图例
    // （无样式可图例的显示，整表单字典 CSS 均未配置时图例整体不显示）
    const hasCssConfig = items.some(item => item.cssClass)
    if (!hasCssConfig) return

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
 * 判断是否为状态列
 */
/**
 * 获取状态颜色
 */

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
 * 查询
 */
async function handleQuery(form?: Record<string, any>) {
  try {
    const tableStore = useDynamicTableStore()
    await tableStore.updateFilters(tableName.value, form ? { ...form } : { ...queryForm.value })
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
    await tableStore.resetFilters(tableName.value)
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

/** 行可编辑指针样式（提示可点击编辑） */
const editableRowStyle = computed(() => ({ cursor: 'pointer' }))

/**
 * 行点击 → 默认进入编辑页
 * 排除已有点击目标：复选框、外键跳转、操作列按钮（编辑/删除）
 */
function handleRowClick(record: FormData, event: Event) {
  if (!canEdit) return
  const target = event.target as HTMLElement | null
  if (!target) return
  // 排除交互元素：checkbox 框内、按钮、链接（外键跳转/查看）、a-tag 点击
  const interactive = target.closest(
    'button, a, input, [class*="arco-checkbox"], [class*="fk-text"], [class*="arco-tag"], [class*="arco-link"], label'
  )
  if (interactive) return
  // 复选框单元格（选择+序号）内的其余位置也不触发
  const nearestDataCol = target.closest('td')
  if (nearestDataCol && nearestDataCol.className.includes('selection')) return
  handleEdit(record)
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
  } catch {
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
 * 导入 - 先弹窗，支持下载导入模板 + 选择文件上传
 */
const importVisible = ref(false)
const importing = ref(false)

function handleImport() {
  importVisible.value = true
}

function handleImportCancel() {
  importVisible.value = false
}

async function handleDownloadTemplate() {
  try {
    const blob = await getImportTemplate(tableName.value)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tableName.value}_导入模板.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    Message.success('模板已下载，请按格式填写后导入')
  } catch (e) {
    Message.error((e as any)?.message || '模板下载失败')
  }
}

function handleChooseFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      importing.value = true
      try {
        await onImport(file)
        importVisible.value = false
      } finally {
        importing.value = false
      }
    }
  }
  input.click()
}

/**
 * 导出（带过滤条件）
 */
function handleExport() {
  onExport()
}

/**
 * 套打
 */
function handlePrint() {
  Message.info('套打功能开发中')
  // TODO: 实现套打逻辑
}

/**
 * 复制：将选中行复制为一条新记录（预填到新增表单）
 */
function handleCopy() {
  if (!hasSelection.value) {
    Message.warning('请先选择要复制的记录')
    return
  }
  const firstKey = selectedRowKeys.value[0]
  const record = records.value.find(r => String(getRecordKey(r)) === String(firstKey))
  if (!record) {
    Message.warning('未找到要复制的记录')
    return
  }
  emit('copy', record)
}

/**
 * 修改选中行
 */
function handleBatchEdit() {
  if (!hasSelection.value) {
    Message.warning('请先选择要修改的记录')
    return
  }
  navigationStore.navigateTo('BatchEditPage', `批量修改 - ${tableName.value}`, {
    tableId: props.tableId,
    tableName: tableName.value,
    mode: 'selected',
    selectedIds: [...selectedRowKeys.value].map(Number),
  }, false)
}

/**
 * 修改结果集
 */
function handleBatchEditAll() {
  navigationStore.navigateTo('BatchEditPage', `批量修改 - ${tableName.value}`, {
    tableId: props.tableId,
    tableName: tableName.value,
    mode: 'all',
  }, false)
}

/**
 * 提交
 */
function handleSubmit() {
  if (!hasSelection.value) {
    Message.warning('请先选择要提交的记录')
    return
  }
  Modal.confirm({
    title: '确认提交',
    content: `确定要提交选中的 ${selectedCount.value} 条记录吗？`,
    onOk: async () => {
      let ok = 0
      for (const id of selectedRowKeys.value) {
        try { await submitRecord(tableName.value, Number(id)); ok++ } catch { /* skip */ }
      }
      Message.success(`提交完成：成功 ${ok} 条`)
      await loadData()
    }
  })
}

/**
 * 反提交
 */
function handleUnsubmit() {
  if (!hasSelection.value) {
    Message.warning('请先选择要反提交的记录')
    return
  }
  Modal.confirm({
    title: '确认反提交',
    content: `确定要反提交选中的 ${selectedCount.value} 条记录吗？`,
    onOk: async () => {
      let ok = 0
      for (const id of selectedRowKeys.value) {
        try { await unsubmitRecord(tableName.value, Number(id)); ok++ } catch { /* skip */ }
      }
      Message.success(`反提交完成：成功 ${ok} 条`)
      await loadData()
    }
  })
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
    tableStore.updateSorters(tableName.value, [])
    await refresh()
  } catch {
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
 * 获取记录主键值（兼容大小写）
 */
function getRecordKey(record: any): string | number {
  if (!record) return 0
  if (pkField.value) {
    const val = record[pkField.value]
    if (val !== undefined && val !== null) return val
  }
  return record.ID ?? record.id ?? record.Id ?? 0
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
  const keys = checked ? records.value.map(r => getRecordKey(r)) : []
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
  loadListActions()
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

      // 重新加载该表的动作按钮
      loadListActions()
    }
  }
)

// ==================== 暴露方法 ====================

defineExpose({
  refresh,
  loadData,
  triggerQuery: () => queryBarRef.value?.handleQuery()
})
</script>

<style scoped>
/* 导入弹窗 */
.import-modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
}
.import-modal-tip {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--color-fill-2);
  color: var(--color-text-2);
  font-size: 13px;
  line-height: 1.6;
}
.import-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.import-modal-actions :deep(.arco-btn) {
  height: 40px;
}
.dynamic-table {
  width: 100%;
  height: 100%;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 状态/字典 Tag 对齐 v2 功能色 */
.dynamic-table :deep(.arco-tag-green),
.dynamic-table :deep(.arco-tag.arco-tag-color-green) {
  background: var(--success-bg);
  color: var(--success);
}
.dynamic-table :deep(.arco-tag-red),
.dynamic-table :deep(.arco-tag.arco-tag-color-red) {
  background: var(--error-bg);
  color: var(--error);
}
.dynamic-table :deep(.arco-tag-gray),
.dynamic-table :deep(.arco-tag.arco-tag-color-gray) {
  background: var(--bg-hover);
  color: var(--text-secondary);
}
.dynamic-table :deep(.arco-tag-blue),
.dynamic-table :deep(.arco-tag.arco-tag-color-primary),
.dynamic-table :deep(.arco-tag.arco-tag-color-arcoblue) {
  background: var(--info-bg);
  color: var(--info);
}
.dynamic-table :deep(.arco-tag-orange),
.dynamic-table :deep(.arco-tag.arco-tag-color-orange) {
  background: var(--warning-bg);
  color: var(--warning);
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
  color: var(--text-tertiary);
  font-size: 14px;
  min-width: 24px;
  text-align: center;
}


/* ===== 统一卡片视觉 ===== */
.dynamic-table {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-card);
}

.dynamic-table__query {
  border-radius: 10px 10px 0 0;
  border: none;
  border-bottom: 1px solid var(--border);
}

.dynamic-table__toolbar {
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border);
  padding: 8px 12px;
}

.dynamic-table :deep(.arco-table-container) {
  border-left: none;
  border-right: none;
}

/* 查询区域 */
.dynamic-table__query {
  flex-shrink: 0;
  padding: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 4px;
}

.query-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border);
  border-radius: 4px 4px 0 0;
}

.query-icon {
  font-size: 16px;
  color: var(--brand-blue);
  margin-right: 8px;
}

.query-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.dynamic-table__query .query-form {
  padding: 10px 12px;
  padding-right: 260px;
  position: relative;
  min-height: 36px;
}

.dynamic-table__query .query-form :deep(.arco-form-item) {
  margin-bottom: 12px !important;
  margin-right: 16px !important;
  width: calc(25% - 16px);
  min-width: 160px;
}

.dynamic-table__query .query-actions {
  position: absolute !important;
  top: 16px !important;
  right: 16px !important;
  display: flex !important;
  justify-content: flex-end !important;
  z-index: 999 !important;
  background: var(--bg-card);
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 响应式适配：小屏幕 */
@media (max-width: 768px) {
  .dynamic-table__query .query-form {
    padding-right: 16px;
    padding-bottom: 70px;
  }

  .dynamic-table__query .query-form :deep(.arco-form-item) {
    width: 100%;
    max-width: 100%;
    margin-right: 0;
  }

  .dynamic-table__query .query-actions {
    top: auto;
    bottom: 16px;
    left: 16px;
    right: 16px;
    justify-content: center;
  }

  .dynamic-table__toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .dynamic-table__toolbar .toolbar-left,
  .dynamic-table__toolbar .toolbar-right {
    justify-content: center;
  }

  .dynamic-table :deep(.arco-table-body) {
    font-size: 12px;
  }

  .dynamic-table :deep(.arco-table-th) {
    padding: 8px 4px;
    font-size: 12px;
  }

  .dynamic-table :deep(.arco-table-td) {
    padding: 8px 4px;
    font-size: 12px;
  }

  .table-legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* 查询区域空状态 */
.query-empty {
  padding: 24px 16px;
  text-align: center;
}

.query-empty-text {
  color: var(--text-tertiary);
  font-size: 14px;
}

.dynamic-table__toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px;
  border-bottom: 1px solid var(--border);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}


/* 表格最小宽度，保证列不会被过度挤压，更容易触发横向滚动 */
/* 表格容器强制横向滚动 */
.dynamic-table :deep(.arco-table-container) {
  overflow-x: auto !important;
  width: 100% !important;
  flex: 1;
  overflow-y: auto !important;
}

/* 表格体滚动区域 */
.dynamic-table :deep(.arco-table-body) {
  overflow-y: auto !important;
}

/* 表格最小宽度，保证列不会被过度挤压，更容易触发横向滚动 */
.dynamic-table :deep(.arco-table) {
  min-width: 500px !important;
  width: auto !important;
  table-layout: fixed !important;
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
  background: #f5f7fa;
  font-weight: 600;
  color: #1f2329;
  padding: 5px 12px;
  height: 30px;
  line-height: 20px;
  border-bottom: 1px solid var(--border);
}

/* 表头单元格右细边（企业后台列分隔观感） */
.dynamic-table :deep(.arco-table-th)::after {
  border-right-color: var(--border-light) !important;
}

/* 行悬停 / 选中：淡蓝（避免过艳） */
.dynamic-table :deep(.arco-table-tr:hover) {
  background: #f0f6ff;
}
.dynamic-table :deep(.arco-table-tr.arco-table-tr-checked) {
  background: #eaf2ff;
}

/* 数据行：细下边框分隔、正文深色 */
.dynamic-table :deep(.arco-table-td) {
  padding: 5px 12px;
  height: 30px;
  line-height: 20px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}
.dynamic-table :deep(.arco-table-td-content) {
  color: var(--text-primary);
}

/* 斑马纹（极浅，保持整齐） */
.dynamic-table :deep(.arco-table-tr:nth-child(even)) {
  background: #fafbfc;
}
.dynamic-table :deep(.arco-table-tr:nth-child(even):hover) {
  background: #f0f6ff;
}

/* 操作按钮样式 */
.dynamic-table :deep(.arco-btn-text) {
  padding: 4px 8px;
}

.dynamic-table :deep(.arco-btn-text):hover {
  background: var(--info-bg);
}


/* 固定列样式 - 使用 Arco Design 原生支持 */
.dynamic-table :deep(.arco-table-th-fixed-left),
.dynamic-table :deep(.arco-table-td-fixed-left) {
  position: sticky !important;
  left: 0 !important;
  z-index: 2 !important;
  background: var(--bg-card) !important;
}

.dynamic-table :deep(.arco-table-th-fixed-right),
.dynamic-table :deep(.arco-table-td-fixed-right) {
  position: sticky !important;
  right: 0 !important;
  z-index: 2 !important;
  background: var(--bg-card) !important;
}

.dynamic-table :deep(.arco-table-th-fixed-left),
.dynamic-table :deep(.arco-table-th-fixed-right) {
  background: #f5f7fa !important;
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
  --color-primary: var(--success);
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
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
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
  background-color: var(--bg-hover);
}

.drag-handle {
  margin-right: 8px;
  color: var(--text-tertiary);
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
  border-top: 1px solid var(--border);
  text-align: center;
}

.settings-footer :deep(.arco-btn-text) {
  color: var(--brand-blue);
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
  color: var(--brand-blue);
  cursor: pointer;
  transition: all 0.2s;
}

.fk-text.has-link:hover {
  color: var(--brand-blue-hover);
  text-decoration: underline;
}

/* 字典标签自定义样式 */
/* 禁用/停用状态 - 灰色斜体 */
.dict-label-disabled {
  color: var(--text-tertiary);
  font-style: italic;
}

/* 非活动状态 - 灰色斜体 + 删除线 */
.dict-label-inactive {
  color: var(--text-tertiary);
  font-style: italic;
  text-decoration: line-through;
}

/* 草稿状态 - 浅灰色 */
.dict-label-draft {
  color: var(--text-tertiary);
}

/* 待审核状态 - 橙色 */
.dict-label-pending {
  color: var(--warning);
}

/* 已完成状态 - 绿色加粗 */
.dict-label-completed {
  color: var(--success);
  font-weight: 600;
}

/* 已拒绝状态 - 红色 */
.dict-label-rejected {
  color: var(--error);
}

/* 已过期状态 - 灰色 + 删除线 */
.dict-label-expired {
  color: var(--text-tertiary);
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
  color: var(--text-tertiary) !important;
  font-style: italic !important;
  background-color: rgba(153, 153, 153, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-disabled:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-disabled:hover) {
  background-color: rgba(153, 153, 153, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-disabled td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-disabled td) {
  color: var(--text-tertiary) !important;
  font-style: italic !important;
}

.dynamic-table :deep(tr.row-dict-label-inactive),
.dynamic-table :deep(.arco-table-tr.row-dict-label-inactive) {
  color: var(--text-tertiary) !important;
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
  color: var(--text-tertiary) !important;
  font-style: italic !important;
  text-decoration: line-through !important;
}

.dynamic-table :deep(tr.row-dict-label-draft),
.dynamic-table :deep(.arco-table-tr.row-dict-label-draft) {
  color: var(--text-tertiary) !important;
  background-color: rgba(187, 187, 187, 0.03) !important;
}

.dynamic-table :deep(tr.row-dict-label-draft:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-draft:hover) {
  background-color: rgba(187, 187, 187, 0.08) !important;
}

.dynamic-table :deep(tr.row-dict-label-draft td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-draft td) {
  color: var(--text-tertiary) !important;
}

.dynamic-table :deep(tr.row-dict-label-pending),
.dynamic-table :deep(.arco-table-tr.row-dict-label-pending) {
  color: var(--warning) !important;
  background-color: rgba(255, 125, 0, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-pending:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-pending:hover) {
  background-color: rgba(255, 125, 0, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-pending td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-pending td) {
  color: var(--warning) !important;
}

.dynamic-table :deep(tr.row-dict-label-completed),
.dynamic-table :deep(.arco-table-tr.row-dict-label-completed) {
  color: var(--success) !important;
  font-weight: 600 !important;
  background-color: rgba(0, 180, 42, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-completed:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-completed:hover) {
  background-color: rgba(0, 180, 42, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-completed td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-completed td) {
  color: var(--success) !important;
  font-weight: 600 !important;
}

.dynamic-table :deep(tr.row-dict-label-rejected),
.dynamic-table :deep(.arco-table-tr.row-dict-label-rejected) {
  color: var(--error) !important;
  background-color: rgba(245, 63, 63, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-rejected:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-rejected:hover) {
  background-color: rgba(245, 63, 63, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-rejected td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-rejected td) {
  color: var(--error) !important;
}

.dynamic-table :deep(tr.row-dict-label-expired),
.dynamic-table :deep(.arco-table-tr.row-dict-label-expired) {
  color: var(--text-tertiary) !important;
  text-decoration: line-through !important;
  background-color: rgba(153, 153, 153, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-expired:hover),
.dynamic-table :deep(.arco-table-tr.row-dict-label-expired:hover) {
  background-color: rgba(153, 153, 153, 0.1) !important;
}

.dynamic-table :deep(tr.row-dict-label-expired td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-expired td) {
  color: var(--text-tertiary) !important;
  text-decoration: line-through !important;
}

/* 底部栏：分页 + 图例 */
.table-footer {
  flex-shrink: 0;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
}

.table-footer .arco-pagination {
  padding: 8px 16px;
  justify-content: flex-end;
  border-bottom: 1px solid var(--border-light);
}

/* 图例样式 */
.table-legend {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 8px 16px;
  background: var(--bg-hover);
  font-size: 13px;
  flex-wrap: wrap;
  max-height: 80px;
  overflow-y: auto;
}

/* 隐藏图例内部滚动条 */
.table-legend::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.legend-title {
  font-weight: 600;
  color: var(--text-primary);
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
  color: var(--text-secondary);
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
  color: var(--text-tertiary);
}

.legend-default {
  color: var(--text-primary);
  padding: 0 4px;
}

/* 让表格自动填充剩余空间 */
/* 根容器纵向弹性布局：QueryBar/工具栏固定，表格区自适应高度（消除加载高度跳越） */
.dynamic-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 表格弹性容器：占满剩余高度，内部表格独立滚动 */
.table-flex {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.table-flex :deep(.arco-table) {
  flex: 1;
  min-height: 0;
}

/* 表格独立滚动容器 - 仅表格部分滚动 */
.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
}

/* 表格最小宽度，保证列不会被过度挤压，更容易触发横向滚动 */
/* 表格容器强制横向滚动 */
.dynamic-table :deep(.arco-table-container) {
  overflow-x: auto !important;
  width: 100% !important;
}

/* 表格最小宽度，保证列不会被过度挤压，更容易触发横向滚动 */
.dynamic-table :deep(.arco-table) {
  min-width: 500px !important;
  width: auto !important;
  table-layout: fixed !important; /* 固定列宽布局，配合固定列使用 */
}

/* 表格横向滚动 */
.dynamic-table :deep(.arco-table) {
  width: 100%;
}

.dynamic-table :deep(.arco-table-body) {
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
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.image-empty {
  color: var(--text-tertiary);
}

/* ============ 整体 UI 与布局精修（本轮） ============ */

/* —— 查询区：内嵌标题栏 + 更舒展的字段间距 —— */
.dynamic-table__query {
  position: relative;
}
.dynamic-table__query::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--brand-blue), rgba(22,93,255,0.3));
  z-index: 1;
}
.dynamic-table__query .query-form {
  padding: 14px 16px 6px;
  padding-right: 120px;
}
.dynamic-table__query .query-form :deep(.arco-form-item) {
  margin-bottom: 14px !important;
  margin-right: 18px !important;
}
.dynamic-table__query .query-form :deep(.arco-form-item-label) {
  color: var(--text-secondary);
  font-weight: 500;
}
.dynamic-table__query .query-form :deep(.arco-input),
.dynamic-table__query .query-form :deep(.arco-select),
.dynamic-table__query .query-form :deep(.arco-picker) {
  border-radius: 6px;
}

/* —— 工具栏：分组更清晰，主操作显眼 —— */
.dynamic-table__toolbar {
  padding: 10px 14px;
  gap: 8px;
}
.dynamic-table__toolbar .toolbar-left :deep(.arco-space-item) { margin-right: 4px !important; }
.dynamic-table__toolbar .toolbar-right :deep(.arco-space-item) { margin-right: 2px !important; }
.dynamic-table__toolbar .toolbar-right :deep(button.v2-button) {
  height: 30px;
  border-radius: 6px;
}
/* 更多 / 工具 icon 按钮 */
.dynamic-table__toolbar :deep(.arco-btn) {
  border-radius: 6px;
}

/* —— 表格：行高舒适 + 斑马纹 + hover 平滑 —— */
.dynamic-table :deep(.arco-table-th) {
  height: 38px;
  padding: 0 14px;
  font-size: 13px;
  letter-spacing: 0.2px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-hover), #fff);
}
.dynamic-table :deep(.arco-table-td) {
  height: 44px;
  padding: 0 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-light);
}
/* 斑马纹 - 明暗交替 */
.dynamic-table :deep(.arco-table-tr:nth-child(even)) {
  background: #eceef3;
}
.dynamic-table :deep(.arco-table-tr:nth-child(even) .arco-table-td) {
  background-color: #eceef3 !important;
}
.dynamic-table :deep(.arco-table-tr:hover) {
  background: var(--info-bg) !important;
  transition: background 0.15s ease;
}

/* —— 外键列: 外跳图标(门户风格) —— */
.dynamic-table :deep(.fk-jump-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 3px;
  background: var(--brand-blue);
  color: #fff;
  margin-right: 4px;
  vertical-align: -2px;
  flex-shrink: 0;
}
.dynamic-table :deep(.fk-text.has-link .fk-jump-icon) {
  position: relative;
  top: -1px;
}

/* —— 操作列：按钮间加分隔竖线，悬停更清晰 —— */
.dynamic-table :deep(.arco-table-td) .arco-space-item {
  position: relative;
}
.dynamic-table :deep(.arco-table-td) :deep(.arco-btn-text) {
  padding: 4px 6px;
  color: var(--brand-blue);
  font-size: 13px;
}
.dynamic-table :deep(.arco-table-td) :deep(.arco-btn-text.danger) {
  color: var(--error);
}
.dynamic-table :deep(.arco-table-td) :deep(.arco-btn-text:not(:first-of-type)::before) {
  content: '';
  position: absolute;
  left: -1px; top: 50%;
  transform: translateY(-50%);
  width: 1px; height: 14px;
  background: var(--border);
}

/* —— Footer：分页与图例分栏，胶囊风格 —— */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
}
.table-footer :deep(.arco-pagination) {
  flex-wrap: wrap;
}
.table-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.legend-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: 2px;
}
.legend-group {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  background: var(--bg-hover);
  border-radius: 20px;
  font-size: 12px;
}
.legend-field-label {
  color: var(--text-tertiary);
}
.legend-item {
  display: inline-flex;
  align-items: center;
}
.legend-default {
  color: var(--text-secondary);
}

/* —— 空状态优化 —— */
.dynamic-table :deep(.arco-empty) {
  padding: 48px 0;
}
.dynamic-table :deep(.arco-empty-image) {
  color: var(--brand-blue);
  opacity: 0.4;
}
.dynamic-table :deep(.arco-spin) {
  min-height: 240px;
}

/* ═══════════════════════════════════════════════
   列表参考 Arco Pro search-table：表头灰 #f2f3f5、数据纯白、
   行 hover Arco 浅蓝、无斑马纹、细下边框
   ═══════════════════════════════════════════════ */
.dynamic-table :deep(.arco-table-th) {
  height: 38px;
  padding: 0 14px;
  background: #f2f3f5 !important;
  font-size: 13px;
  font-weight: 500;
  color: #1d2129;
}
.dynamic-table :deep(.arco-table-th)::before {
  background: #f2f3f5 !important;
}
.dynamic-table :deep(.arco-table-th)::after {
  border-right: none;
}
.dynamic-table :deep(.arco-table-th-fixed-left),
.dynamic-table :deep(.arco-table-th-fixed-right) {
  background: #f2f3f5 !important;
}

/* 数据行：纯白、无斑马、细下边框、行 hover Arco 浅蓝 */
.dynamic-table :deep(.arco-table-tr),
.dynamic-table :deep(.arco-table-td) {
  background: #fff;
  color: #1d2129;
}
.dynamic-table :deep(.arco-table-td) {
  height: 44px;
  padding: 0 14px;
  font-size: 13px;
  border-bottom: 1px solid #f2f3f5;
}
.dynamic-table :deep(.arco-table-tr:nth-child(even)),
.dynamic-table :deep(.arco-table-tr:nth-child(even) .arco-table-td) {
  background: #fff !important;
}
.dynamic-table :deep(.arco-table-tr:hover),
.dynamic-table :deep(.arco-table-tr:nth-child(even):hover),
.dynamic-table :deep(.arco-table-tr:hover .arco-table-td) {
  background: #e8f3ff !important;
}
.dynamic-table :deep(.arco-table-tr.arco-table-tr-checked),
.dynamic-table :deep(.arco-table-tr.arco-table-tr-checked .arco-table-td) {
  background: #e8f3ff !important;
}

/* 行内操作按钮：Arco link 蓝 / 红删除 */
.dynamic-table :deep(.arco-table-td) :deep(.arco-btn-text) {
  color: #165dff;
  font-size: 13px;
  padding: 4px 6px;
}
.dynamic-table :deep(.arco-table-td) :deep(.arco-btn-text.danger) {
  color: #f53f3f;
}
.dynamic-table :deep(.arco-table-td) :deep(.arco-btn-text):hover {
  color: #0e4bdb;
  background: #e8f3ff;
}
.dynamic-table :deep(.arco-table-td) :deep(.arco-btn-text.danger:hover) {
  color: #d73535;
}

/* 分页：Arco 默认，当前页品牌蓝 */
.dynamic-table :deep(.arco-pagination) {
  font-size: 13px;
}
.dynamic-table :deep(.arco-pagination-item) {
  border-radius: 4px;
  color: #4e5969;
}
.dynamic-table :deep(.arco-pagination-item-active) {
  background: #165dff !important;
  border-color: #165dff !important;
  color: #fff !important;
}
.dynamic-table :deep(.arco-pagination-item-active:hover) {
  background: #0e4bdb !important;
}
</style>
