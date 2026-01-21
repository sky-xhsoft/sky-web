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
            v-if="mode !== 'create'"
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
  IconLeft,
  IconRight,
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
const mode = computed<FormMode>(() => {
  if (props.mode) return props.mode
  if (recordId.value) {
    return route.name === 'MetadataFormView' ? 'view' : 'edit'
  }
  return 'create'
})

const tableConfig = ref<TableConfig | null>(null)
const showSystemFields = ref(true)  // 在表单内显示系统字段，保持样式统一
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
const canCreate = computed(() => mask.value.includes('A'))
const canEdit = computed(() => mask.value.includes('M'))

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
      activeDetailTab.value = String(detailTables.value[0].id)
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
function handleFormLoaded(config: TableConfig) {
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
  if (!formRef.value) return

  try {
    // 验证表单
    const valid = await formRef.value.validate()
    if (!valid) {
      Message.warning('请检查表单填写')
      return
    }

    saving.value = true

    // 保存
    if (mode.value === 'create') {
      // 新增模式：提交所有字段
      const formData = formRef.value.getFormData()

      const result = await formStore.createRecord(
        (tableConfig.value!.table as any).NAME || (tableConfig.value!.table as any).name,
        formData
      )
      Message.success('新增成功')

      // 使用 navigationStore 跳转到查看页（如果是通过 props 传入的参数）
      if (props.tableId) {
        navigationStore.navigateTo('MetadataFormView', `查看${tableConfig.value!.table.DISPLAY_NAME}`, {
          tableId: props.tableId,
          recordId: result.ID,
          mode: 'view'
        })
      } else {
        // 兼容路由模式
        router.replace({
          name: 'MetadataFormView',
          params: {
            tableId: tableId.value,
            id: result.ID
          }
        })
      }
    } else {
      // 编辑模式：只提交变更的字段
      const changedFields = formRef.value.getChangedFields()

      // 如果没有字段变更，提示用户
      if (Object.keys(changedFields).length === 0) {
        Message.info('没有字段被修改')
        saving.value = false
        return
      }

      console.log('[MetadataFormView] 提交变更的字段：', changedFields)

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
 * 表单提交（由 DynamicForm 触发）
 */
async function handleFormSubmit(data: FormData) {
  await handleSave()
}

/**
 * 编辑
 */
function handleEdit() {
  router.push({
    name: 'MetadataFormEdit',
    params: {
      tableId: tableId.value,
      id: recordId.value
    }
  })
}

/**
 * 复制
 */
async function handleCopy() {
  if (!formRef.value) return

  const confirmed = await Modal.confirm({
    title: '确认复制',
    content: '确定要复制当前记录吗？'
  })

  if (confirmed) {
    router.push({
      name: 'MetadataFormCreate',
      params: { tableId: tableId.value },
      query: { copyFrom: recordId.value }
    })
  }
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
    const confirmed = await Modal.confirm({
      title: '提示',
      content: '表单有未保存的修改，确定要离开吗？'
    })
    if (!confirmed) return
  }

  // 使用 navigationStore 返回列表视图
  if (props.tableId) {
    navigationStore.navigateTo('MetadataListView', '数据列表', {
      tableId: props.tableId
    })
  } else {
    router.back()
  }
}

/**
 * 加载记录列表（用于上一条/下一条导航）
 */
async function loadRecordList() {
  try {
    const tableName = (tableConfig.value!.table as any).NAME || (tableConfig.value!.table as any).name
    console.log('[MetadataFormView] 加载记录列表, tableName:', tableName, 'recordId:', recordId.value)

    // 使用 tableStore 加载记录
    await tableStore.loadRecords(tableName)

    recordList.value = tableStore.records
    console.log('[MetadataFormView] 记录列表数量:', recordList.value.length)

    currentIndex.value = recordList.value.findIndex(
      r => r.ID === Number(recordId.value)
    )
    console.log('[MetadataFormView] 当前记录索引:', currentIndex.value)

    hasPrevious.value = currentIndex.value > 0
    hasNext.value = currentIndex.value < recordList.value.length - 1
    console.log('[MetadataFormView] hasPrevious:', hasPrevious.value, 'hasNext:', hasNext.value)
  } catch (error) {
    console.error('加载记录列表失败', error)
  }
}

/**
 * 上一条/下一条导航
 */
async function handleNavigate(direction: 'previous' | 'next') {
  if (hasChanges.value) {
    const confirmed = await Modal.confirm({
      title: '提示',
      content: '表单有未保存的修改，确定要离开吗？'
    })
    if (!confirmed) return
  }

  const targetIndex = direction === 'previous'
    ? currentIndex.value - 1
    : currentIndex.value + 1

  if (targetIndex < 0 || targetIndex >= recordList.value.length) return

  const targetRecord = recordList.value[targetIndex]

  router.push({
    name: route.name as string,
    params: {
      tableId: tableId.value,
      id: targetRecord.ID
    }
  })
}

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
  router.push({
    name: 'MetadataFormEdit',
    params: {
      tableId: detailTable.id,
      id: record.ID
    }
  })
}

/**
 * 子表 - 删除
 */
async function handleDetailDelete(detailTable: any, record: any) {
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
