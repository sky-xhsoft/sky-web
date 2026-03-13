<!-- 元数据表单视图 -->
<template>
  <div class="metadata-form-view">
    <!-- 顶部操作栏 -->
    <header class="metadata-form-view__header">
      <div class="header-left">
        <a-breadcrumb>
          <a-breadcrumb-item>
            <icon-apps />
            元数据管理
          </a-breadcrumb-item>
          <a-breadcrumb-item v-if="tableConfig">
            {{ (tableConfig.table as any).DISPLAY_NAME || (tableConfig.table as any).displayName || '未命名表单' }}
          </a-breadcrumb-item>
          <a-breadcrumb-item>
            {{ modeName }}
          </a-breadcrumb-item>
        </a-breadcrumb>
      </div>

      <div class="header-right">
        <a-space>
          <!-- 上一条 -->
          <!-- <a-button
            v-if="mode !== 'create' && hasPrevious"
            type="text"
            @click="handleNavigate('previous')"
          >
            <template #icon><icon-left /></template>
            上一条
          </a-button> -->

          <!-- 下一条 -->
          <!-- <a-button
            v-if="mode !== 'create' && hasNext"
            type="text"
            @click="handleNavigate('next')"
          >
            下一条
            <template #icon><icon-right /></template>
          </a-button> -->

          <!-- 复制 -->
          <a-button
            v-if="mode === 'view' && canCreate"
            @click="handleCopy"
          >
            <template #icon><icon-copy /></template>
            复制
          </a-button>

          <!-- 打印 -->
          <a-button
            v-if="mode !== 'create' && canPrint"
            @click="handlePrint"
          >
            <template #icon><icon-printer /></template>
            打印
          </a-button>

          <!-- 刷新 -->
          <a-button
            v-if="mode !== 'create'"
            @click="handleRefresh"
          >
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>

          <!-- 编辑 -->
          <a-button
            v-if="mode === 'view' && canEdit"
            type="primary"
            @click="handleEdit"
          >
            <template #icon><icon-edit /></template>
            编辑
          </a-button>

          <!-- 保存 -->
          <a-button
            v-if="mode === 'edit' || mode === 'create'"
            type="primary"
            :loading="saving"
            @click="handleSave"
          >
            <template #icon><icon-save /></template>
            保存
          </a-button>

          <!-- 返回 -->
          <a-button @click="handleBack">
            <template #icon><icon-close /></template>
            返回
          </a-button>
        </a-space>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="metadata-form-view__main">
      <a-spin :loading="loading" class="form-spin">
        <a-card :bordered="false" class="form-card">
          <!-- 动态表单 -->
          <DynamicForm
            ref="formRef"
            :table-id="Number(tableId)"
            :record-id="recordId ? Number(recordId) : undefined"
            :copy-from="copyFrom ? Number(copyFrom) : undefined"
            :mode="mode"
            :label-col-span="6"
            :wrapper-col-span="18"
            :show-system-fields="showSystemFields"
            @submit="handleFormSubmit"
            @change="handleFormChange"
            @loaded="handleFormLoaded"
          />

          <!-- 子表区域 -->
          <div v-if="detailTables.length > 0" class="detail-tables">
            <a-divider />
            <a-tabs v-model:active-key="activeDetailTab">
              <a-tab-pane
                v-for="detailTable in detailTables"
                :key="detailTable.id"
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
            </a-tabs>
          </div>
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
  IconApps,
  IconCopy,
  IconPrinter,
  IconRefresh,
  IconEdit,
  IconSave,
  IconClose
} from '@arco-design/web-vue/es/icon'
import { DynamicForm } from '../components/DynamicForm'
import { DynamicTable } from '../components/DynamicTable'
import { useMetadataStore } from '../stores/useMetadataStore'
import { useDynamicFormStore } from '../stores/useDynamicFormStore'
import { useDynamicTableStore } from '../stores/useDynamicTableStore'
import type { FormMode, TableConfig, FormData } from '../types'
import { useNavigationStore } from '@/stores/navigation'

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
const activeDetailTab = ref<string>()
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
  }>
})

// ==================== 方法 ====================

/**
 * 加载表单配置
 */
async function loadConfig() {
  loading.value = true
  try {
    tableConfig.value = await metadataStore.loadTableConfig(Number(tableId.value))

    // 如果有子表，默认激活第一个
    if (detailTables.value.length > 0) {
      const firstDetailTable = detailTables.value[0] as any
      activeDetailTab.value = String(firstDetailTable.id)
    }
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
  // 加载记录列表用于上一条/下一条导航
  if (mode.value !== 'create') {
    loadRecordList()
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
async function handleBack() {
  if (hasChanges.value) {
    Modal.confirm({
      title: '提示',
      content: '表单有未保存的修改，确定要离开吗？',
      onOk: () => {
        // 用户点击确定后再返回
        // 优先使用历史栈返回
        const hasHistory = navigationStore.goBack()
        if (!hasHistory) {
          // 如果没有历史记录，返回到当前表的列表页
          if (props.tableId) {
            navigationStore.navigateTo('MetadataListView', '数据列表', {
              tableId: props.tableId
            }, false) // 不推入历史栈
          } else {
            router.back()
          }
        }
      }
    })
    return
  }

  // 没有修改，直接返回
  // 优先使用历史栈返回
  const hasHistory = navigationStore.goBack()
  if (!hasHistory) {
    // 如果没有历史记录，返回到当前表的列表页
    if (props.tableId) {
      navigationStore.navigateTo('MetadataListView', '数据列表', {
        tableId: props.tableId
      }, false) // 不推入历史栈
    } else {
      router.back()
    }
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
  router.push({
    name: 'MetadataFormCreate',
    params: { tableId: detailTable.id },
    query: { parentId: recordId.value }
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
async function handleDetailDelete(_detailTable: any, record: any) {
  Message.success(`删除成功: ${record.DISPLAY_NAME || record.NAME}`)
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
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
}

/* 顶部操作栏 */
.metadata-form-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  flex: 1;
}

.header-left :deep(.arco-breadcrumb-item) {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-right {
  flex-shrink: 0;
}

/* 主内容区 */
.metadata-form-view__main {
  width: 100%;
  flex: 1;
  padding: 4px 4px;
  overflow-y: auto;
}

.form-spin {
  width: 100%;
  min-height: 400px;
}

.form-card {
  width: 100% !important;
  display: block;
  margin-bottom: 16px;
}

.form-card :deep(.arco-card-body) {
  width: 100% !important;
  display: block;
  padding: 24px;
}

/* 子表区域 */
.detail-tables {
  margin-top: 24px;
}

.detail-tables :deep(.arco-tabs-content) {
  padding-top: 16px;
}

/* 打印样式 */
@media print {
  .metadata-form-view__header {
    display: none;
  }

  .metadata-form-view__main {
    padding: 0;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .metadata-form-view__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-left,
  .header-right {
    width: 100%;
  }

  .header-right :deep(.arco-space) {
    width: 100%;
    justify-content: space-between;
  }

  .metadata-form-view__main {
    padding: 12px;
  }

  .form-card :deep(.arco-card-body) {
    padding: 16px;
  }
}
</style>
```
