/**
 * 外键字段 - Composable
 */

import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import * as api from '../api/metadata'
import { useForeignKeyCache } from './useForeignKeyCache'
import type { SysColumn, ForeignKeyOption } from '../types'

export function useForeignKey(column: SysColumn) {
  const options = ref<ForeignKeyOption[]>([])
  const loading = ref(false)
  const searchKeyword = ref('')

  const cache = useForeignKeyCache()

  /**
   * 是否为外键字段
   */
  const isForeignKey = computed(() => {
    const setValueType = column.SET_VALUE_TYPE || (column as any).setValueType
    const refTableId = column.REF_TABLE_ID || (column as any).refTableId
    return setValueType === 'fk' && refTableId
  })

  /**
   * 加载选项列表
   */
  async function loadOptions(params?: {
    search?: string
    page?: number
    pageSize?: number
  }) {
    if (!isForeignKey.value) return

    const search = params?.search || ''
    const page = params?.page || 1
    const cacheKey = `${search}_${page}`
    const cached = cache.getOptions(cacheKey)
    if (cached) {
      options.value = cached as ForeignKeyOption[]
      return
    }

    loading.value = true
    try {
      const refTableId = column.REF_TABLE_ID || (column as any).refTableId
      const refColumnId = column.REF_COLUMN_ID || (column as any).refColumnId

      const result = await api.getForeignKeyOptions({
        tableId: refTableId!,
        columnId: refColumnId,
        search: search,
        page: page,
        pageSize: params?.pageSize || 100,
      })

      const safeList = (result.list || []).map((item: any) => ({
        ...item,
        label: String(item.label ?? ''),
      }))
      options.value = safeList
      cache.setOptions(cacheKey, safeList)
    } catch (error: any) {
      Message.error(error.message || '加载选项失败')
      console.error('[useForeignKey] 加载选项失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索选项
   */
  async function searchOptions(keyword: string) {
    searchKeyword.value = keyword
    await loadOptions({ search: keyword })
  }

  /**
   * 根据值获取显示文本
   */
  async function getDisplayValue(value: number | string): Promise<string> {
    if (!value) return ''

    const option = options.value.find((opt) => opt.value === value)
    if (option) return String(option.label)

    const refTableId = column.REF_TABLE_ID || (column as any).refTableId
    const refColumnId = column.REF_COLUMN_ID || (column as any).refColumnId

    // 检查缓存
    const cached = cache.getDisplayValue(refTableId!, value, refColumnId)
    if (cached) return cached

    // 请求去重
    const cacheKey = `${refTableId}_${value}_${refColumnId}`
    const pending = cache.getPendingRequest(cacheKey)
    if (pending) return pending

    const requestPromise = api
      .getForeignKeyDisplayValue(refTableId!, value, refColumnId)
      .then((result) => {
        cache.setDisplayValue(refTableId!, value, result, refColumnId)
        cache.removePendingRequest(cacheKey)
        return result
      })
      .catch((error) => {
        console.error('[useForeignKey] 获取显示值失败:', error)
        cache.removePendingRequest(cacheKey)
        return String(value)
      })

    cache.setPendingRequest(cacheKey, requestPromise)
    return requestPromise
  }

  return {
    options,
    loading,
    isForeignKey,
    loadOptions,
    searchOptions,
    getDisplayValue,
  }
}
