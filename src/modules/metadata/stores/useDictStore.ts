/**
 * 数据字典 - Pinia Store
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../api/metadata'
import type { SysDict } from '../types'

export const useDictStore = defineStore('dict', () => {
  // ==================== 状态 ====================

  // 字典数据缓存（按 dictTableId 分组）
  const dictCache = ref<Map<number, SysDict[]>>(new Map())

  // 字典树缓存（按 dictTableId 分组）
  const dictTreeCache = ref<Map<number, SysDict[]>>(new Map())

  // 加载状态
  const loading = ref<Map<number, boolean>>(new Map())

  // ==================== Actions ====================

  /**
   * 加载字典列表
   */
  async function loadDictItems(dictTableId: number, force = false): Promise<SysDict[]> {
    // 检查缓存
    if (dictCache.value.has(dictTableId) && !force) {
      return dictCache.value.get(dictTableId)!
    }

    loading.value.set(dictTableId, true)
    try {
      const items = await api.fetchDictItems(dictTableId)
      dictCache.value.set(dictTableId, items)
      return items
    } finally {
      loading.value.set(dictTableId, false)
    }
  }

  /**
   * 加载字典树
   */
  async function loadDictTree(dictTableId: number, force = false): Promise<SysDict[]> {
    // 检查缓存
    if (dictTreeCache.value.has(dictTableId) && !force) {
      return dictTreeCache.value.get(dictTableId)!
    }

    loading.value.set(dictTableId, true)
    try {
      const tree = await api.fetchDictTree(dictTableId)
      dictTreeCache.value.set(dictTableId, tree)
      return tree
    } finally {
      loading.value.set(dictTableId, false)
    }
  }

  /**
   * 根据字典值获取显示文本
   */
  function getDictLabel(dictTableId: number, value: string): string {
    const items = dictCache.value.get(dictTableId)
    if (!items) return value

    const item = items.find(d => d.DICT_VALUE === value)
    return item ? item.DICT_NAME : value
  }

  /**
   * 根据字典值批量获取显示文本
   */
  function getDictLabels(dictTableId: number, values: string[]): string[] {
    return values.map(v => getDictLabel(dictTableId, v))
  }

  /**
   * 转换为 Arco Select 选项格式
   */
  function toSelectOptions(dictTableId: number): Array<{ label: string; value: string }> {
    const items = dictCache.value.get(dictTableId) || []
    return items
      .filter(d => d.IS_ACTIVE === 'Y')
      .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
      .map(d => ({
        label: String(d.DICT_NAME || d.dictName || ''),
        value: String(d.DICT_VALUE || d.dictValue || '')
      }))
  }

  /**
   * 转换为 Arco TreeSelect 选项格式
   */
  function toTreeSelectOptions(dictTableId: number): any[] {
    const tree = dictTreeCache.value.get(dictTableId) || []

    function convertToTreeNode(item: SysDict): any {
      return {
        key: item.ID,
        title: item.DICT_NAME,
        value: item.DICT_VALUE,
        children: tree
          .filter(d => d.PARENT_ID === item.ID && d.IS_ACTIVE === 'Y')
          .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
          .map(convertToTreeNode)
      }
    }

    return tree
      .filter(d => !d.PARENT_ID && d.IS_ACTIVE === 'Y')
      .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
      .map(convertToTreeNode)
  }

  /**
   * 清除缓存
   */
  function clearCache(dictTableId?: number) {
    if (dictTableId !== undefined) {
      dictCache.value.delete(dictTableId)
      dictTreeCache.value.delete(dictTableId)
      loading.value.delete(dictTableId)
    } else {
      dictCache.value.clear()
      dictTreeCache.value.clear()
      loading.value.clear()
    }
  }

  /**
   * 预加载多个字典
   */
  async function preloadDicts(dictTableIds: number[]) {
    await Promise.all(
      dictTableIds.map(id => loadDictItems(id))
    )
  }

  // ==================== 返回 ====================

  return {
    // 状态
    dictCache,
    dictTreeCache,
    loading,

    // 方法
    loadDictItems,
    loadDictTree,
    getDictLabel,
    getDictLabels,
    toSelectOptions,
    toTreeSelectOptions,
    clearCache,
    preloadDicts
  }
})
