<!-- 元数据表单视图 -->
<template>
  <div class="metadata-form-view">
    <!-- 页头 (对齐 table-form 原型 page-header) -->
    <V2PageHeader
      :title="headerTitle"
      :description="`${tableConfig?.table?.DISPLAY_NAME || ''} — ${modeName}`"
      class="metadata-form-view__header"
    >
      <template #actions>
              <!-- 主操作：编辑/保存 / 返回 -->
              <V2Button v-if="mode === 'view' && canEdit" type="primary" @click="handleEdit">
                <template #icon><icon-edit /></template>
                编辑
              </V2Button>
              <V2Button v-if="mode === 'edit' || mode === 'create'" type="primary" :loading="saving" @click="handleSave">
                <template #icon><icon-save /></template>
                保存
              </V2Button>

              <!-- 更多...下拉：聚合次要操作 (对齐门户 保存/更多/关闭) -->
              <a-dropdown v-if="showMoreActions" trigger="click" position="br">
                <V2Button type="secondary">
                  <template #icon><icon-more /></template>
                  更多...
                </V2Button>
                <template #content>
                  <a-doption v-if="mode === 'view' && canCreate" @click="handleCopy">
                    <icon-copy /> 复制
                  </a-doption>
                  <a-doption v-if="mode !== 'create' && canPrint" @click="handlePrint">
                    <icon-printer /> 打印
                  </a-doption>
                  <a-doption v-if="mode !== 'create'" @click="handleRefresh">
                    <icon-refresh /> 刷新
                  </a-doption>
                </template>
              </a-dropdown>

              <!-- 返回 -->
              <V2Button type="secondary" @click.stop="handleBack">
                <template #icon><icon-close /></template>
                返回
              </V2Button>
            </template>
    </V2PageHeader>

    <!-- 主内容区 -->
        <main class="metadata-form-view__main">
          <a-spin :loading="loading" class="form-spin">
                      <a-card :bordered="false" class="form-card">
                        <!-- 标准新增/修改页：主表数据 + 子表(明细)Tab + 操作日志 (对齐门户销售价调整单编辑页) -->
                        <a-tabs v-model:active-key="activeFormTab" class="form-main-tabs">
                <!-- Tab 1: 主表数据 -->
                <a-tab-pane key="master" title="主表数据">
                  <DynamicForm
                    ref="formRef"
                    :table-id="Number(tableId)"
                    :record-id="recordId ? Number(recordId) : undefined"
                    :copy-from="copyFrom ? Number(copyFrom) : undefined"
                    :mode="mode"
                    :label-col-span="6"
                    :wrapper-col-span="18"
                    :show-system-fields="showSystemFields"
                    :hide-inline-child-tables="true"
                    @submit="handleFormSubmit"
                    @change="handleFormChange"
                    @loaded="handleFormLoaded"
                  />
                </a-tab-pane>

                <!-- 子表 Tab: 1:1 子表 每个一个 -->
                <a-tab-pane
                  v-for="childTable in oneToOneChildTables"
                  :key="`one-to-one-${childTableKey(childTable)}`"
                  :title="childTableTitle(childTable)"
                >
                  <OneToOneChildTable
                    :child-table="childTable"
                    :record="oneToOneChildTableRecords[childTableKey(childTable)]"
                    :mode="mode"
                    :row-gutter="16"
                    @update:record="(record) => (oneToOneChildTableRecords[childTableKey(childTable)] = record)"
                  />
                </a-tab-pane>

                <!-- 子表 Tab: 1:N 子表 -->
                <a-tab-pane
                  v-for="childTable in oneToManyChildTables"
                  :key="`one-to-many-${childTableKey(childTable)}`"
                  :title="childTableTitle(childTable)"
                >
                  <OneToManyChildTable
                    :child-tables="[childTable]"
                    :mode="mode"
                    :parent-table-id="Number(tableId)"
                    :parent-record-id="recordId ? Number(recordId) : undefined"
                  />
                </a-tab-pane>

                <!-- 子表 Tab: props.detailTables 驱动的明细 -->
                <a-tab-pane
                  v-for="detailTable in detailTables"
                  :key="String(detailTable.id)"
                  :title="detailTable.title"
                >
                  <DynamicTable
                    :table-id="detailTable.id"
                    :filters="{ parentId: recordId }"
                    :page-size="10"
                    :show-toolbar="mode !== 'view'"
                    @create="handleDetailCreate(detailTable)"
                    @edit="handleDetailEdit(detailTable, $event)"
                    @delete="handleDetailDelete(detailTable, $event)"
                  />
                </a-tab-pane>

                <!-- 操作日志 Tab -->
                <a-tab-pane key="log" title="操作日志">
                  <RecordLogPanel
                    v-if="!isCreate"
                    :record="loadedRecord"
                    :table-display-name="tableConfig?.table?.DISPLAY_NAME || ''"
                  />
                  <a-empty v-else description="新增记录暂无可查看的日志" />
                </a-tab-pane>
              </a-tabs>
            </a-card>
          </a-spin>
        </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconCopy,
  IconPrinter,
  IconRefresh,
  IconEdit,
  IconSave,
  IconClose,
  IconMore
} from '@arco-design/web-vue/es/icon'
import { DynamicForm } from '../components/DynamicForm'
import { DynamicTable } from '../components/DynamicTable'
import OneToOneChildTable from '../components/DynamicForm/OneToOneChildTable.vue'
import OneToManyChildTable from '../components/DynamicForm/OneToManyChildTable.vue'
import RecordLogPanel from '../components/RecordLogPanel.vue'
import { V2PageHeader, V2Button } from '@/components/ui'
import { useMetadataStore } from '../stores/useMetadataStore'
import { useDynamicFormStore } from '../stores/useDynamicFormStore'
import { useDynamicTableStore } from '../stores/useDynamicTableStore'
import type { FormMode, TableConfig } from '../types'
import { useNavigationStore } from '@/stores/navigation'
import * as metadataApi from '../api/metadata'

// ==================== Props ====================

interface Props {
  tableId?: number
  recordId?: number
  mode?: FormMode
  copyFrom?: number  // 复制来源记录ID
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
})

// ==================== Router ====================

const route = useRoute()
const router = useRouter()

// ==================== Store ====================

const metadataStore = useMetadataStore()
const formStore = useDynamicFormStore()
const tableStore = useDynamicTableStore()
const navigationStore = useNavigationStore()

// ==================== 状态 ====================

const formRef = ref()
const loading = ref(false)
const saving = ref(false)

// 优先使用 props，如果没有则从路由获取（兼容旧的路由模式）
const tableId = computed(() => props.tableId ? String(props.tableId) : route.params.tableId as string)
const recordId = computed(() => props.recordId ? String(props.recordId) : route.params.id as string | undefined)
const copyFrom = computed(() => {
  if (props.copyFrom) return String(props.copyFrom)
  if (route.query.copyFrom) return route.query.copyFrom as string
  return undefined
})
const mode = computed<FormMode>(() => {
  if (props.mode) return props.mode
  if (recordId.value) {
    return route.name === 'MetadataFormView' ? 'view' : 'edit'
  }
  return 'create'
})

const tableConfig = ref<TableConfig | null>(null)
const activeFormTab = ref<string>('master')
const loadedRecord = ref<any>(null)
const hasChanges = ref(false)

// 上一条/下一条导航
const hasPrevious = ref(false)
const hasNext = ref(false)
const recordList = ref<any[]>([])
const currentIndex = ref(-1)

// ==================== 计算属性 ====================

/**
 * 模式名称
 */
const modeName = computed(() => {
  const names: Record<FormMode, string> = {
    create: '新增',
    edit: '编辑',
    view: '查看'
  }
  return names[mode.value]
})

/** 页头标题 (对齐 table-form 原型 form-title) */
const headerTitle = computed(() => {
  const tableName = (tableConfig.value?.table as any)?.DISPLAY_NAME || (tableConfig.value?.table as any)?.displayName || '数据表'
  return `${modeName.value}${tableName}`
})

/** 是否为新增模式 */
const isCreate = computed(() => mode.value === 'create')

/** 是否显示「更多...」下拉（存在任一可收拢的次要操作时） */
const showMoreActions = computed(() => (
  (mode.value === 'view' && canCreate.value) || // 复制
  (mode.value !== 'create' && canPrint.value) || // 打印
  mode.value !== 'create' // 刷新
))

/**
 * 权限控制
 */
const mask = computed(() => {
  if (!tableConfig.value?.table) return ''
  return (tableConfig.value.table as any).MASK || (tableConfig.value.table as any).mask || ''
})

// 按钮权限
const canCreate = computed(() => mask.value.includes('A'))     // Add - 新增
const canEdit = computed(() => mask.value.includes('M'))       // Modify - 修改
const canPrint = computed(() => mask.value.includes('P'))      // Print - 打印

/**
 * 是否显示系统字段
 * 根据表配置的 props.hideSystemFields 来决定
 * 默认显示系统字段（true）
 */
const showSystemFields = computed(() => {
  if (!tableConfig.value?.props) return true
  // 如果配置了 hideSystemFields 为 true，则不显示系统字段
  return !(tableConfig.value.props as any).hideSystemFields
})

/**
 * 子表配置
 */
const detailTables = computed(() => {
  if (!tableConfig.value?.props?.detailTables) return []
  return tableConfig.value.props.detailTables as Array<{
    id: number
    title: string
  }>})

/** 子表（1:1 / 1:N），来源 tableConfig.childTables */
const childTables = computed(() => tableConfig.value?.childTables || [])

/** 是否为 1:1 子表（与 DynamicForm 内部判定保持一致） */
function isOneToOneChildTable(childTable: any): boolean {
  const ref = childTable?.ref || {}
  const assoType = ref.assoType ?? ref.ASSOCTYPE
  // 兼容 linkType/relationType 遗留字段
  const linkType = ref.linkType ?? ref.LINK_TYPE
  const relType = ref.relationType ?? ref.RELATION_TYPE
  return (
    String(assoType) === '1' ||
    String(linkType) === '1' ||
    String(relType) === '1' ||
    String(childTable?.relationType) === '1' ||
    String(childTable?.linkType) === '1'
  )
}

const oneToOneChildTables = computed(() => childTables.value.filter((c: any) => isOneToOneChildTable(c)))
const oneToManyChildTables = computed(() => childTables.value.filter((c: any) => !isOneToOneChildTable(c)))

/** 子表稳定 key */
function childTableKey(childTable: any): string | number {
  return childTable?.table?.ID ?? childTable?.table?.id ?? childTable?.id ?? Math.random()
}

/** 子表标题 */
function childTableTitle(childTable: any): string {
  return childTable?.ref?.displayName ||
         childTable?.ref?.DISPLAY_NAME ||
         childTable?.table?.DISPLAY_NAME ||
         childTable?.table?.displayName ||
         '明细信息'
}

/** 1:1 子表记录映射（key: childTableKey） */
const oneToOneChildTableRecords = ref<Record<string | number, any>>({})

// ==================== 方法 ====================

/**
 * 加载表单配置
 */
async function loadConfig() {
  loading.value = true
  try {
    tableConfig.value = await metadataStore.loadTableConfig(Number(tableId.value))
  } catch (error: any) {
    Message.error(error.message || '加载配置失败')
  } finally {
    loading.value = false
  }
}

/**
 * 表单加载完成
 */
function handleFormLoaded(_config: TableConfig) {
  // 记录当前已加载的数据，供「操作日志」Tab 使用
  try {
    if (formRef.value?.getFormData) {
      loadedRecord.value = formRef.value.getFormData()
    }
  } catch (e) {
    console.warn('读取表单数据失败', e)
  }
  // 加载 1:1 子表关联记录（如「公司配置」）
  if (mode.value !== 'create' && recordId.value && oneToOneChildTables.value.length > 0) {
    loadOneToOneRecords()
  }
  // 加载记录列表用于上一条/下一条导航
  if (mode.value !== 'create') {
    loadRecordList()
  }
}

/**
 * 加载所有 1:1 子表的关联记录（外键 = 当前主表记录 ID）
 * 例如「公司(4) → 公司配置(55)」：子表 SYS_COMPANY_ID = 主表记录 ID
 */
async function loadOneToOneRecords() {
  if (!recordId.value) return
  const childList = oneToOneChildTables.value
  if (!childList || childList.length === 0) return

  const mainId = Number(recordId.value)
  for (const childTable of childList) {
    try {
      const ref = childTable.ref || {}
      const refColumnId = Number(ref.refColumnId ?? ref.REF_COLUMN_ID)
      // 找到 refColumnId 对应的子表列名（如 SYS_COMPANY_ID）
      const fkCol = ((childTable.columns as any[]) || []).find(
        (c: any) => Number(c.id ?? c.ID) === refColumnId
      )
      const fkName = fkCol?.dbName ?? fkCol?.DB_NAME
      if (!fkName) continue
      const tableName = childTable.table?.NAME || childTable.table?.name
      if (!tableName) continue

      const result = await tableStore.loadRecords(tableName, {
              filters: { [fkName]: mainId },
              page: 1,
              pageSize: 1
            } as any)
      const recs = result?.list ?? tableStore.records
      const rec = Array.isArray(recs) && recs.length ? recs[0] : null
      oneToOneChildTableRecords.value[childTableKey(childTable)] = rec || undefined
    } catch (e) {
      console.warn('加载 1:1 子表记录失败', childTable.ref?.displayName, e)
    }
  }
}

/**
 * 表单值变化
 */
function handleFormChange() {
  hasChanges.value = true
}

/**
 * 保存
 */
async function handleSave() {
  console.log('handleSave called', formRef.value)
  if (!formRef.value) {
    console.log('formRef.value is null')
    return
  }

  try {
    console.log('开始验证表单')
    // 验证表单
    const valid = await formRef.value.validate()
    console.log('验证结果:', valid)
    if (!valid) {
      Message.warning('请检查表单填写')
      return
    }

    const hasChildTables = tableConfig.value?.childTables && tableConfig.value.childTables.length > 0

    saving.value = true

    // 如果有子表，使用DynamicForm的提交逻辑（支持主子表同时保存）
    if (hasChildTables) {
      console.log('进入有子表分支，调用submit')
      // DynamicForm会处理保存逻辑，保存成功后会触发submit事件，由handleFormSubmit处理后续逻辑
      await formRef.value.submit({
        preventDefault: () => {}
      })
      console.log('submit执行完成')
      saving.value = false
      return
    }
    console.log('进入无子表分支，执行原有保存逻辑')

    // 没有子表，使用原有的保存逻辑
    if (mode.value === 'create') {
      // 新增模式：提交所有字段
      const formData = formRef.value.getFormData()

      const result = await formStore.createRecord(
        (tableConfig.value!.table as any).NAME || (tableConfig.value!.table as any).name,
        formData
      )
      Message.success('新增成功')

      // 使用 navigationStore 跳转到编辑页（如果是通过 props 传入的参数）
      if (props.tableId) {
        navigationStore.navigateTo('MetadataFormView', `编辑${tableConfig.value!.table.DISPLAY_NAME}`, {
          tableId: props.tableId,
          recordId: result.ID,
          mode: 'edit'
        }, false) // 不推入历史栈，直接替换当前页面
      } else {
        // 兼容路由模式
        router.replace({
          name: 'MetadataFormView',
          params: {
            tableId: tableId.value,
            id: String(result.ID)
          }
        })
      }
    } else {
      // 编辑模式
      const changedFields = formRef.value.getChangedFields()

      // 如果没有字段变更，提示用户
      if (Object.keys(changedFields).length === 0) {
        Message.info('没有字段被修改')
        saving.value = false
        return
      }

      await formStore.updateRecord(
        (tableConfig.value!.table as any).NAME || (tableConfig.value!.table as any).name,
        Number(recordId.value),
        changedFields  // 只提交变更的字段
      )
      Message.success('保存成功')
      hasChanges.value = false

      // 刷新数据
      await handleRefresh()
    }
  } catch (error: any) {
    Message.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

/**
 * 表单提交（由 DynamicForm 触发，主子表保存成功后调用）
 */
async function handleFormSubmit(data: any) {
  try {
    Message.success('保存成功')
    hasChanges.value = false

    // 新增模式下跳转到编辑页
    if (mode.value === 'create' && data?.ID) {
      // 使用 navigationStore 跳转到编辑页（如果是通过 props 传入的参数）
      if (props.tableId) {
        navigationStore.navigateTo('MetadataFormView', `编辑${tableConfig.value!.table.DISPLAY_NAME}`, {
          tableId: props.tableId,
          recordId: data.ID,
          mode: 'edit'
        }, false) // 不推入历史栈，直接替换当前页面
      } else {
        // 兼容路由模式
        router.replace({
          name: 'MetadataFormView',
          params: {
            tableId: tableId.value,
            id: String(data.ID)
          }
        })
      }
    } else {
      // 编辑模式下刷新数据
      await handleRefresh()
    }
  } catch (error: any) {
    Message.error(error.message || '操作失败')
  }
}

/**
 * 编辑
 */
function handleEdit() {
  navigationStore.navigateTo('MetadataFormView', '编辑', {
    tableId: Number(tableId.value),
    recordId: Number(recordId.value),
    mode: 'edit'
  })
}

/**
 * 复制
 */
async function handleCopy() {
  if (!formRef.value) return

  Modal.confirm({
    title: '确认复制',
    content: '确定要复制当前记录吗？',
    onOk: () => {
      navigationStore.navigateTo('MetadataFormView', '新增', {
        tableId: Number(tableId.value),
        mode: 'create',
        copyFrom: Number(recordId.value)
      })
    }
  })
}

/**
 * 打印
 */
function handlePrint() {
  window.print()
}

/**
 * 刷新
 */
async function handleRefresh() {
  if (formRef.value && recordId.value) {
    await formRef.value.loadData(Number(recordId.value))
  }
}

/**
 * 返回
 */
function handleBack() {
  const tabs = navigationStore.tabs
  if (!tabs || !Array.isArray(tabs)) {
    console.error('[handleBack] tabs is not an array:', tabs)
    return
  }
  const formTabKey = navigationStore.activeTabKey

  // 优先返回来源标签页（addTab 时记录的 sourceTabKey），保证回到正确的列表/来源窗口
  const currentTab = tabs.find(t => t.key === formTabKey)
  const sourceTab = currentTab?.sourceTabKey
    ? tabs.find(t => t.key === currentTab.sourceTabKey)
    : undefined

  // 其次找同 tableId 的 MetadataListView（浏览/详情场景）
  const tableIdNum = Number(tableId.value)
  const listTab = sourceTab ||
    tabs.find(t => t.componentName === 'MetadataListView' && Number((t.params as any)?.tableId) === tableIdNum) ||
    tabs.find(t => t.componentName === 'MetadataListView')

  if (listTab) {
    navigationStore.activeTabKey = listTab.key
    navigationStore.current = { componentName: listTab.componentName, title: listTab.title, params: listTab.params || {} }
    navigationStore.removeTab(formTabKey)
  } else {
    // 都没有则回退历史栈
    navigationStore.goBack()
  }
}

/**
 * 加载记录列表（用于上一条/下一条导航）
 */
let loadingRecordList = false  // 防止重复加载
async function loadRecordList() {
  // 如果正在加载，直接返回
  if (loadingRecordList) {
    console.trace('[MetadataFormView] 调用栈:')
    return
  }

  try {
    loadingRecordList = true
    const tableName = (tableConfig.value!.table as any).NAME || (tableConfig.value!.table as any).name
    console.trace('[MetadataFormView] 调用栈:')

    // 使用 tableStore 加载记录
    await tableStore.loadRecords(tableName)

    recordList.value = tableStore.records

    if (!recordList.value || !Array.isArray(recordList.value)) {
      console.warn('[loadRecordList] recordList is not an array, skipping findIndex')
      return
    }

    currentIndex.value = recordList.value.findIndex(
      r => r.ID === Number(recordId.value)
    )

    hasPrevious.value = currentIndex.value > 0
    hasNext.value = currentIndex.value < recordList.value.length - 1
  } catch (error) {
    console.error('加载记录列表失败', error)
  } finally {
    loadingRecordList = false
  }
}

/**
 * 上一条/下一条导航
 */

/**
 * 子表 - 新增
 */
function handleDetailCreate(detailTable: any) {
  navigationStore.navigateTo('MetadataFormView', '新增明细', {
    tableId: detailTable.id,
    mode: 'create',
    parentId: recordId.value,
    _t: Date.now()  // 确保每次创建新标签页
  })
}

/**
 * 子表 - 编辑
 */
function handleDetailEdit(detailTable: any, record: any) {
  navigationStore.navigateTo('MetadataFormView', '编辑', {
    tableId: detailTable.id,
    recordId: record.ID,
    mode: 'edit'
  })
}

/**
 * 子表 - 删除
 */
async function handleDetailDelete(detailTable: any, record: any) {
  const recordId = record.ID || record.id
  if (!recordId) {
    Message.error('无法获取记录ID')
    return
  }
  try {
    // 通过 tableId 获取表名
    const tableId = detailTable.id
    const config = await metadataStore.loadTableConfig(tableId)
    const tableName = (config?.table as any)?.NAME || (config?.table as any)?.name
    if (!tableName) {
      Message.error('无法获取表名')
      return
    }
    await metadataApi.deleteRecord(tableName, recordId)
    Message.success('删除成功')
    // 刷新详情列表
    if (formRef.value) {
      formRef.value.refreshDetails?.()
    }
  } catch (e: any) {
    Message.error('删除失败: ' + (e?.message || '未知错误'))
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadConfig()
})

// 监听页面离开
onBeforeUnmount(() => {
  if (hasChanges.value) {
    // 如果有未保存的更改，可以在这里做一些清理工作
  }
})

// 监听路由参数变化（上一条/下一条导航）
watch(
  () => route.params.id,
  () => {
    if (route.name?.toString().startsWith('MetadataForm')) {
      hasChanges.value = false
      loadRecordList()
    }
  }
)

// 监听当前标签页切换，从明细操作返回时刷新数据
const parentTabKey = navigationStore.activeTabKey
watch(
  () => navigationStore.activeTabKey,
  (newKey) => {
    if (newKey === parentTabKey && newKey !== '') {
      loadConfig()
    }
  }
)

// 监听 props.mode 变化（查看 -> 编辑切换）
watch(
  () => props.mode,
  (newMode, oldMode) => {
    if (newMode && oldMode && newMode !== oldMode) {
      // 模式切换时重置 hasChanges
      hasChanges.value = false
      // DynamicForm 组件会自己处理数据加载
    }
  }
)
</script>

<style scoped>
.metadata-form-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - 64px);
  background: var(--bg-page);
  overflow: hidden;
}

/* —— 单对象页统一配色（与企业后台观感一致，覆盖上方历史规则） —— */
/* 顶部操作栏：白底 + 细下边框（收敛阴影） */
.metadata-form-view__header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

/* 主内容区 */
.metadata-form-view__main {
  width: 100%;
  flex: 1;
  padding: 12px 16px;
  overflow-y: auto;
  flex-shrink: 1;
  min-height: 0;
}

.form-spin {
  width: 100%;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表单样式优化（全局生效） */
:deep(.arco-form) {
  max-width: 100%;
  margin: 0;
}

:deep(.arco-form-item) {
  margin-bottom: 16px;
}

/* 主内容卡片：细边框 + 轻阴影 + 通栏 */
.form-card {
  border-radius: 8px;
  border: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* 卡片正文内边距统一 */
.form-card :deep(.arco-card-body) {
  padding: 20px;
}

/* 表单标签：深字加粗、右对齐简洁 */
.metadata-form-view :deep(.arco-form-label) {
  font-weight: 600;
  color: #1f2329;
}

/* 输入类控件：细边框、hover/focus 品牌蓝细分 */
.metadata-form-view :deep(.arco-input),
.metadata-form-view :deep(.arco-select),
.metadata-form-view :deep(.arco-date-picker),
.metadata-form-view :deep(.arco-input-number),
.metadata-form-view :deep(.arco-textarea) {
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  font-size: 13px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.metadata-form-view :deep(.arco-input):hover,
.metadata-form-view :deep(.arco-select):hover,
.metadata-form-view :deep(.arco-date-picker):hover,
.metadata-form-view :deep(.arco-input-number):hover {
  border-color: #b8bfcc;
}
.metadata-form-view :deep(.arco-input):focus,
.metadata-form-view :deep(.arco-select):focus,
.metadata-form-view :deep(.arco-date-picker):focus,
.metadata-form-view :deep(.arco-input-number):focus {
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.08);
}

/* 必填星标、错误提示对齐 */
.metadata-form-view :deep(.arco-form-item-label-required-symbol) {
  color: #f53f3f;
}
.metadata-form-view :deep(.arco-form-item-message) {
  color: #f53f3f;
}

/* 子表区域 */
.detail-tables {
  margin-top: 32px;
  border-top: 1px solid var(--border);
  padding-top: 24px;
}

.detail-tables :deep(.arco-tabs) {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.detail-tables :deep(.arco-tabs-nav) {
  margin-bottom: 16px;
}

.detail-tables :deep(.arco-tabs-content) {
  padding-top: 0;
}

/* 打印样式 */
@media print {
  .metadata-form-view__header {
    display: none;
  }

  .metadata-form-view__main {
    padding: 0;
    background: var(--bg-card);
  }

  .form-card {
    box-shadow: none;
    border: 1px solid var(--border);
  }
}

/* 响应式适配 */
@media (max-width: 1200px) {
  :deep(.arco-form) {
    max-width: 100%;
  }

  .form-card :deep(.arco-card-body) {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .metadata-form-view__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
  }

  .header-left,
  .header-right {
    width: 100%;
  }

  .header-right :deep(.arco-space) {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  .header-right :deep(.arco-btn) {
    font-size: 13px;
    padding: 0 12px;
  }

  .metadata-form-view__main {
    padding: 12px;
  }

  .form-card :deep(.arco-card-body) {
    padding: 16px;
  }

  /* 小屏幕下表单改为单列布局 */
  :deep(.arco-form-item) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  :deep(.arco-form-label-col) {
    width: 100% !important;
    margin-bottom: 6px;
    text-align: left;
  }

  :deep(.arco-form-wrapper-col) {
    width: 100% !important;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .header-right :deep(.arco-space) {
    justify-content: center;
  }

  .header-right :deep(.arco-btn) {
    flex: 1;
    min-width: 80px;
  }
}
</style>
```
