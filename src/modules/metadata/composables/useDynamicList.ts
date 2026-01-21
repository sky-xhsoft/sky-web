/**
 * 动态列表 - Composable
 * 用于管理动态表格的数据加载、筛选、排序、分页等逻辑
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useMetadataStore } from '../stores/useMetadataStore'
import { useDynamicTableStore } from '../stores/useDynamicTableStore'
import type {
  TableConfig,
  SysColumn,
  FormData
} from '../types'

export function useDynamicList(tableId: number) {
  const metadataStore = useMetadataStore()
  const tableStore = useDynamicTableStore()

  // ==================== 状态 ====================

  const tableConfig = ref<TableConfig | null>(null)
  const filterForm = ref<Record<string, any>>({})
  const showAdvancedFilter = ref(false)
  const isMounted = ref(false)

  // ==================== 计算属性 ====================

  /**
   * 表格列配置
   */
  const tableColumns = computed(() => {
    if (!tableConfig.value) return []

    // getGridColumns 已经处理了 mask 过滤，这里只需要映射为表格列配置
    return metadataStore.getGridColumns(tableId)
      .filter(column => column.DB_NAME || (column as any).dbName)  // 确保有字段名
      .map(column => {
        const configWidth = column.GRID_WIDTH || (column as any).displayCols
        return {
          title: column.DISPLAY_NAME || (column as any).displayName || column.DB_NAME,
          dataIndex: column.DB_NAME || (column as any).dbName,
          width: configWidth || undefined,  // 如果配置了宽度就用配置的，否则自动
          minWidth: 100,  // 最小宽度100px
          ellipsis: false,  // 不截断，完整显示
          tooltip: false,
          sortable: true,
          filterable: true,
          // 是否可在表格中编辑
          editable: column.IS_EDITABLE_IN_GRID === 'Y'
        }
      })
  })

  /**
   * 查询字段列表（根据 IS_QUERY 配置）
   */
  const queryColumns = computed(() => {
    if (!tableConfig.value) return []

    return tableConfig.value.columns
      .filter(c => {
        // 字段必须激活
        if (c.IS_ACTIVE !== 'Y') return false

        // 优先使用 IS_QUERY 配置
        const isQuery = c.IS_QUERY || (c as any).isQuery
        if (isQuery !== undefined) {
          return isQuery === 'Y' || isQuery === '1' || isQuery === true
        }

        // 如果没有 IS_QUERY 配置，则不显示在查询区域
        return false
      })
      .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
  })

  /**
   * 筛选字段列表（已废弃，使用 queryColumns 替代）
   */
  const filterColumns = computed(() => {
    if (!tableConfig.value) return []

    return tableConfig.value.columns
      .filter(c => c.IS_VISIBLE === 'Y' && c.IS_ACTIVE === 'Y')
      .slice(0, 6) // 默认显示前6个字段作为筛选条件
      .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
  })

  /**
   * 主键字段名
   */
  const pkField = computed(() => {
    return tableConfig.value?.table.PK || 'ID'
  })

  /**
   * 表单名称（物理表名，用于数据查询）
   */
  const tableName = computed(() => {
    if (!tableConfig.value?.table) return ''
    // 兼容大写和小驼峰两种格式
    // NAME (新格式) 或 name (旧格式)
    return (tableConfig.value.table as any).NAME || (tableConfig.value.table as any).name || ''
  })

  /**
   * 显示名称
   */
  const displayName = computed(() => {
    if (!tableConfig.value?.table) return ''
    // 兼容大写和小驼峰两种格式
    return (tableConfig.value.table as any).DISPLAY_NAME || (tableConfig.value.table as any).displayName || ''
  })

  /**
   * 权限掩码
   */
  const mask = computed(() => {
    if (!tableConfig.value?.table) return ''
    // 兼容大写和小驼峰两种格式
    return (tableConfig.value.table as any).MASK || (tableConfig.value.table as any).mask || ''
  })

  /**
   * 是否可以新增
   */
  const canCreate = computed(() => {
    const maskValue = mask.value
    return maskValue ? maskValue.includes('A') : false
  })

  /**
   * 是否可以修改
   */
  const canEdit = computed(() => {
    const maskValue = mask.value
    return maskValue ? maskValue.includes('M') : false
  })

  /**
   * 是否可以删除
   */
  const canDelete = computed(() => {
    const maskValue = mask.value
    return maskValue ? maskValue.includes('D') : false
  })

  /**
   * 是否可以查询
   */
  const canQuery = computed(() => {
    const maskValue = mask.value
    return maskValue ? maskValue.includes('Q') : false
  })

  /**
   * 是否可以提交
   */
  const canSubmit = computed(() => {
    const maskValue = mask.value
    return maskValue ? maskValue.includes('S') : false
  })

  /**
   * 是否可以反提交
   */
  const canUnsubmit = computed(() => {
    const maskValue = mask.value
    return maskValue ? maskValue.includes('U') : false
  })

  /**
   * 是否可以打印
   */
  const canPrint = computed(() => {
    const maskValue = mask.value
    return maskValue ? maskValue.includes('P') : false
  })

  /**
   * 是否可以导入
   */
  const canImport = computed(() => {
    const maskValue = mask.value
    return maskValue ? maskValue.includes('I') : false
  })

  /**
   * 是否可以导出
   */
  const canExport = computed(() => {
    const maskValue = mask.value
    return maskValue ? maskValue.includes('E') : false
  })

  // ==================== 方法 ====================

  /**
   * 加载表单配置
   */
  async function loadTableConfig() {
    try {
      tableConfig.value = await metadataStore.loadTableConfig(tableId)
      return tableConfig.value
    } catch (error: any) {
      Message.error(error.message || '加载配置失败')
      throw error
    }
  }

  /**
   * 加载数据列表
   */
  async function loadData() {
    if (!tableName.value) {
      await loadTableConfig()
    }

    try {
      await tableStore.loadRecords(tableName.value)
    } catch (error: any) {
      Message.error(error.message || '加载数据失败')
      throw error
    }
  }

  /**
   * 刷新列表
   */
  async function refresh() {
    try {
      await tableStore.refresh(tableName.value)
      Message.success('刷新成功')
    } catch (error: any) {
      Message.error(error.message || '刷新失败')
    }
  }

  /**
   * 搜索/筛选
   */
  async function handleSearch() {
    try {
      await tableStore.updateFilters(tableName.value, filterForm.value)
    } catch (error: any) {
      Message.error(error.message || '查询失败')
    }
  }

  /**
   * 重置筛选条件
   */
  async function handleReset() {
    filterForm.value = {}
    try {
      await tableStore.resetFilters(tableName.value)
    } catch (error: any) {
      Message.error(error.message || '重置失败')
    }
  }

  /**
   * 切换页码
   */
  async function handlePageChange(page: number) {
    try {
      await tableStore.changePage(tableName.value, page)
    } catch (error: any) {
      Message.error(error.message || '加载失败')
    }
  }

  /**
   * 切换每页条数
   */
  async function handlePageSizeChange(pageSize: number) {
    try {
      await tableStore.changePageSize(tableName.value, pageSize)
    } catch (error: any) {
      Message.error(error.message || '加载失败')
    }
  }

  /**
   * 排序
   */
  async function handleSortChange(field: string, order: 'asc' | 'desc' | null) {
    try {
      await tableStore.updateSorter(tableName.value, field, order)
    } catch (error: any) {
      Message.error(error.message || '排序失败')
    }
  }

  /**
   * 选中行
   */
  function handleSelectionChange(keys: (string | number)[]) {
    tableStore.selectRows(keys)
  }

  /**
   * 全选/取消全选
   */
  function handleSelectAll() {
    tableStore.toggleSelectAll(pkField.value)
  }

  /**
   * 删除单条记录
   */
  async function handleDelete(record: FormData) {
    try {
      const id = record[pkField.value] as number
      await tableStore.deleteRecord(tableName.value, id)
      Message.success('删除成功')
    } catch (error: any) {
      Message.error(error.message || '删除失败')
    }
  }

  /**
   * 批量删除
   */
  async function handleBatchDelete() {
    if (!tableStore.hasSelection) {
      Message.warning('请先选择要删除的记录')
      return
    }

    try {
      const selectedRecords = tableStore.getSelectedRecords(pkField.value)
      const ids = selectedRecords.map(r => r[pkField.value] as number)
      await tableStore.batchDelete(tableName.value, ids)
      Message.success('批量删除成功')
    } catch (error: any) {
      Message.error(error.message || '批量删除失败')
    }
  }

  /**
   * 导出数据
   */
  async function handleExport() {
    Message.info('导出功能开发中')
    // TODO: 实现导出逻辑
  }

  /**
   * 获取字段显示值（用于表格单元格）
   */
  function getFieldDisplayValue(column: SysColumn, value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    // 根据字段类型格式化显示
    switch (column.CONTROL_TYPE) {
      case 'date':
        // 格式化日期
        if (value) {
          return new Date(value).toLocaleDateString()
        }
        break

      case 'datetime':
        // 格式化日期时间
        if (value) {
          return new Date(value).toLocaleString()
        }
        break

      case 'number':
        // 格式化数字
        if (column.DECIMAL_PLACES) {
          return Number(value).toFixed(column.DECIMAL_PLACES)
        }
        break

      case 'checkbox':
        // 复选框显示
        return value ? '是' : '否'

      case 'select':
      case 'radio':
        // 字典值显示
        // TODO: 从字典中获取显示文本
        break
    }

    return String(value)
  }

  // ==================== 生命周期 ====================

  onMounted(async () => {
    isMounted.value = true
    try {
      await loadTableConfig()
      if (isMounted.value) {
        await loadData()
      }
    } catch (error) {
      if (isMounted.value) {
        console.error('加载数据失败:', error)
      }
    }
  })

  onUnmounted(() => {
    isMounted.value = false
  })

  // ==================== 返回 ====================

  return {
    // 状态
    tableConfig,
    filterForm,
    showAdvancedFilter,

    // 计算属性 - 从 tableStore
    records: computed(() => tableStore.records),
    pagination: computed(() => tableStore.pagination),
    loading: computed(() => tableStore.loading),
    selectedRowKeys: computed(() => tableStore.selectedRowKeys),
    hasSelection: computed(() => tableStore.hasSelection),
    selectedCount: computed(() => tableStore.selectedCount),

    // 计算属性 - 本地
    tableColumns,
    queryColumns,
    filterColumns,
    pkField,
    tableName,
    displayName,
    mask,
    canCreate,
    canEdit,
    canDelete,
    canQuery,
    canSubmit,
    canUnsubmit,
    canPrint,
    canImport,
    canExport,

    // 方法
    loadTableConfig,
    loadData,
    refresh,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleSelectionChange,
    handleSelectAll,
    handleDelete,
    handleBatchDelete,
    handleExport,
    getFieldDisplayValue
  }
}
