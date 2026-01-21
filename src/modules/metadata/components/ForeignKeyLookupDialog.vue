<template>
  <a-modal
    :visible="visible"
    :title="title"
    width="900px"
    :footer="false"
    :align-center="false"
    @cancel="handleCancel"
  >
    <div class="fk-lookup-dialog">
      <!-- 查询条件 -->
      <a-form :model="queryForm" layout="inline" class="query-form">
        <a-form-item
          v-for="field in queryFields"
          :key="field.DB_NAME || field.dbName"
          :label="field.DISPLAY_NAME || field.displayName"
        >
          <a-input
            v-model="queryForm[field.DB_NAME || field.dbName]"
            :placeholder="`请输入${field.DISPLAY_NAME || field.displayName}`"
            allow-clear
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <template #icon><icon-search /></template>
            查询
          </a-button>
          <a-button @click="handleReset" style="margin-left: 8px">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 数据表格 -->
      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        :row-selection="rowSelection"
        v-model:selected-keys="selectedKeys"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
        @select="handleRowSelect"
      >
        <template #empty>
          <a-empty description="暂无数据" />
        </template>
      </a-table>

      <!-- 操作按钮 -->
      <div class="dialog-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" @click="handleConfirm" :disabled="!selectedRow">
          确定
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconSearch, IconRefresh } from '@arco-design/web-vue/es/icon'
import * as metadataApi from '../api/metadata'
import type { SysColumn } from '../types'

interface Props {
  visible: boolean
  tableId: number
  columnId?: number
  title?: string
  currentValue?: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select', row: { value: any; label: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '查找数据'
})

const emit = defineEmits<Emits>()

// 引用表的列配置
const refTableColumns = ref<SysColumn[]>([])
const loading = ref(false)

// 查询字段（IS_QUERY = 'Y'）
const queryFields = computed(() => {
  return refTableColumns.value.filter(col =>
    col.IS_QUERY === 'Y' || (col as any).isQuery === 'Y'
  )
})

// 显示列（根据 MASK 字段判断是否可见）
const displayColumns = computed(() => {
  return refTableColumns.value.filter(col => {
    const mask = col.MASK || (col as any).mask || '0000000000'
    const dbName = col.DB_NAME || (col as any).dbName

    // MASK 第5位为 '1' 表示列表可见（索引4）
    // 或者是 ID、DK 字段
    const isListVisible = mask.length >= 5 && mask[4] === '1'
    const isId = dbName === 'ID'
    const isDk = col.IS_DK === 'Y' || (col as any).isDk === 'Y'

    return isId || isDk || isListVisible
  }).slice(0, 6) // 最多显示 6 列
})

// 动态查询表单
const queryForm = reactive<Record<string, any>>({})

// 表格数据
const tableData = ref<any[]>([])
const selectedRow = ref<any>(null)

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50, 100]
})

// 表格列配置（动态生成）
const columns = computed(() => {
  if (displayColumns.value.length === 0) {
    return [
      { title: '值', dataIndex: 'value', width: 100 },
      { title: '显示名称', dataIndex: 'label', ellipsis: true, tooltip: true }
    ]
  }

  return displayColumns.value.map(col => {
    const dbName = col.DB_NAME || (col as any).dbName
    const displayName = col.DISPLAY_NAME || (col as any).displayName || dbName
    const colType = col.COL_TYPE || (col as any).colType
    const isDk = col.IS_DK === 'Y' || (col as any).isDk === 'Y'

    // 根据字段类型和是否为 DK 字段决定列宽
    let width: number | undefined
    if (dbName === 'ID') {
      width = 80
    } else if (colType === 'int' || colType === 'bigint') {
      width = 100
    } else if (colType === 'datetime' || colType === 'date') {
      width = 180
    } else if (!isDk) {
      width = 150
    }

    return {
      title: displayName,
      dataIndex: dbName,
      ellipsis: true,
      tooltip: true,
      width
    }
  })
})

// 选中的行 keys
const selectedKeys = ref<(string | number)[]>([])

// 行选择配置
const rowSelection = {
  type: 'radio',
  showCheckedAll: false
}

// 加载引用表的列配置
async function loadTableColumns() {
  try {
    refTableColumns.value = await metadataApi.fetchColumns(props.tableId)

    // 初始化查询表单字段
    queryFields.value.forEach(col => {
      const dbName = col.DB_NAME || (col as any).dbName
      queryForm[dbName] = ''
    })
  } catch (error: any) {
    console.error('[ForeignKeyLookupDialog] 加载列配置失败:', error)
    Message.error('加载列配置失败')
  }
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    // 构建查询参数（包含所有查询字段）
    const filters: Record<string, any> = {}
    Object.keys(queryForm).forEach(key => {
      if (queryForm[key]) {
        filters[key] = queryForm[key]
      }
    })

    const response = await metadataApi.getForeignKeyOptions({
      tableId: props.tableId,
      columnId: props.columnId,
      search: filters['_search'] || '',
      page: pagination.current,
      pageSize: pagination.pageSize,
      filters
    })

    console.log('[ForeignKeyLookupDialog] API response:', response)
    const rawList = response.list || []
    console.log('[ForeignKeyLookupDialog] raw first row:', rawList[0])
    console.log('[ForeignKeyLookupDialog] raw first row keys:', rawList[0] ? Object.keys(rawList[0]) : [])

    // 转换数据：确保有 id 字段
    tableData.value = rawList.map(row => {
      const newRow: any = { id: row.ID }
      // 复制所有字段
      Object.keys(row).forEach(key => {
        newRow[key] = row[key]
      })
      return newRow
    })

    console.log('[ForeignKeyLookupDialog] tableData:', tableData.value)
    pagination.total = response.total || 0
  } catch (error: any) {
    console.error('[ForeignKeyLookupDialog] loadData error:', error)
    Message.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

// 查询
function handleSearch() {
  pagination.current = 1
  loadData()
}

// 行选择
function handleRowSelect(rowKeys: (string | number)[]) {
  console.log('[ForeignKeyLookupDialog] handleRowSelect:', rowKeys)
  const selected = tableData.value.find(row => row.id === rowKeys[0])
  console.log('[ForeignKeyLookupDialog] selected row:', selected)
  selectedRow.value = selected || null
}

// 重置
function handleReset() {
  Object.keys(queryForm).forEach(key => {
    queryForm[key] = ''
  })
  pagination.current = 1
  selectedRow.value = null
  selectedKeys.value = []
  loadData()
}

// 翻页
function handlePageChange(page: number) {
  pagination.current = page
  loadData()
}

// 改变每页条数
function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadData()
}

// 确定
function handleConfirm() {
  if (!selectedRow.value) {
    Message.warning('请选择一条数据')
    return
  }

  console.log('[ForeignKeyLookupDialog] handleConfirm selectedRow:', selectedRow.value)
  console.log('[ForeignKeyLookupDialog] refTableColumns length:', refTableColumns.value.length)

  // 如果还没有加载列配置，直接使用 NAME 字段
  if (refTableColumns.value.length === 0) {
    const recordId = selectedRow.value.ID || selectedRow.value.id
    const label = selectedRow.value.NAME || String(recordId)

    emit('select', {
      value: recordId,
      label: label
    })
    emit('update:visible', false)
    return
  }

  // 获取 DK 字段值作为 label
  const dkCol = refTableColumns.value.find(col =>
    col.IS_DK === 'Y' || (col as any).isDk === 'Y'
  )

  console.log('[ForeignKeyLookupDialog] dkCol:', dkCol)

  const dkDbName = dkCol ? (dkCol.DB_NAME || (dkCol as any).dbName) : 'NAME'
  const recordId = selectedRow.value.ID || selectedRow.value.id
  const label = selectedRow.value[dkDbName] || selectedRow.value.NAME || String(recordId)

  console.log('[ForeignKeyLookupDialog] dkDbName:', dkDbName, 'label:', label)

  emit('select', {
    value: recordId,
    label: label
  })
  emit('update:visible', false)
}

// 取消
function handleCancel() {
  emit('update:visible', false)
}

// 监听 visible 变化，打开时加载数据
watch(
  () => props.visible,
  async (newVal) => {
    if (newVal) {
      selectedRow.value = null
      selectedKeys.value = []
      Object.keys(queryForm).forEach(key => {
        queryForm[key] = ''
      })
      pagination.current = 1

      // 如果还没有加载列配置，先加载
      if (refTableColumns.value.length === 0) {
        await loadTableColumns()
      }

      loadData()
    }
  }
)

// 组件挂载时加载列配置
onMounted(() => {
  if (props.visible) {
    loadTableColumns()
  }
})
</script>

<style scoped lang="less">
.fk-lookup-dialog {
  .query-form {
    margin-bottom: 16px;
    padding: 16px;
    background: #f6f7f9;
    border-radius: 4px;
  }

  .dialog-footer {
    margin-top: 16px;
    text-align: right;

    .arco-btn + .arco-btn {
      margin-left: 8px;
    }
  }
}
</style>
