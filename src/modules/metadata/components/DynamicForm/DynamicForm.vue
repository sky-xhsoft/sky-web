<!-- 动态表单组件 -->
<template>
  <a-spin :loading="loading" class="dynamic-form">
    <a-form
      ref="formRef"
      :model="formData"
      :label-col-props="labelColProps"
      :wrapper-col-props="wrapperColProps"
      :layout="layout"
      :auto-label-width="autoLabelWidth"
      class="dynamic-form__form"
      @submit="handleSubmit"
    >
      <!-- 基础字段组 -->
      <template v-if="basicFields.length > 0">
        <div class="dynamic-form__group">
          <div v-if="showGroupTitle" class="dynamic-form__group-header">
            <icon-folder />
            <span>基本信息</span>
          </div>
          <div class="dynamic-form__group-body">
            <a-row :gutter="rowGutter">
              <a-col
                v-for="column in basicFields"
                :key="column.ID"
                :span="getFieldColSpan(column)"
              >
                <DynamicFormItem
                  v-show="shouldShowField(column)"
                  :column="column"
                  :mode="mode"
                  :model-value="formData[column.DB_NAME]"
                  :error="errors[column.DB_NAME]"
                  :record="formData"
                  :form-columns="formColumnsCount"
                  @update:model-value="handleFieldChange(column.DB_NAME, $event)"
                  @blur="handleFieldBlur(column)"
                />
              </a-col>
            </a-row>
          </div>
        </div>
      </template>

      <!-- 折叠字段组 -->
      <template v-if="collapsibleGroups.length > 0">
        <a-collapse
          :default-active-key="defaultActiveGroups"
          class="dynamic-form__collapse"
        >
          <a-collapse-item
            v-for="(group, index) in collapsibleGroups"
            :key="index"
            :header="group.title"
          >
            <a-row :gutter="rowGutter">
              <a-col
                v-for="column in group.fields"
                :key="column.ID"
                :span="getFieldColSpan(column)"
              >
                <DynamicFormItem
                  v-show="shouldShowField(column)"
                  :column="column"
                  :mode="mode"
                  :model-value="formData[column.DB_NAME]"
                  :error="errors[column.DB_NAME]"
                  :record="formData"
                  :form-columns="formColumnsCount"
                  @update:model-value="handleFieldChange(column.DB_NAME, $event)"
                  @blur="handleFieldBlur(column)"
                />
              </a-col>
            </a-row>
          </a-collapse-item>
        </a-collapse>
      </template>

      <!-- 子表区域 -->
      <template v-if="childTables.length > 0">
        <div class="dynamic-form__group dynamic-form__group--child-tables">
          <div class="dynamic-form__group-header">
            <icon-unordered-list />
            <span>明细信息</span>
          </div>
          <div class="dynamic-form__group-body">
            <!-- 1:1 子表 -->
            <template v-for="(childTable, index) in oneToOneChildTables" :key="`one-to-one-${index}`">
              <OneToOneChildTable
                :child-table="oneToOneChildTableConfigs[childTable.table.ID] || childTable"
                :record="oneToOneChildTableRecords[childTable.table.ID]"
                :mode="mode"
                :row-gutter="rowGutter"
                @update:record="(record) => oneToOneChildTableRecords[childTable.table.ID] = record"
              />
            </template>

            <!-- 1:N 子表 -->
            <OneToManyChildTable
              v-if="oneToManyChildTables.length > 0"
              :child-tables="oneToManyChildTables"
              :mode="mode"
              :parent-table-id="tableId"
              :parent-record-id="recordId"
            />
          </div>
        </div>
      </template>

      <!-- 系统字段组 -->
      <template v-if="systemFields.length > 0 && showSystemFields">
        <div class="dynamic-form__group dynamic-form__group--system">
          <div class="dynamic-form__group-header">
            <icon-info-circle />
            <span>日志信息</span>
          </div>
          <div class="dynamic-form__group-body">
            <a-row :gutter="rowGutter">
              <a-col
                v-for="column in systemFields"
                :key="column.ID"
                :span="getFieldColSpan(column)"
              >
                <DynamicFormItem
                  :column="column"
                  :mode="mode"
                  :model-value="formData[column.DB_NAME]"
                  :error="errors[column.DB_NAME]"
                  @update:model-value="handleFieldChange(column.DB_NAME, $event)"
                  @blur="handleFieldBlur(column)"
                />
              </a-col>
            </a-row>
          </div>
        </div>
      </template>

      <!-- 隐藏的提交按钮（用于支持 Enter 键提交）-->
      <button v-show="false" type="submit" />
    </a-form>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconFolder, IconInfoCircle, IconUnorderedList } from '@arco-design/web-vue/es/icon'
import DynamicFormItem from './DynamicFormItem.vue'
import ChildTablePanel from './ChildTablePanel.vue'
import ChildTableInlinePanel from './ChildTableInlinePanel.vue'
import OneToOneChildTable from './OneToOneChildTable.vue'
import OneToManyChildTable from './OneToManyChildTable.vue'
import { useDynamicForm } from '../../composables'
import * as metadataApi from '../../api/metadata'
import type { FormMode, SysColumn } from '../../types'

// ==================== Props ====================

interface Props {
  tableId: number                // 表单ID
  recordId?: number              // 记录ID（编辑/查看模式）
  copyFrom?: number              // 复制来源记录ID（新增模式）
  mode?: FormMode                // 表单模式
  labelColSpan?: number          // 标签列宽度
  wrapperColSpan?: number        // 输入列宽度
  layout?: 'horizontal' | 'vertical' | 'inline'  // 布局方式
  rowGutter?: number             // 行间距
  showGroupTitle?: boolean       // 显示分组标题
  showSystemFields?: boolean     // 显示系统字段
  autoLabelWidth?: boolean       // 自动标签宽度
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view',
  labelColSpan: 6,
  wrapperColSpan: 18,
  layout: 'horizontal',
  rowGutter: 16,
  showGroupTitle: true,
  showSystemFields: true,
  autoLabelWidth: false
})

// ==================== Emits ====================

const emit = defineEmits<{
  submit: [data: Record<string, any>]
  change: [field: string, value: any]
  loaded: [config: any]
}>()

// ==================== 使用 Composable ====================

const {
  loading,
  tableConfig,
  formData,
  errors,
  formColumns,
  loadTableConfig,
  loadRecordData,
  validateField,
  validateForm,
  setFieldValue,
  getChangedFields,
  submitForm,
  submitFormWithDetails,
  shouldShowField,
  clearFieldError
} = useDynamicForm(props.tableId, props.mode)

// ==================== 引用 ====================

const formRef = ref()

// ==================== 计算属性 ====================

/**
 * 标签列配置
 */
const labelColProps = computed(() => ({
  span: props.labelColSpan
}))

/**
 * 输入列配置
 */
const wrapperColProps = computed(() => ({
  span: props.wrapperColSpan
}))

/**
 * 系统字段列表
 * 规则：orderno > 1000 的字段都归类为系统字段
 */
const systemFields = computed(() => {
  return formColumns.value.filter(c => {
    const orderno = c.ORDERNO || (c as any).orderno || 0
    return orderno > 1000
  })
})

/**
 * 基础字段（orderno <= 1000，非折叠字段）
 */
const basicFields = computed(() => {
  return formColumns.value.filter(c => {
    const orderno = c.ORDERNO || (c as any).orderno || 0
    return orderno <= 1000 && !isCollapsibleField(c)
  })
})

/**
 * 折叠字段组
 */
const collapsibleGroups = computed(() => {
  if (!tableConfig.value?.props?.groups) {
    return []
  }

  const groups = tableConfig.value.props.groups
  return groups.map((group: any) => ({
    title: group.title,
    fields: formColumns.value.filter(c =>
      group.fields?.includes(c.DB_NAME)
    )
  })).filter((g: any) => g.fields.length > 0)
})

/**
 * 默认展开的折叠组
 */
const defaultActiveGroups = computed(() => {
  return collapsibleGroups.value.map((_group: any, index: number) => index)
})

/**
 * 子表配置
 */
const childTables = computed(() => {
  return tableConfig.value?.childTables || []
})

/**
 * 1:1 子表列表
 */
const oneToOneChildTables = computed(() => {
  return childTables.value.filter(childTable => isOneToOneChildTable(childTable))
})

/**
 * 1:N 子表列表
 */
const oneToManyChildTables = computed(() => {
  return childTables.value.filter(childTable => !isOneToOneChildTable(childTable))
})

/**
 * 表单列数配置
 * 根据 SYS_OBJUICONF_ID 返回表单的列数（1-4）
 */
const formColumnsCount = computed(() => {
  const objUiConfId = tableConfig.value?.table?.SYS_OBJUICONF_ID ||
                      (tableConfig.value?.table as any)?.sysObjuiconfId ||
                      2 // 默认2列

  // 1: 1列, 2: 2列, 3: 3列, 4: 4列
  return objUiConfId
})

/**
 * 子表引用（用于内嵌编辑组件）
 */
const childTableRefs = ref<Record<number, any>>({})

/**
 * 1:1 子表记录 ID 映射（key: 子表 ID, value: 子表记录 ID）
 */
const oneToOneChildTableRecordIds = ref<Record<number, number | undefined>>({})

/**
 * 1:1 子表记录数据映射（key: 子表 ID, value: 子表记录数据）
 */
const oneToOneChildTableRecords = ref<Record<number, any>>({})
// 存储1:1子表原始数据，用于对比变更
const oneToOneChildTableOriginalRecords = ref<Record<number, any>>({})

/**
 * 1:1 子表原始记录数据映射（用于比较变化）
 */
const originalOneToOneChildTableRecords = ref<Record<number, any>>({})

/**
 * 1:1 子表字段配置映射（key: 子表 ID, value: 子表字段配置）
 */
const oneToOneChildTableConfigs = ref<Record<number, any>>({})

// ==================== 方法 ====================

/**
 * 判断是否为 1:1 子表
 * 通过表关系类型 ASSOCTYPE 字段判断
 * ASSOCTYPE 值为 '1' 表示 1:1 关联，'n' 表示 1:n 关联
 */
function isOneToOneChildTable(childTable: any): boolean {
  const assoType = childTable.ref.assoType || childTable.ref.ASSOCTYPE
  return assoType === '1' || assoType === '1:1'
}

/**
 * 获取 1:1 子表的字段配置
 */
async function getOneToOneChildTableConfig(childTableId: number): Promise<any> {
  try {
    const config = await metadataApi.fetchTableConfig(childTableId)
    return config
  } catch (error) {
    console.error('获取子表配置失败:', error)
    return undefined
  }
}

/**
 * 获取 1:1 子表的记录
 */
async function getOneToOneChildTableRecord(childTable: any): Promise<any | undefined> {
  // 如果是新增模式，还没有主表记录，返回 undefined
  if (props.mode === 'create') {
    return undefined
  }

  // 如果没有主表记录 ID，返回 undefined
  if (!props.recordId) {
    return undefined
  }

  try {
    // 找到子表中引用父表的外键字段
    // 方法1: 查找 REF_TABLE_ID 等于父表 ID 的字段
    let refColumn = childTable.columns.find((col: any) => {
      const refTableId = col.REF_TABLE_ID || col.refTableId
      return refTableId === props.tableId
    })

    // 方法2: 如果方法1没找到，使用 refColumnId
    if (!refColumn) {
      const refColumnId = childTable.ref.refColumnId || childTable.ref.REF_COLUMN_ID
      refColumn = childTable.columns.find((col: any) => {
        const colId = col.ID || col.id
        return colId === refColumnId
      })
    }

    if (!refColumn) {
      console.error('未找到外键字段')
      console.error('父表ID:', props.tableId)
      console.error('ref.refColumnId:', childTable.ref.refColumnId || childTable.ref.REF_COLUMN_ID)
      console.error('可用的列:', childTable.columns)
      return undefined
    }

    const refColumnDbName = refColumn.DB_NAME || refColumn.dbName

    // 构建过滤条件
    const filters: Record<string, any> = {
      [refColumnDbName]: props.recordId
    }

    // 如果有额外的过滤条件，解析并添加
    const filter = childTable.ref.filter || childTable.ref.FILTER || ''
    if (filter) {
      const filterParts = filter.split('AND').map((part: string) => part.trim())
      filterParts.forEach((part: string) => {
        const match = part.match(/(\w+)\s*=\s*'?([^']+)'?/)
        if (match) {
          const [, fieldName, fieldValue] = match as [string, string, string]
          const key = fieldName.trim()
          const value = fieldValue.trim().replace(/'/g, '')
          ;(filters as Record<string, any>)[key] = value
        }
      })
    }

    const table = childTable.table
    const childTableName = table.NAME || table.name

    // 调用 API 查找子表记录
    const response = await metadataApi.fetchRecords(childTableName, {
      filters,
      page: 1,
      pageSize: 1
    })

    // 返回第一条记录
    if (response.list && response.list.length > 0) {
      return response.list[0]
    }

    return undefined
  } catch (error: any) {
    console.error('获取 1:1 子表记录失败:', error)
    return undefined
  }
}

/**
 * 子表请求刷新整个表单
 */
async function handleChildTableRefresh() {
  if (props.recordId) {
    await loadRecordData(props.recordId)
    Message.success('刷新成功')
  }
}

/**
 * 判断是否为折叠字段
 */
function isCollapsibleField(column: SysColumn): boolean {
  if (!tableConfig.value?.props?.groups) {
    return false
  }

  const groups = tableConfig.value.props.groups
  return groups.some((group: any) =>
    group.fields?.includes(column.DB_NAME)
  )
}

/**
 * 获取字段列跨度
 */
function getFieldColSpan(column: SysColumn): number {
  // 优先使用字段配置的 DISPLAY_COLS
  const displayCols = column.DISPLAY_COLS || (column as any).displayCols
  if (displayCols && displayCols > 1) {
    // DISPLAY_COLS 表示字段要占据的列数（基于表单的列数配置）
    // 例如：如果表单是 2 列布局（每列 12），DISPLAY_COLS=2 表示占满整行（24）
    const objUiConfId = tableConfig.value?.table?.SYS_OBJUICONF_ID ||
                        (tableConfig.value?.table as any)?.sysObjuiconfId ||
                        2 // 默认2列

    let colWidth = 12 // 默认每列宽度
    switch (objUiConfId) {
      case 1:
        colWidth = 24 // 1列布局
        break
      case 2:
        colWidth = 12 // 2列布局
        break
      case 3:
        colWidth = 8  // 3列布局
        break
      case 4:
        colWidth = 6  // 4列布局
        break
    }

    return Math.min(displayCols * colWidth, 24)
  }

  // 其次使用 FORM_COLSPAN
  if (column.FORM_COLSPAN) {
    return column.FORM_COLSPAN
  }

  // 根据表的 SYS_OBJUICONF_ID 配置计算默认列数
  // 1: 1列(24), 2: 2列(12), 3: 3列(8), 4: 4列(6)
  const objUiConfId = tableConfig.value?.table?.SYS_OBJUICONF_ID ||
                      (tableConfig.value?.table as any)?.sysObjuiconfId ||
                      2 // 默认2列

  let defaultSpan = 12 // 默认2列
  switch (objUiConfId) {
    case 1:
      defaultSpan = 24 // 1列
      break
    case 2:
      defaultSpan = 12 // 2列
      break
    case 3:
      defaultSpan = 8  // 3列
      break
    case 4:
      defaultSpan = 6  // 4列
      break
  }

  // 获取控件类型（优先 DISPLAY_TYPE）
  const displayType = column.DISPLAY_TYPE || (column as any).displayType
  const controlType = (displayType || column.CONTROL_TYPE || (column as any).controlType)?.toLowerCase()

  // 根据控件类型调整（某些控件强制占满一行）
  const fullWidthControls = ['textarea', 'json', 'richtext', 'clob', 'xml']
  if (fullWidthControls.includes(controlType)) {
    return 24  // 多行文本控件占满一行
  }

  if (controlType === 'checkbox' || controlType === 'radio') {
    return Math.min(defaultSpan, 8) // 复选框/单选框最多占1/3行
  }

  return defaultSpan
}

/**
 * 字段值变化处理
 */
function handleFieldChange(fieldName: string, value: any) {
  setFieldValue(fieldName, value)
  emit('change', fieldName, value)
}

/**
 * 字段失焦处理
 */
function handleFieldBlur(column: SysColumn) {
  // 失焦时验证字段
  const value = formData.value[column.DB_NAME]
  const error = validateField(column, value)

  if (error) {
    errors.value[column.DB_NAME] = error
  } else {
    clearFieldError(column.DB_NAME)
  }
}

/**
 * 表单提交处理
 */
async function handleSubmit(e: Event) {
  console.log('DynamicForm handleSubmit called', e)
  e.preventDefault()

  try {
    console.log('handleSubmit try block start')
    // 只要有子表配置，就使用同时保存接口，确保子表变更能被保存
    const hasChildTables = childTables.value.length > 0
    console.log('hasChildTables in DynamicForm:', hasChildTables)

    if (hasChildTables) {
      // 收集所有子表数据
      const details = []
      console.log('开始收集子表数据，oneToOneChildTables:', oneToOneChildTables.value, 'oneToManyChildTables:', oneToManyChildTables.value)

      // 收集1:1子表数据
      for (const childTable of oneToOneChildTables.value) {
        console.log('处理1:1子表:', childTable.table.NAME)
        let record = oneToOneChildTableRecords.value[childTable.table.ID]
        const originalRecord = originalOneToOneChildTableRecords.value[childTable.table.ID]

        console.log('子表原始记录:', originalRecord, '当前记录:', record)

        // 对比原始数据，只保留变更的字段
        let changedRecord: Record<string, any> = {}
        if (props.mode === 'edit' && originalRecord && record) {
          // 编辑模式：只收集变更的字段
          for (const key in record) {
            if (record[key] !== originalRecord[key]) {
              changedRecord[key] = record[key]
            }
          }
          // 保留ID字段，用于更新
          if (record.ID || record.id) {
            changedRecord.ID = record.ID || record.id
          }
        } else {
          // 新增模式：传递所有字段，如果没有记录则创建空记录
          changedRecord = record || {}
        }

        // 找到子表的关联字段
        let refField = ''
        const refColumn = childTable.columns.find((col: any) => {
          const refTableId = col.REF_TABLE_ID || col.refTableId
          return refTableId === props.tableId
        })
        if (refColumn) {
          refField = refColumn.DB_NAME || refColumn.dbName
        } else {
          // 如果没找到，使用ref中的配置
          refField = childTable.ref.refColumn || childTable.ref.REF_COLUMN || 'SYS_COMPANY_ID'
        }

        // 新增模式下即使子表没有数据也新增一条关联记录，编辑模式下只有变更才提交
        if (Object.keys(changedRecord).length > 0 || props.mode === 'create') {
          details.push({
            tableName: childTable.table.NAME || childTable.table.name,
            records: [changedRecord],
            assoType: '1',
            refField
          })
        }
      }

      // 收集1:n子表数据
      for (const childTable of oneToManyChildTables.value) {
        const index = childTables.value.indexOf(childTable)
        const childTableRef = childTableRefs.value[index]
        if (childTableRef && typeof childTableRef.getData === 'function') {
          const records = childTableRef.getData()
          if (records.length > 0) {
            // 找到子表的关联字段
            let refField = ''
            const refColumn = childTable.columns.find((col: any) => {
              const refTableId = col.REF_TABLE_ID || col.refTableId
              return refTableId === props.tableId
            })
            if (refColumn) {
              refField = refColumn.DB_NAME || refColumn.dbName
            } else {
              // 如果没找到，使用ref中的配置
              refField = childTable.ref.refColumn || childTable.ref.REF_COLUMN || 'parent_id'
            }

            details.push({
              tableName: childTable.table.NAME || childTable.table.name,
              records,
              assoType: 'n',
              refField
            })
          }
        }
      }

      console.log('收集到的details:', details)
      // 调用同时保存接口
      console.log('准备调用submitFormWithDetails')
      const result = await submitFormWithDetails(details)
      console.log('submitFormWithDetails返回结果:', result)
      if (result) {
        emit('submit', result.mainRecord)
      }
    } else {
      // 没有子表，使用原来的保存逻辑
      const result = await submitForm()
      if (result) {
        emit('submit', result)
      }
    }
  } catch (error: any) {
    console.error('handleSubmit error:', error)
    // 错误已在 composable 中处理
  }
}

/**
 * 手动触发验证
 */
async function validate(): Promise<boolean> {
  return validateForm()
}

/**
 * 获取表单数据
 */
function getFormData() {
  const mainData = { ...formData.value }

  // 如果有子表数据，也一并返回
  const childTablesData: Record<string, any[]> = {}
  Object.keys(childTableRefs.value).forEach(index => {
    const childTableRef = childTableRefs.value[Number(index)]
    if (childTableRef && typeof childTableRef.getData === 'function') {
      const childTable = childTables.value[Number(index)]
      const tableName = childTable.table.NAME || childTable.table.name
      childTablesData[tableName] = childTableRef.getData()
    }
  })

  // 如果有子表数据，添加到返回对象中
  if (Object.keys(childTablesData).length > 0) {
    return {
      ...mainData,
      __childTables: childTablesData
    }
  }

  return mainData
}

/**
 * 设置表单数据
 */
function setFormData(data: Record<string, any>) {
  Object.assign(formData.value, data)
}

/**
 * 重置表单
 */
function reset() {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  // 加载表单配置
  await loadTableConfig()

  // 如果有 recordId，加载数据（编辑/查看模式）
  if (props.recordId) {
    await loadRecordData(props.recordId)
  }
  // 如果有 copyFrom，加载源记录数据用于复制（新增模式）
  else if (props.copyFrom && props.mode === 'create') {
    await loadRecordData(props.copyFrom)
    // 清除系统字段，让它们重新生成
    const systemFieldsToClear = ['ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME']
    systemFieldsToClear.forEach(field => {
      delete formData.value[field]
    })
  }

  // 加载 1:1 子表的配置和记录数据
  if (tableConfig.value?.childTables) {
    for (const childTable of tableConfig.value.childTables) {
      if (isOneToOneChildTable(childTable)) {
        // 获取子表的完整配置
        const childTableConfig = await getOneToOneChildTableConfig(childTable.table.ID)
        if (childTableConfig) {
          oneToOneChildTableConfigs.value[childTable.table.ID] = childTableConfig
        }

        // 获取子表记录数据
        const record = await getOneToOneChildTableRecord(childTable)
        if (record) {
          oneToOneChildTableRecords.value[childTable.table.ID] = record
          // 保存原始数据用于比较变化
          originalOneToOneChildTableRecords.value[childTable.table.ID] = JSON.parse(JSON.stringify(record))
          const recordId = record.ID || record.id
          if (recordId) {
            oneToOneChildTableRecordIds.value[childTable.table.ID] = recordId
          }
        }
      }
    }
  }

  // 触发 loaded 事件
  if (tableConfig.value) {
    emit('loaded', tableConfig.value)
  }
})

// 监听 recordId 变化
watch(
  () => props.recordId,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await loadRecordData(newId)
    }
  }
)

// 监听 mode 变化（查看 -> 编辑切换）
watch(
  () => props.mode,
  async (newMode, oldMode) => {
    if (newMode && oldMode && newMode !== oldMode) {
      // 如果有 recordId，重新加载数据以确保字段正确填充
      if (props.recordId) {
        await loadRecordData(props.recordId)
      }
    }
  }
)

// 监听 copyFrom 变化
watch(
  () => props.copyFrom,
  async (newCopyFrom) => {
    if (newCopyFrom && props.mode === 'create') {
      await loadRecordData(newCopyFrom)
      // 清除系统字段
      const systemFieldsToClear = ['ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME']
      systemFieldsToClear.forEach(field => {
        delete formData.value[field]
      })
    }
  }
)

// ==================== 暴露方法 ====================

/**
 * 获取子表数据
 */
function getChildTablesData(): Record<string, any[]> {
  const childTablesData: Record<string, any[]> = {}

  Object.keys(childTableRefs.value).forEach(index => {
    const childTableRef = childTableRefs.value[Number(index)]
    if (childTableRef && typeof childTableRef.getData === 'function') {
      const childTable = childTables.value[Number(index)]
      const tableName = childTable.table.NAME || childTable.table.name
      const data = childTableRef.getData()

      if (data && data.length > 0) {
        childTablesData[tableName] = data
      }
    }
  })

  return childTablesData
}

/**
 * 验证子表数据
 */
function validateChildTables(): { valid: boolean; errors: string[] } {
  const allErrors: string[] = []

  Object.keys(childTableRefs.value).forEach(index => {
    const childTableRef = childTableRefs.value[Number(index)]
    if (childTableRef && typeof childTableRef.validate === 'function') {
      const childTable = childTables.value[Number(index)]
      const tableName = childTable.table.DISPLAY_NAME || childTable.table.displayName
      const result = childTableRef.validate()

      if (!result.valid) {
        result.errors.forEach((err: string) => {
          allErrors.push(`${tableName}: ${err}`)
        })
      }
    }
  })

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  }
}

defineExpose({
  validate,
  getFormData,
  getChangedFields,  // 获取变更的字段
  getChildTablesData,  // 获取子表数据
  validateChildTables,  // 验证子表数据
  setFormData,
  reset,
  loadData: loadRecordData,  // 暴露加载数据方法
  submit: handleSubmit, // 暴露提交方法
  formRef
})
</script>

<style scoped>
.dynamic-form {
  width: 100%;
  display: block;
}

.dynamic-form__form {
  width: 100%;
  display: block;
}

.dynamic-form__group {
  width: 100% !important;
  display: block;
  margin-bottom: 24px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}

.dynamic-form__group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-1);
}

.dynamic-form__group-header .arco-icon {
  font-size: 16px;
  color: var(--color-text-3);
}

.dynamic-form__group-body {
  width: 100% !important;
  display: block;
  padding: 16px;
}

.dynamic-form__group-body :deep(.arco-row) {
  width: 100% !important;
  display: flex;
  flex-wrap: wrap;
}

.dynamic-form__group-body :deep(.arco-col) {
  box-sizing: border-box;
}

.dynamic-form__group--child-tables {
  border-color: #3370ff;
}

.dynamic-form__group--child-tables .dynamic-form__group-header {
  background: #f2f5ff;
  border-bottom-color: #3370ff;
}

.dynamic-form__group--child-tables .dynamic-form__group-body {
  padding: 0;
}

/* 1:1 子表样式 */
.dynamic-form__one-to-one-child-table {
  margin-bottom: 24px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;

  &__header {
    padding: 12px 16px;
    background: #f5f5f5;
    border-bottom: 1px solid #e8e8e8;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  &__body {
    padding: 16px;
  }

  &__fields {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  &__field {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 200px;
    flex: 1;
  }

  &__field-label {
    font-weight: 600;
    color: #333;
    white-space: nowrap;
    flex: 0 0 auto;
  }

  &__field-value {
    flex: 1;
    min-width: 100px;
  }

  :deep(.dynamic-form) {
    padding: 0;
  }

  :deep(.dynamic-form__form) {
    padding: 0;
  }

  :deep(.dynamic-form__group) {
    margin-bottom: 0;
  }

  :deep(.dynamic-form__group-header) {
    background: #f5f5f5;
    border-bottom: 1px solid #e8e8e8;
  }

  :deep(.dynamic-form__group-body) {
    padding: 16px;
  }

  :deep(.dynamic-form-item) {
    margin-bottom: 0;
  }

  :deep(.arco-form-item-label) {
    font-weight: 600;
    color: #333;
  }

  :deep(.arco-form-item-content) {
    min-height: 32px;
  }
}

.dynamic-form__group--system {
  background: #fafafa;
  border-color: #d9d9d9;
}

.dynamic-form__group--system .dynamic-form__group-header {
  background: #f0f0f0;
}

.dynamic-form__collapse {
  width: 100%;
  margin-bottom: 24px;
}

.dynamic-form__collapse :deep(.arco-collapse-item) {
  width: 100%;
}

.dynamic-form__collapse :deep(.arco-collapse-item-header) {
  padding: 12px 16px;
  background: #fafafa;
  font-weight: 600;
}

.dynamic-form__collapse :deep(.arco-collapse-item-content) {
  padding: 16px;
}

.dynamic-form__collapse :deep(.arco-row) {
  width: 100%;
}

/* 表单项间距 */
.dynamic-form__form :deep(.arco-form-item) {
  margin-bottom: 16px;
}

/* 最后一个表单项去掉底部边距 */
.dynamic-form__form :deep(.arco-row:last-child .arco-form-item) {
  margin-bottom: 0;
}

/* 表单标签样式 */
.dynamic-form__form :deep(.arco-form-item-label) {
  font-weight: 500;
  color: var(--color-text-2);
}

/* 必填标记样式 */
.dynamic-form__form :deep(.arco-form-item-label-required-symbol) {
  color: #f5222d;
  margin-right: 4px;
}

/* 错误提示样式 */
.dynamic-form__form :deep(.arco-form-item-message) {
  font-size: 12px;
  line-height: 1.5;
  color: #f5222d;
}

/* 只读字段样式 */
.dynamic-form__form :deep(.arco-input[readonly]),
.dynamic-form__form :deep(.arco-textarea[readonly]) {
  background: #f5f5f5;
  color: var(--color-text-2);
  cursor: not-allowed;
}

/* 禁用字段样式 */
.dynamic-form__form :deep(.arco-input[disabled]),
.dynamic-form__form :deep(.arco-textarea[disabled]),
.dynamic-form__form :deep(.arco-select[disabled]),
.dynamic-form__form :deep(.arco-input-number[disabled]) {
  background: #f5f5f5;
  color: var(--color-text-3);
  cursor: not-allowed;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .dynamic-form__group-body {
    padding: 12px;
  }

  .dynamic-form__form :deep(.arco-col) {
    /* 移动端所有字段占满一行 */
    flex: 0 0 100%;
    max-width: 100%;
  }

  .dynamic-form__form :deep(.arco-form-item) {
    margin-bottom: 12px;
  }
}
</style>
