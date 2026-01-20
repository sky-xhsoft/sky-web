<!-- 元数据列表视图 -->
<template>
  <div class="metadata-list-view" :class="{ 'no-sidebar': true }">
    <!-- 左侧导航树 - 隐式路由模式下隐藏（已在 BasicLayout 菜单中显示） -->
    <aside v-if="false" class="metadata-list-view__sidebar">
      <div class="sidebar-header">
        <h3>元数据管理</h3>
      </div>

      <!-- 搜索框 -->
      <div class="sidebar-search">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索表单"
          allow-clear
          @search="handleTreeSearch"
        />
      </div>

      <!-- 树形菜单 -->
      <div class="sidebar-tree">
        <a-spin :loading="treeLoading" class="tree-spin">
          <a-tree
            v-if="filteredTree.length > 0"
            :data="filteredTree"
            :selected-keys="selectedKeys"
            :expanded-keys="expandedKeys"
            :show-line="true"
            :block-node="true"
            @select="handleNodeSelect"
            @expand="handleNodeExpand"
          >
            <template #icon="{ node }">
              <icon-folder v-if="node.type === 'subsystem'" />
              <icon-folder v-else-if="node.type === 'category'" />
              <icon-file v-else />
            </template>
          </a-tree>

          <a-empty v-else description="暂无数据" />
        </a-spin>
      </div>

      <!-- 折叠按钮 -->
      <div class="sidebar-footer">
        <a-button
          type="text"
          long
          @click="toggleSidebar"
        >
          <template #icon>
            <icon-menu-fold v-if="!sidebarCollapsed" />
            <icon-menu-unfold v-else />
          </template>
          {{ sidebarCollapsed ? '展开' : '收起' }}
        </a-button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main
      class="metadata-list-view__main"
      :class="{ 'sidebar-collapsed': sidebarCollapsed }"
    >
      <!-- 面包屑导航 -->
      <div class="main-breadcrumb">
        <a-breadcrumb>
          <a-breadcrumb-item>
            <icon-apps />
            元数据管理
          </a-breadcrumb-item>
          <a-breadcrumb-item v-if="currentSubsystem">
            {{ currentSubsystem.SUBSYSTEM_NAME }}
          </a-breadcrumb-item>
          <a-breadcrumb-item v-if="currentCategory">
            {{ currentCategory.CATEGORY_NAME }}
          </a-breadcrumb-item>
          <a-breadcrumb-item v-if="currentTable">
            {{ currentTable.DISPLAY_NAME }}
          </a-breadcrumb-item>
        </a-breadcrumb>
      </div>

      <!-- 筛选栏 - 隐式路由模式下，筛选功能已集成在 DynamicTable 组件中 -->
      <!--
      <div v-if="currentTable" class="main-filter">
        ...已注释，使用 DynamicTable 内置的筛选功能
      </div>
      -->

      <!-- 表格区域 -->
      <div v-if="currentTable && currentTable.ID" class="main-table">
        <a-card :bordered="false" class="table-card">
          <DynamicTable
            ref="tableRef"
            :table-id="currentTable.ID"
            :filters="currentFilters"
            @create="handleCreate"
            @view="handleView"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </a-card>
      </div>

      <!-- 空状态 -->
      <div v-else class="main-empty">
        <a-empty description="请从左侧选择表单">
          <template #image>
            <icon-file :size="64" />
          </template>
        </a-empty>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  IconFolder,
  IconFile,
  IconApps,
  IconSearch,
  IconRefresh,
  IconDown,
  IconUp,
  IconMenuFold,
  IconMenuUnfold
} from '@arco-design/web-vue/es/icon'
import { DynamicTable } from '@/modules/metadata'
import { useMetadataStore } from '@/modules/metadata'
import { useNavigationStore } from '@/stores/navigation'
import type { TreeNode, SysTable, Subsystem, TableCategory, SysColumn } from '@/modules/metadata'

// ==================== Props ====================

interface Props {
  tableId?: number | string  // 支持通过 props 传入 tableId
}

const props = defineProps<Props>()

// ==================== Router ====================

const router = useRouter()
const route = useRoute()

// ==================== Store ====================

const metadataStore = useMetadataStore()
const navigationStore = useNavigationStore()

// ==================== 状态 ====================

const searchKeyword = ref('')
const selectedKeys = ref<string[]>([])
const expandedKeys = ref<string[]>([])
const sidebarCollapsed = ref(false)
const treeLoading = ref(false)

const filterForm = ref<Record<string, any>>({})
const currentFilters = ref<Record<string, any>>({})
const showAdvancedFilter = ref(false)

const currentSubsystem = ref<Subsystem | null>(null)
const currentCategory = ref<TableCategory | null>(null)
const currentTable = ref<SysTable | null>(null)

const tableRef = ref()

// ==================== 计算属性 ====================

/**
 * 树形数据
 */
const treeData = computed(() => {
  return metadataStore.subsystemTree
})

/**
 * 过滤后的树
 */
const filteredTree = computed(() => {
  if (!searchKeyword.value) {
    return treeData.value
  }

  const keyword = searchKeyword.value.toLowerCase()

  function filterNode(nodes: TreeNode[]): TreeNode[] {
    return nodes
      .map(node => {
        const title = String(node.title).toLowerCase()
        const children = node.children ? filterNode(node.children) : []

        if (title.includes(keyword) || children.length > 0) {
          return {
            ...node,
            children
          }
        }
        return null
      })
      .filter(Boolean) as TreeNode[]
  }

  return filterNode(treeData.value)
})

/**
 * 筛选字段列表（前3个可见字段）
 */
const filterColumns = computed(() => {
  if (!currentTable.value) return []

  const columns = metadataStore.getVisibleColumns(currentTable.value.ID)
  return showAdvancedFilter.value ? columns.slice(0, 9) : columns.slice(0, 3)
})

// ==================== 方法 ====================

/**
 * 加载树数据
 */
async function loadTreeData() {
  treeLoading.value = true
  try {
    await metadataStore.reloadTree()

    // 默认展开第一层
    if (treeData.value.length > 0) {
      expandedKeys.value = [treeData.value[0].key as string]
    }
  } catch (error: any) {
    Message.error(error.message || '加载树数据失败')
  } finally {
    treeLoading.value = false
  }
}

/**
 * 树搜索
 */
function handleTreeSearch(value: string) {
  if (value) {
    // 展开所有匹配的节点
    const allKeys: string[] = []
    function collectKeys(nodes: TreeNode[]) {
      nodes.forEach(node => {
        allKeys.push(node.key as string)
        if (node.children) {
          collectKeys(node.children)
        }
      })
    }
    collectKeys(filteredTree.value)
    expandedKeys.value = allKeys
  } else {
    // 恢复默认展开
    if (treeData.value.length > 0) {
      expandedKeys.value = [treeData.value[0].key as string]
    }
  }
}

/**
 * 树节点选择
 */
function handleNodeSelect(keys: string[], event: any) {
  const key = keys[0]
  if (!key) return

  selectedKeys.value = [key]

  const node = event.node
  const nodeData = node.dataRef.data

  // 更新当前选中的节点
  if (node.dataRef.type === 'table') {
    currentTable.value = nodeData
    currentCategory.value = findCategoryByTableId(nodeData.ID)
    currentSubsystem.value = findSubsystemByCategoryId(currentCategory.value?.ID)

    // 清空筛选条件
    filterForm.value = {}
    currentFilters.value = {}

    // 更新 URL，保持路由参数同步
    router.push({
      name: 'MetadataBrowse',
      params: { tableId: String(nodeData.ID) }
    })
  } else {
    currentTable.value = null
    // 如果选择的不是表单节点，移除 tableId 参数
    if (route.params.tableId) {
      router.push({
        name: 'MetadataBrowse'
      })
    }
  }
}

/**
 * 树节点展开
 */
function handleNodeExpand(keys: string[]) {
  expandedKeys.value = keys
}

/**
 * 查找表类别
 */
function findCategoryByTableId(tableId: number): TableCategory | null {
  for (const [categoryId, tables] of metadataStore.tables.entries()) {
    if (tables.some(t => t.ID === tableId)) {
      for (const [subsystemId, categories] of metadataStore.tableCategories.entries()) {
        const category = categories.find(c => c.ID === categoryId)
        if (category) return category
      }
    }
  }
  return null
}

/**
 * 查找子系统
 */
function findSubsystemByCategoryId(categoryId?: number): Subsystem | null {
  if (!categoryId) return null

  for (const [subsystemId, categories] of metadataStore.tableCategories.entries()) {
    if (categories.some(c => c.ID === categoryId)) {
      return metadataStore.getSubsystemById(subsystemId) || null
    }
  }
  return null
}

/**
 * 切换侧边栏
 */
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

/**
 * 查询
 */
function handleSearch() {
  currentFilters.value = { ...filterForm.value }
}

/**
 * 重置
 */
function handleReset() {
  filterForm.value = {}
  currentFilters.value = {}
  tableRef.value?.refresh()
}

/**
 * 新增
 */
function handleCreate() {
  if (!currentTable.value) return

  navigationStore.navigateTo('MetadataFormView', `新增${currentTable.value.DISPLAY_NAME}`, {
    tableId: currentTable.value.ID,
    mode: 'create'
  })
}

/**
 * 查看
 */
function handleView(record: any) {
  if (!currentTable.value) return

  navigationStore.navigateTo('MetadataFormView', `查看${currentTable.value.DISPLAY_NAME}`, {
    tableId: currentTable.value.ID,
    recordId: record.ID,
    mode: 'view'
  })
}

/**
 * 编辑
 */
function handleEdit(record: any) {
  if (!currentTable.value) return

  navigationStore.navigateTo('MetadataFormView', `编辑${currentTable.value.DISPLAY_NAME}`, {
    tableId: currentTable.value.ID,
    recordId: record.ID,
    mode: 'edit'
  })
}

/**
 * 删除
 */
function handleDelete(record: any) {
  // 删除成功提示已在 DynamicTable 的 composable 中处理
  // 这里可以做一些额外的处理，比如记录日志
}

// ==================== 生命周期 ====================

onMounted(async () => {
  // 隐式路由模式下，跳过加载树数据（树已在 BasicLayout 的菜单中显示）
  // 避免调用不存在的 /metadata/subsystems 等接口

  // 优先使用 props 传入的 tableId，如果没有则从 URL 参数获取
  const tableIdParam = props.tableId || route.params.tableId

  if (tableIdParam) {
    const tableId = Number(tableIdParam)
    if (!isNaN(tableId)) {
      // 加载表单配置
      await loadTableById(tableId)
    }
  }
})

// 监听 props.tableId 和路由变化
watch(
  () => props.tableId || route.params.tableId,
  async (newTableId, oldTableId) => {
    if (newTableId && newTableId !== oldTableId) {
      const tableId = Number(newTableId)
      if (!isNaN(tableId)) {
        await loadTableById(tableId)
      }
    } else if (!newTableId) {
      // 如果 tableId 被清除，重置当前选择
      currentTable.value = null
      currentCategory.value = null
      currentSubsystem.value = null
      selectedKeys.value = []
    }
  }
)

/**
 * 根据 ID 加载表单
 */
async function loadTableById(tableId: number) {
  try {
    // 隐式路由模式：直接从 API 加载表单配置，不依赖树结构
    const config = await metadataStore.loadTableConfig(tableId)
    currentTable.value = config.table
  } catch (error: any) {
    Message.error(error.message || '加载表单失败')
  }
}
</script>

<style scoped>
.metadata-list-view {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
}

/* 左侧边栏 */
.metadata-list-view__sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.metadata-list-view__sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  background: linear-gradient(135deg, #2b9e91 0%, #1f7a6f 100%);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.sidebar-search {
  padding: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tree-spin {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-tree :deep(.arco-tree-node) {
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.sidebar-tree :deep(.arco-tree-node:hover) {
  background: #f5f5f5;
}

.sidebar-tree :deep(.arco-tree-node-selected) {
  background: #e8f5f3;
  color: #2b9e91;
  font-weight: 500;
}

.sidebar-tree :deep(.arco-tree-node-title) {
  font-size: 14px;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #e8e8e8;
}

/* 隐式路由模式 - 无侧边栏 */
.metadata-list-view.no-sidebar {
  grid-template-columns: 1fr;
}

.metadata-list-view.no-sidebar .metadata-list-view__sidebar {
  display: none;
}

/* 主内容区 */
.metadata-list-view__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.metadata-list-view__main.sidebar-collapsed {
  margin-left: -220px;
}

.main-breadcrumb {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.main-breadcrumb :deep(.arco-breadcrumb-item) {
  display: flex;
  align-items: center;
  gap: 4px;
}

.main-filter {
  padding: 16px 24px 0;
}

.filter-card {
  margin-bottom: 0;
}

.main-table {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.table-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-card :deep(.arco-card-body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.table-card :deep(.dynamic-table) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.main-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-empty :deep(.arco-empty-image) {
  color: #bfbfbf;
}

/* 响应式 */
@media (max-width: 768px) {
  .metadata-list-view__sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
  }

  .metadata-list-view__sidebar:not(.collapsed) {
    transform: translateX(0);
  }

  .metadata-list-view__main {
    margin-left: 0 !important;
  }

  .main-breadcrumb,
  .main-filter,
  .main-table {
  }

  .filter-card :deep(.arco-col) {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>
