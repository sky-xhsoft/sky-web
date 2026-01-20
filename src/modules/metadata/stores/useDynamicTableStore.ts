/**
 * 动态表格数据 - Pinia Store
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api/metadata'
import type {
  FormData,
  PageRequest,
  PageResponse
} from '../types'

export const useDynamicTableStore = defineStore('dynamicTable', () => {
  // ==================== 状态 ====================

  // 数据列表
  const records = ref<FormData[]>([])

  // 分页信息
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 筛选条件
  const filters = ref<Record<string, any>>({})

  // 排序条件
  const sorter = ref<{ field: string; order: 'asc' | 'desc' } | null>(null)

  // 选中的行
  const selectedRowKeys = ref<(string | number)[]>([])

  // 加载状态
  const loading = ref(false)

  // 错误信息
  const error = ref<string | null>(null)

  // ==================== 计算属性 ====================

  /**
   * 是否有选中项
   */
  const hasSelection = computed(() => selectedRowKeys.value.length > 0)

  /**
   * 选中项数量
   */
  const selectedCount = computed(() => selectedRowKeys.value.length)

  // ==================== Actions ====================

  /**
   * 加载数据列表
   */
  async function loadRecords(tableName: string, params?: Partial<PageRequest>) {
    loading.value = true
    error.value = null
    try {
      console.log('[useDynamicTableStore] loadRecords 被调用')
      console.log('  tableName=', tableName)
      console.log('  filters.value=', JSON.stringify(filters.value))
      console.log('  params=', JSON.stringify(params))

      const requestParams = {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...filters.value,
        ...params
      }
      console.log('  最终请求参数=', JSON.stringify(requestParams))

      const result = await api.fetchRecords(tableName, requestParams)

      records.value = result.list
      pagination.value = {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      }

      return result
    } catch (err: any) {
      error.value = err.message || '加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新列表
   */
  async function refresh(tableName: string) {
    return await loadRecords(tableName)
  }

  /**
   * 切换页码
   */
  async function changePage(tableName: string, page: number) {
    pagination.value.page = page
    return await loadRecords(tableName)
  }

  /**
   * 切换每页条数
   */
  async function changePageSize(tableName: string, pageSize: number) {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
    return await loadRecords(tableName)
  }

  /**
   * 更新筛选条件
   */
  async function updateFilters(tableName: string, newFilters: Record<string, any>) {
    filters.value = { ...newFilters }
    pagination.value.page = 1
    return await loadRecords(tableName)
  }

  /**
   * 重置筛选条件
   */
  async function resetFilters(tableName: string) {
    filters.value = {}
    pagination.value.page = 1
    return await loadRecords(tableName)
  }

  /**
   * 更新排序
   */
  async function updateSorter(
    tableName: string,
    field: string,
    order: 'asc' | 'desc' | null
  ) {
    if (order === null) {
      sorter.value = null
    } else {
      sorter.value = { field, order }
    }
    pagination.value.page = 1
    return await loadRecords(tableName)
  }

  /**
   * 选中行
   */
  function selectRows(keys: (string | number)[]) {
    selectedRowKeys.value = keys
  }

  /**
   * 全选/取消全选
   */
  function toggleSelectAll(pkField: string) {
    if (selectedRowKeys.value.length === records.value.length) {
      // 取消全选
      selectedRowKeys.value = []
    } else {
      // 全选
      selectedRowKeys.value = records.value.map(r => r[pkField] as string | number)
    }
  }

  /**
   * 清除选中
   */
  function clearSelection() {
    selectedRowKeys.value = []
  }

  /**
   * 获取选中的记录
   */
  function getSelectedRecords(pkField: string): FormData[] {
    return records.value.filter(r =>
      selectedRowKeys.value.includes(r[pkField] as string | number)
    )
  }

  /**
   * 批量删除
   */
  async function batchDelete(tableName: string, ids: number[]) {
    loading.value = true
    error.value = null
    try {
      await api.batchDeleteRecords(tableName, ids)
      // 刷新列表
      await loadRecords(tableName)
      // 清除选中
      clearSelection()
    } catch (err: any) {
      error.value = err.message || '批量删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除单条记录
   */
  async function deleteRecord(tableName: string, id: number) {
    loading.value = true
    error.value = null
    try {
      await api.deleteRecord(tableName, id)
      // 刷新列表
      await loadRecords(tableName)
    } catch (err: any) {
      error.value = err.message || '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    records.value = []
    pagination.value = {
      page: 1,
      pageSize: 20,
      total: 0
    }
    filters.value = {}
    sorter.value = null
    selectedRowKeys.value = []
    error.value = null
  }

  // ==================== 返回 ====================

  return {
    // 状态
    records,
    pagination,
    filters,
    sorter,
    selectedRowKeys,
    loading,
    error,

    // 计算属性
    hasSelection,
    selectedCount,

    // 方法
    loadRecords,
    refresh,
    changePage,
    changePageSize,
    updateFilters,
    resetFilters,
    updateSorter,
    selectRows,
    toggleSelectAll,
    clearSelection,
    getSelectedRecords,
    batchDelete,
    deleteRecord,
    reset
  }
})
