/**
 * 外键字段 - Composable
 */

import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import * as api from '../api/metadata'
import type { SysColumn, ForeignKeyOption } from '../types'

export function useForeignKey(column: SysColumn) {
  const options = ref<ForeignKeyOption[]>([])
  const loading = ref(false)
  const searchKeyword = ref('')

  // 选项缓存
  const optionsCache = new Map<string, ForeignKeyOption[]>()

  /**
   * 是否为外键字段
   */
  const isForeignKey = computed(() => {
    return column.SET_VALUE_TYPE === 'fk' && column.REF_TABLE_ID
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
      const result = await api.getForeignKeyOptions({
        tableId: column.REF_TABLE_ID!,
        columnId: column.REF_COLUMN_ID,
        search: params?.search || searchKeyword.value,
        page: params?.page || 1,
        pageSize: params?.pageSize || 100
      })

      options.value = result.list
      optionsCache.set(cacheKey, result.list)
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

    // 如果没找到，单独请求
    try {
      const result = await api.getForeignKeyDisplayValue(
        column.REF_TABLE_ID!,
        value,
        column.REF_COLUMN_ID
      )
      return result
    } catch (error) {
      console.error('[useForeignKey] 获取显示值失败:', error)
      return String(value)
    }
  }

  return {
    options,
    loading,
    isForeignKey,
    loadOptions,
    searchOptions,
    getDisplayValue
  }
}
