/**
 * 云盘排序 Composable
 *
 * 封装文件排序逻辑
 */

import { computed } from 'vue'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import type { FileSortBy, SortOrder } from '@/modules/cloud/types'

/**
 * 排序选项配置
 */
export interface SortOption {
  value: FileSortBy
  label: string
  icon?: string
}

/**
 * 云盘排序功能
 */
export function useCloudSort() {
  const store = useCloudStore()

  // 排序字段和方向
  const sortBy = computed({
    get: () => store.sortBy,
    set: (value) => store.setSortBy(value),
  })

  const sortOrder = computed({
    get: () => store.sortOrder,
    set: (value) => {
      if (value !== store.sortOrder) {
        store.toggleSortOrder()
      }
    },
  })

  /**
   * 排序选项列表
   */
  const sortOptions: SortOption[] = [
    { value: 'name', label: '名称', icon: '📝' },
    { value: 'size', label: '大小', icon: '📦' },
    { value: 'date', label: '日期', icon: '📅' },
  ]

  /**
   * 设置排序方式
   * @param sort 排序字段
   */
  function setSortBy(sort: FileSortBy) {
    store.setSortBy(sort)
  }

  /**
   * 切换排序方向
   */
  function toggleSortOrder() {
    store.toggleSortOrder()
  }

  /**
   * 设置排序方向
   * @param order 排序方向
   */
  function setSortOrder(order: SortOrder) {
    if (order !== store.sortOrder) {
      store.toggleSortOrder()
    }
  }

  /**
   * 设置排序（字段 + 方向）
   * @param sort 排序字段
   * @param order 排序方向
   */
  function setSort(sort: FileSortBy, order: SortOrder) {
    store.setSortBy(sort)
    if (order !== store.sortOrder) {
      store.toggleSortOrder()
    }
  }

  /**
   * 重置排序（回到默认：按名称升序）
   */
  function resetSort() {
    store.setSortBy('name')
    if (store.sortOrder !== 'asc') {
      store.toggleSortOrder()
    }
  }

  /**
   * 获取当前排序选项
   */
  const currentSortOption = computed(() => {
    return sortOptions.find((opt) => opt.value === sortBy.value) || sortOptions[0]
  })

  /**
   * 获取排序方向图标
   */
  const sortOrderIcon = computed(() => {
    return sortOrder.value === 'asc' ? '↑' : '↓'
  })

  /**
   * 获取排序方向文本
   */
  const sortOrderText = computed(() => {
    return sortOrder.value === 'asc' ? '升序' : '降序'
  })

  /**
   * 生成排序描述文本
   */
  const sortDescription = computed(() => {
    const option = currentSortOption.value
    return `按${option.label}${sortOrderText.value}`
  })

  /**
   * 判断是否为默认排序
   */
  const isDefaultSort = computed(() => {
    return sortBy.value === 'name' && sortOrder.value === 'asc'
  })

  /**
   * 按名称排序（快捷方法）
   */
  function sortByName(order: SortOrder = 'asc') {
    setSort('name', order)
  }

  /**
   * 按大小排序（快捷方法）
   */
  function sortBySize(order: SortOrder = 'asc') {
    setSort('size', order)
  }

  /**
   * 按日期排序（快捷方法）
   */
  function sortByDate(order: SortOrder = 'desc') {
    setSort('date', order)
  }

  /**
   * 智能排序切换（点击当前排序字段时切换方向）
   * @param sort 排序字段
   */
  function smartToggle(sort: FileSortBy) {
    if (sortBy.value === sort) {
      // 如果是当前字段，切换方向
      toggleSortOrder()
    } else {
      // 如果是新字段，设置为该字段并使用默认方向
      setSortBy(sort)
      // 日期默认降序（最新在前），其他升序
      if (sort === 'date' && sortOrder.value !== 'desc') {
        toggleSortOrder()
      } else if (sort !== 'date' && sortOrder.value !== 'asc') {
        toggleSortOrder()
      }
    }
  }

  /**
   * 获取排序后的文件列表
   */
  const sortedFiles = computed(() => store.filteredAndSortedFiles)

  return {
    // 排序操作
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    setSort,
    resetSort,
    smartToggle,

    // 快捷排序
    sortByName,
    sortBySize,
    sortByDate,

    // 排序状态（响应式）
    sortBy,
    sortOrder,
    sortOptions,

    // 计算属性
    currentSortOption,
    sortOrderIcon,
    sortOrderText,
    sortDescription,
    isDefaultSort,
    sortedFiles,
  }
}

export default useCloudSort
