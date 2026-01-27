/**
 * 外键字段 - Composable
 */

import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import * as api from '../api/metadata'
import type { SysColumn, ForeignKeyOption } from '../types'

// 全局显示值缓存 - 所有组件共享，避免重复请求
const globalDisplayValueCache = new Map<string, string>()

// 全局请求去重 - 防止并发请求相同的数据
const pendingRequests = new Map<string, Promise<string>>()

export function useForeignKey(column: SysColumn) {
  const options = ref<ForeignKeyOption[]>([])
  const loading = ref(false)
  const searchKeyword = ref('')
  const isDropdownMode = ref(true) // 默认为下拉框模式

  // 选项缓存
  const optionsCache = new Map<string, ForeignKeyOption[]>()

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

    const cacheKey = `${params?.search || ''}_${params?.page || 1}`
    if (optionsCache.has(cacheKey)) {
      options.value = optionsCache.get(cacheKey)!
      return
    }

    loading.value = true
    try {
      const refTableId = column.REF_TABLE_ID || (column as any).refTableId
      const refColumnId = column.REF_COLUMN_ID || (column as any).refColumnId

      const result = await api.getForeignKeyOptions({
        tableId: refTableId!,
        columnId: refColumnId,
        search: params?.search || searchKeyword.value,
        page: params?.page || 1,
        pageSize: params?.pageSize || 100
      })

      options.value = result.list
      optionsCache.set(cacheKey, result.list)

      // 设置是否为下拉框模式（默认 Y 表示下拉框）
      isDropdownMode.value = result.isDropdown !== 'N'
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

    // 先从已加载的选项中查找
    const option = options.value.find(opt => opt.value === value)
    if (option) return option.label

    // 检查全局缓存
    const refTableId = column.REF_TABLE_ID || (column as any).refTableId
    const refColumnId = column.REF_COLUMN_ID || (column as any).refColumnId
    const cacheKey = `${refTableId}_${value}_${refColumnId || ''}`

    if (globalDisplayValueCache.has(cacheKey)) {
      console.log('[useForeignKey] 使用缓存的显示值:', cacheKey)
      return globalDisplayValueCache.get(cacheKey)!
    }

    // 检查是否有正在进行的请求（请求去重）
    if (pendingRequests.has(cacheKey)) {
      console.log('[useForeignKey] 等待已有请求:', cacheKey)
      return pendingRequests.get(cacheKey)!
    }

    // 如果没找到,单独请求
    console.log('[useForeignKey] 发起新请求:', cacheKey)
    const requestPromise = api.getForeignKeyDisplayValue(
      refTableId!,
      value,
      refColumnId
    ).then(result => {
      // 缓存结果到全局缓存
      globalDisplayValueCache.set(cacheKey, result)
      // 请求完成，从 pending 中移除
      pendingRequests.delete(cacheKey)
      return result
    }).catch(error => {
      console.error('[useForeignKey] 获取显示值失败:', error)
      // 请求失败，从 pending 中移除
      pendingRequests.delete(cacheKey)
      return String(value)
    })

    // 将请求 Promise 存入 pending
    pendingRequests.set(cacheKey, requestPromise)

    return requestPromise
  }

  return {
    options,
    loading,
    isForeignKey,
    isDropdownMode,
    loadOptions,
    searchOptions,
    getDisplayValue
  }
}
