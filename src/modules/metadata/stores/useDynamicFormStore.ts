/**
 * 动态表单数据 - Pinia Store
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../api/metadata'
import type {
  FormData,
  FormMode,
  PageRequest,
  PageResponse
} from '../types'

export const useDynamicFormStore = defineStore('dynamicForm', () => {
  // ==================== 状态 ====================

  // 当前表单数据
  const currentRecord = ref<FormData>({})

  // 表单模式
  const mode = ref<FormMode>('view')

  // 加载状态
  const loading = ref(false)

  // 提交状态
  const submitting = ref(false)

  // 错误信息
  const error = ref<string | null>(null)

  // ==================== Actions ====================

  /**
   * 加载记录数据
   */
  async function loadRecord(tableName: string, id: number) {
    loading.value = true
    error.value = null
    try {
      currentRecord.value = await api.fetchRecord(tableName, id)
      return currentRecord.value
    } catch (err: any) {
      error.value = err.message || '加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建记录
   */
  async function createRecord(tableName: string, data: FormData) {
    submitting.value = true
    error.value = null
    try {
      const result = await api.createRecord(tableName, data)
      currentRecord.value = result
      return result
    } catch (err: any) {
      error.value = err.message || '创建失败'
      throw err
    } finally {
      submitting.value = false
    }
  }

  /**
   * 更新记录
   */
  async function updateRecord(tableName: string, id: number, data: Partial<FormData>) {
    submitting.value = true
    error.value = null
    try {
      const result = await api.updateRecord(tableName, id, data)
      currentRecord.value = result
      return result
    } catch (err: any) {
      error.value = err.message || '更新失败'
      throw err
    } finally {
      submitting.value = false
    }
  }

  /**
   * 删除记录
   */
  async function deleteRecord(tableName: string, id: number) {
    submitting.value = true
    error.value = null
    try {
      await api.deleteRecord(tableName, id)
      currentRecord.value = {}
    } catch (err: any) {
      error.value = err.message || '删除失败'
      throw err
    } finally {
      submitting.value = false
    }
  }

  /**
   * 提交记录
   */
  async function submitRecord(tableName: string, id: number) {
    submitting.value = true
    error.value = null
    try {
      await api.submitRecord(tableName, id)
    } catch (err: any) {
      error.value = err.message || '提交失败'
      throw err
    } finally {
      submitting.value = false
    }
  }

  /**
   * 反提交记录
   */
  async function unsubmitRecord(tableName: string, id: number) {
    submitting.value = true
    error.value = null
    try {
      await api.unsubmitRecord(tableName, id)
    } catch (err: any) {
      error.value = err.message || '反提交失败'
      throw err
    } finally {
      submitting.value = false
    }
  }

  /**
   * 作废记录
   */
  async function voidRecord(tableName: string, id: number) {
    submitting.value = true
    error.value = null
    try {
      await api.voidRecord(tableName, id)
    } catch (err: any) {
      error.value = err.message || '作废失败'
      throw err
    } finally {
      submitting.value = false
    }
  }

  /**
   * 重置表单
   */
  function reset() {
    currentRecord.value = {}
    mode.value = 'view'
    error.value = null
  }

  /**
   * 设置字段值
   */
  function setFieldValue(fieldName: string, value: any) {
    currentRecord.value[fieldName] = value
  }

  /**
   * 获取字段值
   */
  function getFieldValue(fieldName: string) {
    return currentRecord.value[fieldName]
  }

  // ==================== 返回 ====================

  return {
    // 状态
    currentRecord,
    mode,
    loading,
    submitting,
    error,

    // 方法
    loadRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    submitRecord,
    unsubmitRecord,
    voidRecord,
    reset,
    setFieldValue,
    getFieldValue
  }
})
