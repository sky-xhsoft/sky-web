/**
 * 动态表格数据 - Pinia Store (按表隔离版本)
 */
import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import * as api from '../api/metadata'
import type {
  FormData,
  PageRequest
} from '../types'

interface TableState {
  records: FormData[]
  pagination: { page: number; pageSize: number; total: number }
  filters: Record<string, any>
  sorters: Array<{ field: string; order: 'asc' | 'desc' }>
  selectedRowKeys: (string | number)[]
  loading: boolean
  error: string | null
}

function newTableState(): TableState {
  return {
    records: [],
    pagination: { page: 1, pageSize: 15, total: 0 },
    filters: {},
    sorters: [],
    selectedRowKeys: [],
    loading: false,
    error: null,
  }
}

export const useDynamicTableStore = defineStore('dynamicTable', () => {
  const tables = reactive<Record<string, TableState>>({})

  function getState(tableName: string): TableState {
    if (!tables[tableName]) {
      tables[tableName] = newTableState()
    }
    return tables[tableName]
  }

  async function loadRecords(tableName: string, params?: Partial<PageRequest>) {
    const st = getState(tableName)
    st.loading = true
    st.error = null
    try {
      const sortParams: Record<string, any> = {}
      if (st.sorters.length > 0) {
        sortParams.orderBy = st.sorters.map(s => s.field).join(',')
        sortParams.order = st.sorters.map(s => s.order).join(',')
      }
      const requestParams = {
        page: st.pagination.page,
        pageSize: st.pagination.pageSize,
        ...st.filters,
        ...sortParams,
        ...params
      }
      const result = await api.fetchRecords(tableName, requestParams)
      st.records = result.list
      st.pagination = { page: result.page, pageSize: result.pageSize, total: result.total }
      return result
    } catch (err: any) {
      st.error = err.message || '加载失败'
      throw err
    } finally {
      st.loading = false
    }
  }

  async function refresh(tableName: string) { return loadRecords(tableName) }
  async function changePage(tableName: string, page: number) {
    getState(tableName).pagination.page = page
    return loadRecords(tableName)
  }
  async function changePageSize(tableName: string, pageSize: number) {
    const st = getState(tableName)
    st.pagination.pageSize = pageSize
    st.pagination.page = 1
    return loadRecords(tableName)
  }
  async function updateFilters(tableName: string, newFilters: Record<string, any>) {
    const st = getState(tableName)
    st.filters = {}
    for (const key in newFilters) {
      const val = newFilters[key]
      if (val !== '' && val !== null && val !== undefined) {
        st.filters[key] = val
      }
    }
    st.pagination.page = 1
    return loadRecords(tableName)
  }
  async function resetFilters(tableName: string) {
    const st = getState(tableName)
    st.filters = {}
    st.pagination.page = 1
    return loadRecords(tableName)
  }
  async function updateSorters(tableName: string, newSorters: Array<{ field: string; direction: 'ascend' | 'descend' }>) {
    const st = getState(tableName)
    st.sorters = newSorters.map(s => ({ field: s.field, order: s.direction === 'ascend' ? 'asc' : 'desc' as const }))
    st.pagination.page = 1
    return loadRecords(tableName)
  }
  async function updateSorter(tableName: string, field: string, order: 'asc' | 'desc' | null) {
    const st = getState(tableName)
    st.sorters = order ? [{ field, order }] : []
    st.pagination.page = 1
    return loadRecords(tableName)
  }

  function selectRows(tableName: string, keys: (string | number)[]) {
    getState(tableName).selectedRowKeys = keys
  }
  function toggleSelectAll(tableName: string, pkField: string) {
    const st = getState(tableName)
    st.selectedRowKeys = st.selectedRowKeys.length === st.records.length
      ? []
      : st.records.map(r => {
          const key = r[pkField] ?? r['ID'] ?? r['id'] ?? r['Id']
          return key as string | number
        })
  }
  function clearSelection(tableName: string) {
    getState(tableName).selectedRowKeys = []
  }
  function getSelectedRecords(tableName: string, pkField: string): FormData[] {
    const st = getState(tableName)
    return st.records.filter(r => st.selectedRowKeys.includes(r[pkField] as string | number))
  }
  const defaultState = computed(() => {
    const firstTableName = Object.keys(tables)[0] || '__default__'
    return getState(firstTableName)
  })
  const records = computed(() => defaultState.value.records)
  const pagination = computed(() => defaultState.value.pagination)
  const filters = computed(() => defaultState.value.filters)
  function getRecords(tableName: string) { return computed(() => getState(tableName).records) }
  function getPagination(tableName: string) { return computed(() => getState(tableName).pagination) }
  function getFilters(tableName: string) { return computed(() => getState(tableName).filters) }
  function getSorters(tableName: string) { return computed(() => getState(tableName).sorters) }
  function getSelectedRowKeys(tableName: string) { return computed(() => getState(tableName).selectedRowKeys) }
  function getLoading(tableName: string) { return computed(() => getState(tableName).loading) }
  function getHasSelection(tableName: string) { return computed(() => getState(tableName).selectedRowKeys.length > 0) }
  function getSelectedCount(tableName: string) { return computed(() => getState(tableName).selectedRowKeys.length) }

  async function batchDelete(tableName: string, ids: number[]) {
    const st = getState(tableName)
    st.loading = true
    try {
      await api.batchDeleteRecords(tableName, ids)
      await loadRecords(tableName)
      st.selectedRowKeys = []
    } catch (err: any) {
      st.error = err.message || '批量删除失败'
      throw err
    } finally { st.loading = false }
  }
  async function deleteRecord(tableName: string, id: number) {
    const st = getState(tableName)
    st.loading = true
    try {
      await api.deleteRecord(tableName, id)
      await loadRecords(tableName)
    } catch (err: any) {
      st.error = err.message || '删除失败'
      throw err
    } finally { st.loading = false }
  }

  function reset(tableName?: string) {
    if (tableName) {
      tables[tableName] = newTableState()
    } else {
      Object.keys(tables).forEach(k => { tables[k] = newTableState() })
    }
  }

  return {
    tables,
    records,
    pagination,
    filters,
    loadRecords, refresh, changePage, changePageSize,
    updateFilters, resetFilters, updateSorter, updateSorters,
    selectRows, toggleSelectAll, clearSelection, getSelectedRecords,
    getRecords, getPagination, getFilters, getSorters,
    getSelectedRowKeys, getLoading, getHasSelection, getSelectedCount,
    batchDelete, deleteRecord, reset
  }
})
