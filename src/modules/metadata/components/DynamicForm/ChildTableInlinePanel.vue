<!-- 子表内嵌编辑面板组件 - 支持行内编辑，无弹出框 -->
<template>
  <div class="child-table-inline-panel">
    <div class="child-table-inline-panel__toolbar">
      <div class="toolbar-left">
        <a-space>
          <a-button
            v-if="canAddRow"
            type="primary"
            size="small"
            @click="handleAddRow"
          >
            <template #icon>
              <icon-plus />
            </template>
            新增行
          </a-button>
          <a-button
            v-if="canAddDialog"
            type="primary"
            size="small"
            @click="handleAddDialog"
          >
            <template #icon>
              <icon-plus />
            </template>
            弹窗新增
          </a-button>
          <a-button
            v-if="canDelete && selectedRowKeys.length > 0"
            size="small"
            status="danger"
            @click="handleBatchDelete"
          >
            <template #icon>
              <icon-delete />
            </template>
            批量删除
          </a-button>
          <a-button
            v-if="canRefresh"
            size="small"
            @click="loadChildData"
          >
            <template #icon>
              <icon-refresh />
            </template>
            刷新
          </a-button>
        </a-space>
      </div>
      <div class="toolbar-right">
        <a-space>
          <a-dropdown>
            <a-button size="small">
              <template #icon>
                <icon-more />
              </template>
              更多
            </a-button>
            <template #content>
              <a-doption @click="handleExport">
                <template #icon>
                  <icon-export />
                </template>
                导出
              </a-doption>
              <a-doption @click="handleImport">
                <template #icon>
                  <icon-import />
                </template>
                导入
              </a-doption>
            </template>
          </a-dropdown>
          <a-pagination
            v-model:current="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-size-options="pagination.pageSizeOptions"
            show-total
            show-page-size
            @change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          />
        </a-space>
      </div>
    </div>

    <a-table
      :data="tableData"
      :columns="tableColumns"
      :loading="loading"
      :pagination="false"
      :bordered="{ wrapper: true, cell: true }"
      size="small"
      :row-key="record => record.ID || record.id || record.__temp_id"
      class="child-table-inline-panel__table"
    >
      <!-- Checkbox + 序号列 -->
      <template #selection="{ record, rowIndex }">
        <div class="checkbox-with-index">
          <a-checkbox
            :model-value="selectedRowKeys.includes(record.ID || record.id || record.__temp_id)"
            @change="(checked) => handleRowSelect(rowIndex, checked)"
          />
          <span class="row-index">{{ (pagination.current - 1) * pagination.pageSize + rowIndex + 1 }}</span>
        </div>
      </template>

      <!-- 动态列渲染 -->
      <template
        v-for="column in editableColumns"
        :key="column.dataIndex"
        #[column.dataIndex]="{ record, rowIndex }"
      >
        <div class="editable-cell">
          <!-- 可编辑状态 -->
          <template v-if="isRowEditable(record)">
            <!-- 外键字段 -->
            <ForeignKeyField
              v-if="isForeignKeyColumn(column.columnConfig)"
              :column="column.columnConfig"
              :model-value="record[column.dataIndex]"
              mode="edit"
              @update:model-value="val => handleCellChange(rowIndex, column.dataIndex, val)"
            />

            <!-- 下拉选择字段 -->
            <a-select
              v-else-if="isSelectColumn(column.columnConfig)"
              :model-value="record[column.dataIndex]"
              :placeholder="`请选择${column.title}`"
              size="small"
              allow-clear
              @change="val => handleCellChange(rowIndex, column.dataIndex, val)"
            >
              <a-option
                v-for="option in getDictOptions(column.columnConfig)"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </a-option>
            </a-select>

            <!-- 数字输入框 -->
            <a-input-number
              v-else-if="column.columnConfig.CONTROL_TYPE === 'number'"
              :model-value="record[column.dataIndex]"
              :placeholder="`请输入${column.title}`"
              size="small"
              style="width: 100%"
              @change="val => handleCellChange(rowIndex, column.dataIndex, val)"
            />

            <!-- 日期选择 -->
            <a-date-picker
              v-else-if="column.columnConfig.CONTROL_TYPE === 'date'"
              :model-value="record[column.dataIndex]"
              :placeholder="`请选择${column.title}`"
              size="small"
              allow-clear
              style="width: 100%"
              @change="val => handleCellChange(rowIndex, column.dataIndex, val)"
            />

            <!-- 日期时间选择 -->
            <a-date-picker
              v-else-if="column.columnConfig.CONTROL_TYPE === 'datetime'"
              :model-value="record[column.dataIndex]"
              :placeholder="`请选择${column.title}`"
              size="small"
              show-time
              allow-clear
              style="width: 100%"
              @change="val => handleCellChange(rowIndex, column.dataIndex, val)"
            />

            <!-- 文本域 -->
            <a-textarea
              v-else-if="column.columnConfig.CONTROL_TYPE === 'textarea'"
              :model-value="record[column.dataIndex]"
              :placeholder="`请输入${column.title}`"
              :auto-size="{ minRows: 1, maxRows: 3 }"
              size="small"
              @input="val => handleCellChange(rowIndex, column.dataIndex, val)"
            />

            <!-- 默认文本输入框 -->
            <a-input
              v-else
              :model-value="record[column.dataIndex]"
              :placeholder="`请输入${column.title}`"
              size="small"
              @input="val => handleCellChange(rowIndex, column.dataIndex, val)"
            />
          </template>

          <!-- 只读状态 -->
          <template v-else>
            <!-- 外键字段：显示外键显示值 -->
            <ForeignKeyField
              v-if="isForeignKeyColumn(column.columnConfig)"
              :column="column.columnConfig"
              :model-value="record[column.dataIndex]"
              mode="view"
            />
            <!-- 下拉选择字段：显示选项标签 -->
            <span v-else-if="isSelectColumn(column.columnConfig)">
              {{ getSelectLabel(column.columnConfig, record[column.dataIndex]) || '-' }}
            </span>
            <!-- 其他字段：直接显示值 -->
            <span v-else>{{ record[column.dataIndex] || '-' }}</span>
          </template>
        </div>
      </template>

      <!-- 操作列 -->
      <template #action="{ record, rowIndex }">
        <a-space>
          <!-- Y 和 A 类型：显示编辑/保存按钮 -->
          <a-button
            v-if="canEdit && (editType === 'Y' || editType === 'A')"
            type="text"
            size="mini"
            @click="handleSaveOrEdit(record, rowIndex)"
          >
            {{ isRecordEditing(record) || record.__is_new ? '保存' : '编辑' }}
          </a-button>
          <a-popconfirm
            v-if="canDelete"
            content="确定删除这条记录吗？"
            @ok="handleDeleteRow(rowIndex)"
          >
            <a-button
              type="text"
              size="mini"
              status="danger"
            >
              删除
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 编辑对话框 -->
    <a-modal
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth"
      top="20vh"
      :mask-closable="false"
      :align-center="false"
      :render-to-body="false"
      :esc-to-close="false"
      modal-class="child-table-modal"
      wrap-class="child-table-modal-wrap"
      mask-class="child-table-modal-mask"
      @before-ok="handleDialogOk"
      @cancel="handleDialogCancel"
      @before-open="handleBeforeOpen"
    >
      <div>
        <DynamicForm
          v-show="dialogVisible"
          ref="dialogFormRef"
          :key="`${childTableId}-${dialogMode}-${currentRecordId || 'new'}`"
          :table-id="childTableId"
          :record-id="currentRecordId"
          :mode="dialogMode"
          :show-system-fields="false"
          @loaded="handleFormLoaded"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, h } from 'vue'
import { Message, Checkbox } from '@arco-design/web-vue'
import { IconPlus, IconRefresh, IconDelete, IconExport, IconImport, IconMore } from '@arco-design/web-vue/es/icon'
import ForeignKeyField from '../FieldRenderers/ForeignKeyField.vue'
import DynamicForm from './DynamicForm.vue'
import * as metadataApi from '../../api/metadata'
import type { FormMode, SysColumn } from '../../types'

interface Props {
  parentTableId: number
  parentRecordId?: number  // 新增时可能没有 parentRecordId
  childTable: any
  mode: FormMode
}

const props = defineProps<Props>()
const emit = defineEmits<{
  change: [data: any[]]
  refresh: []  // 新增：通知父组件刷新整个表单
}>()

// ==================== 状态 ====================

const loading = ref(false)
const tableData = ref<any[]>([])
const nextTempId = ref(-1)  // 临时 ID，用于新增的行
const editingRecordIds = ref<Set<number>>(new Set())  // 正在编辑的记录ID集合

// 选择状态
const selectedRowKeys = ref<(string | number)[]>([])

// 记录原始数据和修改的字段
const originalData = ref<Map<number, any>>(new Map())  // 记录ID -> 原始数据
const modifiedFields = ref<Map<number, Set<string>>>(new Map())  // 记录ID -> 修改的字段集合

// 分页状态
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50, 100]
})

// 对话框相关状态
const dialogVisible = ref(false)
const dialogFormRef = ref()
const dialogMode = ref<'create' | 'edit'>('edit')
const currentRecordId = ref<number>()
const dialogTitle = computed(() => dialogMode.value === 'create' ? '新增明细' : '编辑明细')
const formLoaded = ref(false)  // 跟踪表单是否已加载完成

/**
 * 根据 SYS_OBJUICONF_ID 计算对话框宽度
 */
const dialogWidth = computed(() => {
  const table = props.childTable.table
  const objUiConfId = table.SYS_OBJUICONF_ID || (table as any).sysObjuiconfId || 2

  // 根据表单列数配置返回不同的宽度
  // 1: 1列 - 窄，2: 2列 - 中等，3: 3列 - 宽，4: 4列 - 很宽
  switch (objUiConfId) {
    case 1:
      return '700px'  // 1列布局，较窄
    case 2:
      return '1000px'  // 2列布局，中等
    case 3:
      return '1200px'  // 3列布局，较宽
    case 4:
      return '1400px'  // 4列布局，最宽
    default:
      return '1000px'  // 默认2列宽度
  }
})

// ==================== 计算属性 ====================

const childTableId = computed(() => {
  const table = props.childTable.table
  return table.ID || table.id
})

const editType = computed(() => {
  const ref = props.childTable.ref
  return ref.editType || ref.EDIT_TYPE || 'Y'
})

const canAdd = computed(() => {
  if (props.mode === 'view') return false
  const type = editType.value
  return type && type !== 'N' && type !== 'NS'
})

// 是否显示"新增行"按钮（仅 Y 类型显示）
const canAddRow = computed(() => {
  if (props.mode === 'view') return false
  return editType.value === 'Y'
})

// 是否显示"弹窗新增"按钮（仅 A 类型显示）
const canAddDialog = computed(() => {
  if (props.mode === 'view') return false
  return editType.value === 'A'
})

const canEdit = computed(() => {
  if (props.mode === 'view') return false
  const type = editType.value
  // Y 和 A 类型都支持编辑按钮
  return type === 'Y' || type === 'A'
})

const canDelete = computed(() => {
  if (props.mode === 'view') return false
  const type = editType.value
  return type && type !== 'N' && type !== 'NS'
})

const canRefresh = computed(() => props.mode !== 'create')

/**
 * 可编辑的列
 */
const editableColumns = computed(() => {
  return props.childTable.columns
    .filter((col: any) => {
      const orderno = col.ORDERNO || col.orderno || 0
      const isActive = col.IS_ACTIVE || col.isActive

      // 排除系统字段和非活动字段
      if (orderno > 1000 || isActive !== 'Y') {
        return false
      }

      // 检查字段 MASK 的第 0 位（索引 0）：列表可见
      const mask = col.MASK || col.mask
      if (mask && mask.length >= 1) {
        const listVisible = mask[0] === '1'
        return listVisible
      }

      // 如果没有 MASK，业务字段默认可见
      const dbName = col.DB_NAME || col.dbName
      const systemFields = ['ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME', 'SYS_COMPANY_ID', 'IS_ACTIVE']
      return !systemFields.includes(dbName)
    })
    .map((col: any) => ({
      title: col.DISPLAY_NAME || col.displayName,
      dataIndex: col.DB_NAME || col.dbName,
      slotName: col.DB_NAME || col.dbName,
      width: col.LIST_WIDTH || col.listWidth || 150,
      columnConfig: col
    }))
})

/**
 * 表格列（不包括序号列，序号在checkbox列中显示）
 */
const tableColumns = computed(() => {
  const columns = []

  // 添加 checkbox + 序号列到开头
  columns.push({
    title: () => h('div', { class: 'checkbox-with-index' }, [
      h(Checkbox, {
        modelValue: selectedRowKeys.value.length === tableData.value.length && tableData.value.length > 0,
        indeterminate: selectedRowKeys.value.length > 0 && selectedRowKeys.value.length < tableData.value.length,
        onChange: handleSelectAll
      }),
      h('span', { class: 'header-text' }, '序号')
    ]),
    dataIndex: 'selection',
    slotName: 'selection',
    width: 100,
    align: 'center'
  })

  // 添加业务列（处理必填标记）
  editableColumns.value.forEach(col => {
    const nullable = col.columnConfig.NULL_ABLE || col.columnConfig.nullable || col.columnConfig.nullAble
    const isRequired = nullable === 'N'
    const displayName = col.columnConfig.DISPLAY_NAME || col.columnConfig.displayName

    columns.push({
      title: isRequired
        ? () => [
            displayName,
            h('span', { style: 'color: #f53f3f; font-weight: bold;' }, ' *')
          ]
        : displayName,
      dataIndex: col.dataIndex,
      slotName: col.slotName,
      width: col.width,
      align: col.align
    })
  })

  // 添加操作列
  if (canEdit.value || canDelete.value) {
    columns.push({
      title: '操作',
      dataIndex: 'action',
      slotName: 'action',
      width: 120,
      align: 'center',
      fixed: 'right'
    })
  }

  return columns
})

// ==================== 方法 ====================

/**
 * 判断某一行是否可以编辑
 * Y 类型：新增行或正在编辑的行可编辑
 * A 类型：新增行或正在编辑的行可编辑（与 Y 类型相同）
 */
function isRowEditable(record: any): boolean {
  const type = editType.value

  if (type === 'Y' || type === 'A') {
    // Y 和 A 类型：新增行或正在编辑的行可以编辑
    if (record.__is_new === true) {
      return true
    }
    const recordId = record.ID || record.id
    const editable = recordId && editingRecordIds.value.has(recordId)
    console.log('[ChildTableInlinePanel] isRowEditable - recordId:', recordId, 'editable:', editable, 'editingRecordIds:', Array.from(editingRecordIds.value))
    return editable
  }

  return false
}

/**
 * 判断某条记录是否正在编辑
 */
function isRecordEditing(record: any): boolean {
  const recordId = record.ID || record.id
  return recordId && editingRecordIds.value.has(recordId)
}

/**
 * 判断是否为外键列
 */
function isForeignKeyColumn(column: SysColumn): boolean {
  const setValueType = column.SET_VALUE_TYPE || (column as any).setValueType
  return setValueType === 'fk'
}

/**
 * 判断是否为下拉选择列
 */
function isSelectColumn(column: SysColumn): boolean {
  const setValueType = column.SET_VALUE_TYPE || (column as any).setValueType
  return setValueType === 'select'
}

/**
 * 获取字典选项
 */
function getDictOptions(column: SysColumn): Array<{ value: string; label: string }> {
  const sysDictID = column.SYS_DICT_ID || (column as any).sysDictId
  if (!sysDictID || !props.childTable.dictData) {
    return []
  }

  const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
  const dictItems = props.childTable.dictData[dictID]

  if (!dictItems) return []

  return dictItems.map((item: any) => ({
    value: item.VALUE || (item as any).value,
    label: item.DISPLAY_NAME || (item as any).displayName
  }))
}

/**
 * 获取下拉选择的显示标签
 */
function getSelectLabel(column: SysColumn, value: any): string {
  const options = getDictOptions(column)
  const option = options.find(opt => opt.value === value)
  return option ? option.label : value
}

/**
 * 新增行
 */
function handleAddRow() {
  const newRow: any = {
    __temp_id: nextTempId.value--,  // 临时ID，用于标识新增的行
    __is_new: true  // 标记为新增的行
  }

  // 初始化所有可编辑字段为 null
  editableColumns.value.forEach(col => {
    newRow[col.dataIndex] = null
  })

  // 如果是编辑模式且有父记录ID，自动设置外键字段
  if (props.parentRecordId) {
    const refColumn = props.childTable.columns.find((col: any) => {
      const refTableId = col.REF_TABLE_ID || col.refTableId
      return refTableId === props.parentTableId
    })

    if (refColumn) {
      const refColumnDbName = refColumn.DB_NAME || refColumn.dbName
      newRow[refColumnDbName] = props.parentRecordId
    }
  }

  tableData.value.push(newRow)
  emitChange()
}

/**
 * 删除行
 */
function handleDeleteRow(rowIndex: number) {
  tableData.value.splice(rowIndex, 1)
  emitChange()
}

/**
 * 批量删除
 */
async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    Message.warning('请先选择要删除的记录')
    return
  }

  try {
    const table = props.childTable.table
    const childTableName = table.NAME || table.name

    // 过滤出需要删除的记录
    const recordsToDelete = tableData.value.filter(record => {
      const key = record.ID || record.id || record.__temp_id
      return selectedRowKeys.value.includes(key)
    })

    // 分离新增行和已保存的记录
    const newRows = recordsToDelete.filter(r => r.__is_new)
    const savedRecords = recordsToDelete.filter(r => !r.__is_new && (r.ID || r.id))

    // 删除已保存的记录（调用API）
    if (savedRecords.length > 0) {
      for (const record of savedRecords) {
        const recordId = record.ID || record.id
        await metadataApi.deleteRecord(childTableName, recordId)
      }
      Message.success(`成功删除 ${savedRecords.length} 条记录`)
    }

    // 删除新增行（直接从数组中移除）
    if (newRows.length > 0) {
      tableData.value = tableData.value.filter(record => {
        const key = record.ID || record.id || record.__temp_id
        return !selectedRowKeys.value.includes(key)
      })
      emitChange()
    }

    // 清空选择
    selectedRowKeys.value = []

    // 重新加载数据
    if (savedRecords.length > 0) {
      await loadChildData()
    }
  } catch (error: any) {
    console.error('[ChildTableInlinePanel] 批量删除失败:', error)
    Message.error('批量删除失败: ' + (error.message || '未知错误'))
  }
}

/**
 * 导出
 */
function handleExport() {
  Message.info('导出功能开发中...')
  // TODO: 实现导出功能
}

/**
 * 导入
 */
function handleImport() {
  Message.info('导入功能开发中...')
  // TODO: 实现导入功能
}

/**
 * 新增行（弹窗方式）
 */
function handleAddDialog() {
  dialogMode.value = 'create'
  currentRecordId.value = undefined
  formLoaded.value = false  // 重置加载状态
  dialogVisible.value = true
}

/**
 * 表单加载完成回调
 */
function handleFormLoaded(config: any) {
  console.log('[ChildTableInlinePanel] 表单加载完成:', config)
  console.log('[ChildTableInlinePanel] dialogFormRef.value:', dialogFormRef.value)

  // 等待下一个 tick 确保 ref 已经绑定
  nextTick(() => {
    console.log('[ChildTableInlinePanel] nextTick 后 dialogFormRef.value:', dialogFormRef.value)
    formLoaded.value = true
  })
}

/**
 * 对话框打开前回调
 */
function handleBeforeOpen() {
  console.log('[ChildTableInlinePanel] 对话框即将打开')
  formLoaded.value = false
}

/**
 * 编辑行
 * Y 类型：切换行的编辑状态（行内编辑）
 * A 类型：切换行的编辑状态（行内编辑）
 */
function handleEdit(record: any) {
  const recordId = record.ID || record.id
  console.log('[ChildTableInlinePanel] handleEdit - recordId:', recordId, 'record:', record)

  if (!recordId) {
    Message.warning('该记录没有ID，无法编辑')
    return
  }

  const type = editType.value
  console.log('[ChildTableInlinePanel] handleEdit - editType:', type)

  if (type === 'Y' || type === 'A') {
    // Y 和 A 类型：切换编辑状态
    if (editingRecordIds.value.has(recordId)) {
      console.log('[ChildTableInlinePanel] 保存记录:', recordId)
      // 如果已经在编辑，则保存并退出编辑状态
      editingRecordIds.value.delete(recordId)
      saveRecord(record)
    } else {
      console.log('[ChildTableInlinePanel] 进入编辑状态:', recordId)
      // 进入编辑状态，保存原始数据
      originalData.value.set(recordId, JSON.parse(JSON.stringify(record)))
      modifiedFields.value.set(recordId, new Set())
      editingRecordIds.value.add(recordId)
      console.log('[ChildTableInlinePanel] editingRecordIds:', Array.from(editingRecordIds.value))
    }
  }
}

/**
 * 保存或编辑（统一处理新增行和已有行）
 */
async function handleSaveOrEdit(record: any, rowIndex: number) {
  // 如果是新增的行，保存到后端
  if (record.__is_new) {
    await saveNewRecord(record, rowIndex)
  } else {
    // 如果是已有的行，调用原来的编辑逻辑
    handleEdit(record)
  }
}

/**
 * 保存新增的行
 */
async function saveNewRecord(record: any, rowIndex: number) {
  try {
    const table = props.childTable.table
    const childTableName = table.NAME || table.name

    console.log('[ChildTableInlinePanel] 保存前的 record:', JSON.stringify(record))

    // 验证必填字段
    const validationResult = validateNewRecord(record)
    if (!validationResult.valid) {
      Message.warning(validationResult.errors[0])
      return
    }

    // 准备保存的数据（移除临时标记）
    const { __temp_id, __is_new, ...saveData } = record

    console.log('[ChildTableInlinePanel] 移除临时标记后:', JSON.stringify(saveData))

    // 根据字段类型处理空值
    Object.keys(saveData).forEach(field => {
      let value = saveData[field]

      // 查找字段配置
      const columnConfig = props.childTable.columns.find((col: any) => {
        const dbName = col.DB_NAME || col.dbName
        return dbName === field
      })

      if (columnConfig) {
        const dataType = (columnConfig.DATA_TYPE || columnConfig.dataType || '').toLowerCase()

        // 如果值为空字符串，根据数据类型转换
        if (value === '') {
          if (dataType.includes('int') || dataType.includes('decimal') || dataType.includes('float') || dataType.includes('double') || dataType.includes('number')) {
            // 数字类型：转换为 0
            saveData[field] = 0
          } else if (dataType.includes('char') || dataType.includes('text')) {
            // 字符串类型：保持空字符串
            saveData[field] = ''
          } else {
            // 其他类型：转换为 null
            saveData[field] = null
          }
        }
      }
    })

    // 设置父记录关联
    if (props.parentRecordId) {
      const refColumn = props.childTable.columns.find((col: any) => {
        const refTableId = col.REF_TABLE_ID || col.refTableId
        return refTableId === props.parentTableId
      })

      if (refColumn) {
        const refColumnDbName = refColumn.DB_NAME || refColumn.dbName
        saveData[refColumnDbName] = props.parentRecordId
        console.log('[ChildTableInlinePanel] 设置父记录关联:', refColumnDbName, '=', props.parentRecordId)
      }
    }

    console.log('[ChildTableInlinePanel] 最终保存的数据:', JSON.stringify(saveData))

    // 调用 API 创建记录
    const result = await metadataApi.createRecord(childTableName, saveData)
    Message.success('保存成功')

    // 重新加载数据
    await loadChildData()
  } catch (error: any) {
    console.error('[ChildTableInlinePanel] 保存新增行失败:', error)
    Message.error('保存失败: ' + (error.message || '未知错误'))

    // 保存失败时也刷新明细，恢复到保存前的状态
    await loadChildData()
  }
}

/**
 * 验证新增记录
 */
function validateNewRecord(record: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  editableColumns.value.forEach(col => {
    const value = record[col.dataIndex]
    const columnConfig = col.columnConfig

    // 检查必填字段
    const nullable = columnConfig.NULL_ABLE || (columnConfig as any).nullable
    if (nullable === 'N' && (value === null || value === undefined || value === '')) {
      errors.push(`${col.title} 不能为空`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 保存单条记录（只保存修改的字段）
 */
async function saveRecord(record: any) {
  try {
    const table = props.childTable.table
    const childTableName = table.NAME || table.name
    const recordId = record.ID || record.id

    if (!recordId) {
      Message.error('记录ID不存在')
      return
    }

    // 获取修改的字段
    const modified = modifiedFields.value.get(recordId)
    if (!modified || modified.size === 0) {
      Message.info('没有修改')
      // 清理原始数据
      originalData.value.delete(recordId)
      modifiedFields.value.delete(recordId)
      return
    }

    // 只提取修改的字段，并根据字段类型处理空值
    const updateData: Record<string, any> = {}
    modified.forEach(field => {
      let value = record[field]

      // 查找字段配置
      const columnConfig = props.childTable.columns.find((col: any) => {
        const dbName = col.DB_NAME || col.dbName
        return dbName === field
      })

      if (columnConfig) {
        const dataType = (columnConfig.DATA_TYPE || columnConfig.dataType || '').toLowerCase()

        // 如果值为空字符串，根据数据类型转换
        if (value === '') {
          if (dataType.includes('int') || dataType.includes('decimal') || dataType.includes('float') || dataType.includes('double') || dataType.includes('number')) {
            // 数字类型：转换为 0
            value = 0
          } else if (dataType.includes('char') || dataType.includes('text')) {
            // 字符串类型：保持空字符串
            value = ''
          } else {
            // 其他类型：转换为 null
            value = null
          }
        }
      }

      updateData[field] = value
    })

    console.log('[ChildTableInlinePanel] 只保存修改的字段:', updateData)

    await metadataApi.updateRecord(childTableName, recordId, updateData)
    Message.success('保存成功')

    // 清理原始数据和修改标记
    originalData.value.delete(recordId)
    modifiedFields.value.delete(recordId)

    // 重新加载数据以获取最新状态
    await loadChildData()
  } catch (error: any) {
    console.error('[ChildTableInlinePanel] 保存失败:', error)
    Message.error('保存失败: ' + (error.message || '未知错误'))

    // 保存失败时也刷新明细，恢复到保存前的状态
    await loadChildData()
  }
}

/**
 * 对话框确定
 */
async function handleDialogOk(done: (closed: boolean) => void) {
  try {
    console.log('[ChildTableInlinePanel] handleDialogOk 开始')

    // 等待 DOM 更新
    await nextTick()

    // 检查表单是否已加载完成
    if (!formLoaded.value) {
      Message.warning('表单正在加载中，请稍候...')
      console.warn('[ChildTableInlinePanel] 表单尚未加载完成')
      done(false)  // 阻止关闭
      return
    }

    // 等待 ref 可用（最多等待 3 秒）
    let retryCount = 0
    const maxRetries = 30  // 30 * 100ms = 3 秒
    while (!dialogFormRef.value && retryCount < maxRetries) {
      console.log('[ChildTableInlinePanel] 等待 dialogFormRef 可用，重试次数:', retryCount)
      await new Promise(resolve => setTimeout(resolve, 100))
      retryCount++
    }

    console.log('[ChildTableInlinePanel] dialogFormRef.value:', dialogFormRef.value)

    if (!dialogFormRef.value) {
      Message.error('表单未加载完成，请稍后再试')
      console.error('[ChildTableInlinePanel] dialogFormRef.value 仍然为 null，已重试', retryCount, '次')
      done(false)  // 阻止关闭
      return
    }

    // 验证表单
    const valid = await dialogFormRef.value.validate()
    console.log('[ChildTableInlinePanel] 表单验证结果:', valid)

    if (!valid) {
      Message.warning('请检查表单填写')
      done(false)  // 阻止关闭
      return
    }

    // 获取表单数据
    const formData = dialogFormRef.value.getFormData()
    console.log('[ChildTableInlinePanel] 获取到的表单数据:', formData)

    if (!formData) {
      Message.error('获取表单数据失败')
      done(false)  // 阻止关闭
      return
    }

    // 设置外键字段
    if (props.parentRecordId) {
      const refColumn = props.childTable.columns.find((col: any) => {
        const refTableId = col.REF_TABLE_ID || col.refTableId
        return refTableId === props.parentTableId
      })

      if (refColumn) {
        const refColumnDbName = refColumn.DB_NAME || refColumn.dbName
        formData[refColumnDbName] = props.parentRecordId
        console.log('[ChildTableInlinePanel] 设置外键字段:', refColumnDbName, '=', props.parentRecordId)
      }
    }

    const table = props.childTable.table
    const childTableName = table.NAME || table.name

    if (dialogMode.value === 'create') {
      // 新增模式
      console.log('[ChildTableInlinePanel] 执行新增:', childTableName, formData)
      await metadataApi.createRecord(childTableName, formData)
      Message.success('新增成功')
    } else {
      // 编辑模式
      console.log('[ChildTableInlinePanel] 执行更新:', childTableName, currentRecordId.value, formData)
      await metadataApi.updateRecord(childTableName, currentRecordId.value!, formData)
      Message.success('更新成功')
    }

    // 通知父组件刷新整个表单
    emit('refresh')

    // 重新加载明细数据
    await loadChildData()

    // 关闭对话框
    done(true)
  } catch (error: any) {
    console.error('[ChildTableInlinePanel] 操作失败:', error)
    Message.error('操作失败: ' + (error.message || '未知错误'))
    done(false)  // 阻止关闭
  }
}

/**
 * 对话框取消
 */
function handleDialogCancel() {
  dialogVisible.value = false
}

/**
 * 单元格值变化
 */
function handleCellChange(rowIndex: number, field: string, value: any) {
  if (tableData.value[rowIndex]) {
    const record = tableData.value[rowIndex]
    const recordId = record.ID || record.id

    console.log('[ChildTableInlinePanel] handleCellChange - rowIndex:', rowIndex, 'field:', field, 'value:', value, 'recordId:', recordId)

    // 更新值
    record[field] = value

    // 如果是正在编辑的记录，记录修改的字段
    if (recordId && editingRecordIds.value.has(recordId)) {
      if (!modifiedFields.value.has(recordId)) {
        modifiedFields.value.set(recordId, new Set())
      }
      modifiedFields.value.get(recordId)!.add(field)
      console.log('[ChildTableInlinePanel] 记录修改字段:', field, '当前修改字段:', Array.from(modifiedFields.value.get(recordId)!))
    } else {
      console.log('[ChildTableInlinePanel] 记录不在编辑状态，editingRecordIds:', Array.from(editingRecordIds.value))
    }

    emitChange()
  }
}

/**
 * 加载子表数据（仅编辑模式）
 */
async function loadChildData() {
  if (!props.parentRecordId) {
    // 新增模式，不加载数据
    return
  }

  loading.value = true
  try {
    const ref = props.childTable.ref

    // 找到子表中引用父表的外键字段
    let refColumn = props.childTable.columns.find((col: any) => {
      const refTableId = col.REF_TABLE_ID || col.refTableId
      return refTableId === props.parentTableId
    })

    if (!refColumn) {
      const refColumnId = ref.refColumnId || ref.REF_COLUMN_ID
      refColumn = props.childTable.columns.find((col: any) => {
        const colId = col.ID || col.id
        return colId === refColumnId
      })
    }

    if (!refColumn) {
      console.error('未找到外键字段')
      Message.error('子表配置错误：未找到外键字段')
      return
    }

    const refColumnDbName = refColumn.DB_NAME || refColumn.dbName

    // 构建过滤条件
    const filters: Record<string, any> = {
      [refColumnDbName]: props.parentRecordId
    }

    const table = props.childTable.table
    const childTableName = table.NAME || table.name

    console.log('[ChildTableInlinePanel] 加载子表数据:', {
      tableName: childTableName,
      filters
    })

    // 调用 API 加载数据
    const response = await metadataApi.fetchRecords(childTableName, {
      filters,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    })

    tableData.value = response.list || []
    pagination.value.total = response.total || 0

    console.log('[ChildTableInlinePanel] 加载到的数据:', tableData.value)
    console.log('[ChildTableInlinePanel] editType:', editType.value)
    console.log('[ChildTableInlinePanel] editableColumns:', editableColumns.value)
    console.log('[ChildTableInlinePanel] tableColumns:', tableColumns.value)
  } catch (error: any) {
    console.error('加载子表数据失败:', error)
    Message.error('加载子表数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

/**
 * 触发变化事件
 */
function emitChange() {
  emit('change', tableData.value)
}

/**
 * 获取表格数据（供父组件调用）
 */
function getData(): any[] {
  return tableData.value.map(row => {
    // 移除临时标记字段
    const { __temp_id, __is_new, ...data } = row
    return data
  })
}

/**
 * 设置表格数据（供父组件调用）
 */
function setData(data: any[]) {
  tableData.value = data
}

/**
 * 验证数据（供父组件调用）
 */
function validate(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  tableData.value.forEach((row, index) => {
    editableColumns.value.forEach(col => {
      const value = row[col.dataIndex]
      const columnConfig = col.columnConfig

      // 检查必填字段
      const nullable = columnConfig.NULL_ABLE || (columnConfig as any).nullable
      if (nullable === 'N' && (value === null || value === undefined || value === '')) {
        errors.push(`第 ${index + 1} 行：${col.title} 不能为空`)
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 分页变化处理
 */
function handlePageChange(page: number) {
  pagination.value.current = page
  loadChildData()
}

/**
 * 每页条数变化处理
 */
function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize
  pagination.value.current = 1  // 重置到第一页
  loadChildData()
}

/**
 * 处理行选择
 */
function handleRowSelect(rowIndex: number, checked: boolean) {
  const record = tableData.value[rowIndex]
  const key = record.ID || record.id || record.__temp_id

  if (checked) {
    if (!selectedRowKeys.value.includes(key)) {
      selectedRowKeys.value.push(key)
    }
  } else {
    const index = selectedRowKeys.value.indexOf(key)
    if (index > -1) {
      selectedRowKeys.value.splice(index, 1)
    }
  }
}

/**
 * 处理全选
 */
function handleSelectAll(checked: boolean) {
  if (checked) {
    selectedRowKeys.value = tableData.value.map(record => record.ID || record.id || record.__temp_id)
  } else {
    selectedRowKeys.value = []
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  console.log('[ChildTableInlinePanel] onMounted:', {
    mode: props.mode,
    parentRecordId: props.parentRecordId,
    childTableName: props.childTable.table.NAME || props.childTable.table.name
  })

  if (props.mode !== 'create' && props.parentRecordId) {
    loadChildData()
  }
})

// 监听 parentRecordId 变化，重新加载数据
watch(() => props.parentRecordId, (newVal, oldVal) => {
  console.log('[ChildTableInlinePanel] parentRecordId 变化:', oldVal, '->', newVal)
  if (newVal && props.mode !== 'create') {
    loadChildData()
  }
})

// ==================== 暴露方法 ====================

defineExpose({
  getData,
  setData,
  validate
})
</script>

<style scoped>
.child-table-inline-panel {
  width: 100%;
}

.child-table-inline-panel__toolbar {
  padding: 12px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  flex: 0 0 auto;
}

.toolbar-right {
  flex: 0 0 auto;
}

.child-table-inline-panel__table {
  width: 100%;
}

.child-table-inline-panel__table :deep(.arco-table) {
  font-size: 13px;
}

/* Checkbox 和序号合并显示 */
.child-table-inline-panel__table :deep(.checkbox-with-index) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.child-table-inline-panel__table :deep(.row-index) {
  color: #86909c;
  font-size: 12px;
}

.child-table-inline-panel__table :deep(.header-text) {
  color: #1d2129;
  font-size: 14px;
  font-weight: 600;
}

.child-table-inline-panel__table :deep(.arco-table-th) {
  background: #fafafa;
  font-weight: 600;
}

.child-table-inline-panel__table :deep(.arco-table-td) {
  padding: 4px 8px;
}

.editable-cell {
  width: 100%;
}

.editable-cell :deep(.arco-input),
.editable-cell :deep(.arco-input-number),
.editable-cell :deep(.arco-select),
.editable-cell :deep(.arco-picker),
.editable-cell :deep(.arco-textarea) {
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.editable-cell :deep(.arco-input:hover),
.editable-cell :deep(.arco-input-number:hover),
.editable-cell :deep(.arco-select:hover),
.editable-cell :deep(.arco-picker:hover),
.editable-cell :deep(.arco-textarea:hover) {
  border-color: #d9d9d9;
}

.editable-cell :deep(.arco-input:focus),
.editable-cell :deep(.arco-input-number:focus),
.editable-cell :deep(.arco-select:focus),
.editable-cell :deep(.arco-picker:focus),
.editable-cell :deep(.arco-textarea:focus) {
  border-color: #3370ff;
}

.child-table-inline-panel__table :deep(.arco-btn-text) {
  padding: 0 4px;
}

/* 对话框样式 */
:deep(.child-table-modal .arco-modal) {
  margin-top: 0;
}

:global(.child-table-modal-wrap),
:global(.child-table-modal-mask) {
  left: 230px !important;
  width: calc(100% - 230px) !important;
  right: 0 !important;
  height: 100% !important;
  position: fixed !important;
}

:deep(.child-table-modal .arco-modal-body) {
  padding: 0;
  max-height: calc(80vh - 120px);
  overflow-y: auto;
}
</style>
