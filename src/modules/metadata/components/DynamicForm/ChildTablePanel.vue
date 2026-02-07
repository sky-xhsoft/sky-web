<!-- 子表面板组件 -->
<template>
  <div class="child-table-panel">
    <div class="child-table-panel__toolbar">
      <div class="toolbar-left">
        <a-space>
          <a-button
            v-if="canAdd"
            type="primary"
            size="small"
            @click="handleAdd"
          >
            <template #icon>
              <icon-plus />
            </template>
            新增
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
      :row-key="record => record.ID || record.id"
      size="small"
      class="child-table-panel__table"
    >
      <!-- Checkbox + 序号列 -->
      <template #selection="{ record, rowIndex }">
        <div class="checkbox-with-index">
          <a-checkbox
            :model-value="selectedRowKeys.includes(record.ID || record.id)"
            @change="(checked) => handleRowSelect(rowIndex, checked)"
          />
          <span class="row-index">{{ (pagination.current - 1) * pagination.pageSize + rowIndex + 1 }}</span>
        </div>
      </template>

      <!-- 操作列 -->
      <template #action="{ record }">
        <a-space>
          <a-button
            v-if="canView"
            type="text"
            size="mini"
            @click="handleView(record)"
          >
            查看
          </a-button>
          <a-button
            v-if="canEdit"
            type="text"
            size="mini"
            @click="handleEdit(record)"
          >
            编辑
          </a-button>
          <a-popconfirm
            v-if="canDelete"
            content="确定删除这条记录吗？"
            @ok="handleDelete(record)"
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

      <!-- 字典值翻译 -->
      <template
        v-for="column in selectColumns"
        :key="column.dataIndex"
        #[column.dataIndex]="{ record }"
      >
        {{ getDictLabel(column, record[column.dataIndex]) }}
      </template>

      <!-- 外键值显示 -->
      <template
        v-for="column in fkColumns"
        :key="column.dataIndex"
        #[column.dataIndex]="{ record }"
      >
        <span v-if="record[column.displayField]">
          {{ record[column.displayField] }}
        </span>
        <span v-else>
          {{ getFkDisplayValue(column, record[column.dataIndex]) }}
        </span>
      </template>
    </a-table>

    <!-- 子表记录编辑对话框 -->
    <a-modal
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth"
      top="20vh"
      :footer="dialogMode === 'view' ? false : undefined"
      :align-center="false"
      :render-to-body="false"
      :mask-closable="false"
      :esc-to-close="false"
      modal-class="child-table-modal"
      wrap-class="child-table-modal-wrap"
      mask-class="child-table-modal-mask"
      @ok="handleDialogOk"
      @cancel="handleDialogCancel"
      @before-open="handleBeforeOpen"
    >
      <div>
        <DynamicForm
          v-show="dialogVisible"
          ref="childFormRef"
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
import { ref, computed, onMounted, nextTick, h } from 'vue'
import { Message, Checkbox } from '@arco-design/web-vue'
import { IconPlus, IconRefresh, IconDelete, IconExport, IconImport, IconMore } from '@arco-design/web-vue/es/icon'
import DynamicForm from './DynamicForm.vue'
import * as metadataApi from '../../api/metadata'
import { useForeignKey } from '../../composables/useForeignKey'
import type { FormMode, SysColumn } from '../../types'

interface Props {
  parentTableId: number
  parentRecordId: number
  childTable: any
  mode: FormMode
}

const props = defineProps<Props>()

// ==================== 状态 ====================

const loading = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<FormMode>('view')
const currentRecordId = ref<number>()
const childFormRef = ref()
const fkDisplayCache = ref<Record<string, string>>({})
const formLoaded = ref(false)  // 跟踪表单是否已加载完成

// 选择状态
const selectedRowKeys = ref<(string | number)[]>([])

// 分页状态
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50, 100]
})

// ==================== 计算属性 ====================

const childTableId = computed(() => {
  const table = props.childTable.table
  return table.ID || table.id
})

const dialogTitle = computed(() => {
  const ref = props.childTable.ref
  const table = props.childTable.table
  const tableName = ref.displayName || ref.DISPLAY_NAME || table.DISPLAY_NAME || table.displayName
  switch (dialogMode.value) {
    case 'create':
      return `新增${tableName}`
    case 'edit':
      return `编辑${tableName}`
    case 'view':
      return `查看${tableName}`
    default:
      return tableName
  }
})

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

const canAdd = computed(() => {
  if (props.mode === 'view') return false
  const ref = props.childTable.ref
  const editType = ref.editType || ref.EDIT_TYPE
  return editType && editType !== 'N' && editType !== 'NS'
})

const canEdit = computed(() => {
  if (props.mode === 'view') return false
  const ref = props.childTable.ref
  const editType = ref.editType || ref.EDIT_TYPE
  return editType && editType !== 'N' && editType !== 'NS'
})

const canDelete = computed(() => {
  if (props.mode === 'view') return false
  const ref = props.childTable.ref
  const editType = ref.editType || ref.EDIT_TYPE
  return editType && editType !== 'N' && editType !== 'NS'
})

const canView = computed(() => true)

const canRefresh = computed(() => true)

const tableColumns = computed(() => {
  const columns = props.childTable.columns
    .filter((col: any) => {
      const orderno = col.ORDERNO || col.orderno || 0
      const isActive = col.IS_ACTIVE || col.isActive

      // 排除系统字段和非活动字段
      if (orderno > 1000 || isActive !== 'Y') {
        return false
      }

      // 检查字段 MASK 的第 5 位（索引 4）：列表可见
      // MASK 格式：1111111111（10位）
      // 第 5 位 = 列表可见，第 6 位 = 列表可修改
      const mask = col.MASK || col.mask
      if (mask && mask.length >= 5) {
        const listVisible = mask[4] === '1'
        return listVisible
      }

      // 如果没有 MASK 或 MASK 长度不足，检查是否配置了列宽
      const listWidth = col.LIST_WIDTH || col.listWidth
      if (listWidth && listWidth > 0) {
        return true  // 有列宽配置的字段默认显示
      }

      // 没有 MASK 也没有列宽配置，检查是否是系统字段
      const dbName = col.DB_NAME || col.dbName
      const systemFields = ['ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME', 'SYS_COMPANY_ID', 'IS_ACTIVE']
      if (systemFields.includes(dbName)) {
        return false  // 系统字段默认不显示（如果既没有 mask 也没有列宽）
      }

      // 其他业务字段默认显示
      return true
    })
    .map((col: any) => {
      const nullable = col.NULL_ABLE || col.nullable || col.nullAble
      const isRequired = nullable === 'N'
      const displayName = col.DISPLAY_NAME || col.displayName

      return {
        title: isRequired
          ? () => [
              displayName,
              h('span', { style: 'color: #f53f3f; font-weight: bold;' }, ' *')
            ]
          : displayName,
        dataIndex: col.DB_NAME || col.dbName,
        slotName: needsSlot(col) ? (col.DB_NAME || col.dbName) : undefined,
        width: col.LIST_WIDTH || col.listWidth || undefined
      }
    })

  // 添加 checkbox + 序号列到开头
  columns.unshift({
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

  // 添加操作列
  if (canView.value || canEdit.value || canDelete.value) {
    columns.push({
      title: '操作',
      dataIndex: 'action',
      slotName: 'action',
      width: 200,
      fixed: 'right'
    })
  }

  return columns
})

const selectColumns = computed(() => {
  return props.childTable.columns
    .filter((col: any) => {
      const setValueType = col.SET_VALUE_TYPE || col.setValueType
      return setValueType === 'select'
    })
    .map((col: any) => ({
      dataIndex: col.DB_NAME || col.dbName,
      dictId: col.SYS_DICT_ID || col.sysDictId
    }))
})

const fkColumns = computed(() => {
  return props.childTable.columns
    .filter((col: any) => {
      const setValueType = col.SET_VALUE_TYPE || col.setValueType
      return setValueType === 'fk'
    })
    .map((col: any) => {
      const dbName = col.DB_NAME || col.dbName
      return {
        dataIndex: dbName,
        displayField: `${dbName}_DISPLAY`,
        refTableId: col.REF_TABLE_ID || col.refTableId,
        refColumnId: col.REF_COLUMN_ID || col.refColumnId
      }
    })
})

// ==================== 方法 ====================

function needsSlot(column: any): boolean {
  const setValueType = column.SET_VALUE_TYPE || column.setValueType
  return setValueType === 'select' || setValueType === 'fk'
}

function getDictLabel(column: any, value: any): string {
  if (!value) return ''

  const dictData = props.childTable.dictData[column.dictId]
  if (!dictData) return value

  const item = dictData.find((d: any) =>
    (d.VALUE || d.value) === String(value)
  )

  return item ? (item.DISPLAY_NAME || item.displayName) : value
}

function getFkDisplayValue(column: any, value: any): string {
  if (!value) return ''

  const cacheKey = `${column.refTableId}_${value}_${column.refColumnId || ''}`
  if (fkDisplayCache.value[cacheKey]) {
    return fkDisplayCache.value[cacheKey]
  }

  // 异步加载显示值（使用全局缓存）
  loadFkDisplayValue(column, value, cacheKey)

  return String(value)
}

async function loadFkDisplayValue(column: any, value: any, cacheKey: string) {
  try {
    // 构造一个临时的 SysColumn 对象
    const tempColumn: Partial<SysColumn> = {
      REF_TABLE_ID: column.refTableId,
      REF_COLUMN_ID: column.refColumnId,
      SET_VALUE_TYPE: 'fk'
    }

    // 使用 useForeignKey 的 getDisplayValue，它有全局缓存
    const { getDisplayValue } = useForeignKey(tempColumn as SysColumn)
    const displayValue = await getDisplayValue(value)
    fkDisplayCache.value[cacheKey] = displayValue
  } catch (error) {
    console.error('加载外键显示值失败:', error)
  }
}

async function loadChildData() {
  loading.value = true
  try {
    const ref = props.childTable.ref

    // 找到子表中引用父表的外键字段
    // 方法1: 查找 refTableId 等于父表 ID 的字段
    let refColumn = props.childTable.columns.find((col: any) => {
      const refTableId = col.REF_TABLE_ID || col.refTableId
      return refTableId === props.parentTableId
    })

    // 方法2: 如果方法1没找到，使用 refColumnId
    if (!refColumn) {
      const refColumnId = ref.refColumnId || ref.REF_COLUMN_ID
      refColumn = props.childTable.columns.find((col: any) => {
        const colId = col.ID || col.id
        return colId === refColumnId
      })
    }

    if (!refColumn) {
      console.error('未找到外键字段')
      console.error('父表ID:', props.parentTableId)
      console.error('ref.refColumnId:', ref.refColumnId || ref.REF_COLUMN_ID)
      console.error('可用的列:', props.childTable.columns)
      Message.error('子表配置错误：未找到外键字段')
      return
    }

    const refColumnDbName = refColumn.DB_NAME || refColumn.dbName

    // 构建过滤条件：使用 filters 对象而不是 where 字符串
    const filters: Record<string, any> = {
      [refColumnDbName]: props.parentRecordId
    }

    // 如果有额外的过滤条件，解析并添加
    const filter = ref.filter || ref.FILTER || ''
    if (filter) {
      // 简单解析 filter 字符串（例如：IS_ACTIVE = 'Y'）
      // 注意：这是一个简化的实现，可能需要更复杂的解析逻辑
      const filterParts = filter.split('AND').map((part: string) => part.trim())
      filterParts.forEach((part: string) => {
        const match = part.match(/(\w+)\s*=\s*'?([^']+)'?/)
        if (match) {
          const [, fieldName, fieldValue] = match
          filters[fieldName.trim()] = fieldValue.trim().replace(/'/g, '')
        }
      })
    }

    const table = props.childTable.table
    const childTableName = table.NAME || table.name

    const response = await metadataApi.fetchRecords(childTableName, {
      filters,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    })

    tableData.value = response.list || []
    pagination.value.total = response.total || 0

    // 批量加载外键显示值
    await loadAllFkDisplayValues()
  } catch (error: any) {
    console.error('加载子表数据失败:', error)
    Message.error('加载子表数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

async function loadAllFkDisplayValues() {
  // 收集所有需要加载的外键值
  const fkLoadTasks: Promise<void>[] = []

  for (const record of tableData.value) {
    for (const column of fkColumns.value) {
      const value = record[column.dataIndex]
      const displayField = column.displayField

      // 如果后端已经返回了显示值，跳过
      if (record[displayField]) {
        continue
      }

      // 如果没有值，跳过
      if (!value) {
        continue
      }

      const cacheKey = `${column.refTableId}_${value}`

      // 如果已经缓存，跳过
      if (fkDisplayCache.value[cacheKey]) {
        continue
      }

      // 添加加载任务
      fkLoadTasks.push(loadFkDisplayValue(column, value, cacheKey))
    }
  }

  // 并行加载所有外键显示值
  await Promise.all(fkLoadTasks)
}

async function handleAdd() {
  dialogMode.value = 'create'
  currentRecordId.value = undefined
  formLoaded.value = false  // 重置加载状态
  dialogVisible.value = true
  // 等待对话框和表单组件挂载
  await nextTick()
}

async function handleView(record: any) {
  dialogMode.value = 'view'
  currentRecordId.value = record.ID || record.id
  formLoaded.value = false  // 重置加载状态
  dialogVisible.value = true
  // 等待对话框和表单组件挂载
  await nextTick()
}

async function handleEdit(record: any) {
  dialogMode.value = 'edit'
  currentRecordId.value = record.ID || record.id
  formLoaded.value = false  // 重置加载状态
  dialogVisible.value = true
  // 等待对话框和表单组件挂载
  await nextTick()
}

function handleBeforeOpen() {
  formLoaded.value = false
}

function handleFormLoaded(config: any) {
  formLoaded.value = true
}

async function handleDelete(record: any) {
  try {
    const table = props.childTable.table
    const childTableName = table.NAME || table.name
    const recordId = record.ID || record.id

    await metadataApi.deleteRecord(childTableName, recordId)
    Message.success('删除成功')
    await loadChildData()
  } catch (error: any) {
    Message.error('删除失败: ' + (error.message || '未知错误'))
  }
}

async function handleDialogOk() {
  if (dialogMode.value === 'view') {
    dialogVisible.value = false
    return
  }

  try {
    // 等待 DOM 更新，确保表单组件已挂载
    await nextTick()

    // 检查表单是否已加载完成
    if (!formLoaded.value) {
      Message.warning('表单正在加载中，请稍候...')
      console.warn('[ChildTablePanel] 表单尚未加载完成')
      return
    }

    // 检查表单引用是否存在
    if (!childFormRef.value) {
      Message.error('表单未加载完成，请稍后再试')
      console.error('[ChildTablePanel] childFormRef.value 是 null/undefined')
      return
    }


    // 验证表单
    const valid = await childFormRef.value.validate()
    if (!valid) {
      Message.warning('请检查表单填写')
      return
    }


    // 获取表单数据
    const formData = childFormRef.value.getFormData()

    // 检查 formData 是否有效
    if (!formData) {
      Message.error('获取表单数据失败')
      console.error('[ChildTablePanel] getFormData 返回 undefined')
      return
    }


    // 设置父记录关联
    // 找到子表中引用父表的外键字段（通过 REF_TABLE_ID 匹配父表 ID）
    const refColumn = props.childTable.columns.find((col: any) => {
      const refTableId = col.REF_TABLE_ID || col.refTableId
      return refTableId === props.parentTableId
    })

    if (refColumn) {
      const refColumnDbName = refColumn.DB_NAME || refColumn.dbName
      formData[refColumnDbName] = props.parentRecordId
    } else {
      console.error('[ChildTablePanel] ❌ 未找到外键字段！')
      console.error('[ChildTablePanel] parentTableId=', props.parentTableId)
      console.error('[ChildTablePanel] 可用的列:', props.childTable.columns.map((c: any) => ({
        dbName: c.DB_NAME || c.dbName,
        refTableId: c.REF_TABLE_ID || c.refTableId
      })))
      Message.error('配置错误：未找到关联字段')
      return
    }

    const table = props.childTable.table
    const childTableName = table.NAME || table.name

    // 确保 formData 包含所有必需字段

    if (dialogMode.value === 'create') {
      const result = await metadataApi.createRecord(childTableName, formData)
      Message.success('新增成功')
    } else if (dialogMode.value === 'edit') {
      const result = await metadataApi.updateRecord(childTableName, currentRecordId.value!, formData)
      Message.success('更新成功')
    }

    dialogVisible.value = false
    await loadChildData()
  } catch (error: any) {
    console.error('[ChildTablePanel] 操作失败:', error)
    Message.error('操作失败: ' + (error.message || '未知错误'))
  }
}

function handleDialogCancel() {
  dialogVisible.value = false
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

    // 删除选中的记录
    for (const key of selectedRowKeys.value) {
      await metadataApi.deleteRecord(childTableName, key as number)
    }

    Message.success(`成功删除 ${selectedRowKeys.value.length} 条记录`)

    // 清空选择
    selectedRowKeys.value = []

    // 重新加载数据
    await loadChildData()
  } catch (error: any) {
    console.error('[ChildTablePanel] 批量删除失败:', error)
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
 * 处理行选择
 */
function handleRowSelect(rowIndex: number, checked: boolean) {
  const record = tableData.value[rowIndex]
  const key = record.ID || record.id

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
    selectedRowKeys.value = tableData.value.map(record => record.ID || record.id)
  } else {
    selectedRowKeys.value = []
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadChildData()
})
</script>

<style scoped>
.child-table-panel {
  width: 100%;
}

.child-table-panel__toolbar {
  padding: 16px;
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

.child-table-panel__table {
  width: 100%;
}

.child-table-panel__table :deep(.arco-table) {
  font-size: 13px;
}

/* Checkbox 和序号合并显示 */
.child-table-panel__table :deep(.checkbox-with-index) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.child-table-panel__table :deep(.row-index) {
  color: #86909c;
  font-size: 12px;
}

.child-table-panel__table :deep(.header-text) {
  color: #1d2129;
  font-size: 14px;
  font-weight: 600;
}

.child-table-panel__table :deep(.arco-table-th) {
  background: #fafafa;
  font-weight: 600;
}

.child-table-panel__table :deep(.arco-btn-text) {
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
