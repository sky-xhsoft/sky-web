<!-- 元数据列表视图 -->
<template>
  <div class="metadata-list-view">

    <!-- 主内容区 -->
    <main class="metadata-list-view__main">
      <!-- 表格区域 -->
      <div v-if="currentTable && currentTable.ID" class="main-table">
        <!-- 动态表格组件，已经集成了查询区域、工具栏、表格 -->
        <DynamicTable
          ref="tableRef"
          :key="currentTable.ID"
          :table-id="currentTable.ID"
          :filters="currentFilters"
          @create="handleCreate"
          @view="handleView"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="main-empty">
        <a-empty description="请从左侧菜单选择需要管理的表单">
          <template #image>
            <icon-file :size="64" />
          </template>
        </a-empty>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconApps, IconFile } from '@arco-design/web-vue/es/icon'
import { DynamicTable } from '@/modules/metadata'
import { useMetadataStore } from '@/modules/metadata'
import { useNavigationStore } from '@/stores/navigation'
import type { SysTable } from '@/modules/metadata'

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

const filterForm = ref<Record<string, any>>({})
const currentFilters = ref<Record<string, any>>({})
const currentTable = ref<SysTable | null>(null)

/**
 * 查询
 */
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
function handleDelete(_record: any) {
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
        // 加载新表配置
        await loadTableById(tableId)
      }
    } else if (!newTableId) {
      // 如果 tableId 被清除，重置当前选择
      currentTable.value = null
      currentFilters.value = {}
      filterForm.value = {}

      // 同时重置 DynamicTable 的 store 状态
      const { useDynamicTableStore } = await import('@/modules/metadata/stores/useDynamicTableStore')
      const tableStore = useDynamicTableStore()
      tableStore.reset()
    }
  }
)

/**
 * 根据 ID 加载表单
 */
async function loadTableById(tableId: number) {
  try {

    // 1. 先重置 DynamicTable 的 store（同步操作，确保在新组件挂载前完成）
    const { useDynamicTableStore } = await import('@/modules/metadata/stores/useDynamicTableStore')
    const tableStore = useDynamicTableStore()
    tableStore.reset()

    // 2. 清空本地查询条件
    currentFilters.value = {}
    filterForm.value = {}

    // 3. 加载表单配置（这会触发 currentTable.ID 变化，导致 DynamicTable 重新挂载）
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
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
}

/* 主内容区 */
.metadata-list-view__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.main-table {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 移除原来的卡片样式，DynamicTable已经自带卡片样式 */
.table-card {
  display: none;
}

.main-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin: 20px;
}

.main-empty :deep(.arco-empty-image) {
  color: #94a3b8;
}

/* 响应式 */
@media (max-width: 768px) {
  .list-view-header {
    padding: 12px 16px;
  }

  .metadata-list-view__main {
    padding: 12px;
  }

  .main-empty {
    margin: 12px;
  }
}
</style>
