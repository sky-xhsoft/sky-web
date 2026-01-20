<!-- 元数据简单列表视图 - 仅显示表格，无左侧导航 -->
<template>
  <div class="metadata-simple-list-view">
    <a-spin :loading="loading" style="width: 100%">
      <DynamicTable
        v-if="tableId"
        :key="tableId"
        :table-id="tableId"
        @create="handleCreate"
        @view="handleView"
        @edit="handleEdit"
      />
      <a-empty v-else description="无效的表单ID" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DynamicTable } from '@/modules/metadata'
import { useMetadataStore } from '@/modules/metadata'

const route = useRoute()
const router = useRouter()
const metadataStore = useMetadataStore()

const loading = ref(false)
const tableId = ref<number | null>(null)

// 加载表单配置
async function loadTable(id: number) {
  tableId.value = id
  loading.value = true
  try {
    await metadataStore.loadTableConfig(id)
  } catch (error) {
    console.error('加载表单配置失败', error)
  } finally {
    loading.value = false
  }
}

// 初始化加载
onMounted(async () => {
  const tableIdParam = route.params.tableId
  if (tableIdParam) {
    const id = Number(tableIdParam)
    if (!isNaN(id)) {
      await loadTable(id)
    }
  }
})

// 监听路由参数变化
watch(
  () => route.params.tableId,
  (newTableId) => {
    if (newTableId) {
      const id = Number(newTableId)
      if (!isNaN(id) && id !== tableId.value) {
        loadTable(id)
      }
    }
  }
)

function handleCreate() {
  if (tableId.value) {
    router.push({
      name: 'MetadataFormCreate',
      params: { tableId: tableId.value }
    })
  }
}

function handleView(record: any) {
  if (tableId.value) {
    router.push({
      name: 'MetadataFormView',
      params: {
        tableId: tableId.value,
        id: record.ID
      }
    })
  }
}

function handleEdit(record: any) {
  if (tableId.value) {
    router.push({
      name: 'MetadataFormEdit',
      params: {
        tableId: tableId.value,
        id: record.ID
      }
    })
  }
}
</script>

<style scoped>
.metadata-simple-list-view {
  width: 100%;
  height: 100%;
  padding: 20px;
  background: #fff;
}
</style>
