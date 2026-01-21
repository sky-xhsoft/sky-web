/**
 * 动态表单 - Composable
 * 用于管理动态表单的数据加载、验证、提交等逻辑
 */

import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useMetadataStore } from '../stores/useMetadataStore'
import { useDynamicFormStore } from '../stores/useDynamicFormStore'
import type {
  FormMode,
  FormData,
  SysColumn,
  TableConfig,
  ValidationRule
} from '../types'

export function useDynamicForm(tableId: number, mode: FormMode = 'view') {
  const metadataStore = useMetadataStore()
  const formStore = useDynamicFormStore()

  // ==================== 状态 ====================

  const loading = ref(false)
  const submitting = ref(false)
  const tableConfig = ref<TableConfig | null>(null)
  const formData = ref<FormData>({})
  const originalData = ref<FormData>({})  // 保存原始数据，用于对比变更
  const errors = ref<Record<string, string>>({})

  // ==================== 计算属性 ====================

  /**
   * 表单字段列表（可见且激活）
   */
  const formColumns = computed(() => {
    if (!tableConfig.value) return []
    return tableConfig.value.columns
      .filter(c => {
        // 兼容 IS_ACTIVE 和 isActive
        const isActive = c.IS_ACTIVE || (c as any).isActive
        if (isActive !== undefined && isActive !== 'Y') {
          return false
        }

        // 根据 MASK 和模式过滤字段
        const mask = c.MASK || (c as any).mask
        if (mask && mask.length >= 4) {
          // MASK 位说明：
          // 位 1 (索引 0): 新增可见
          // 位 2 (索引 1): 新增可编辑
          // 位 3 (索引 2): 修改可见
          // 位 4 (索引 3): 修改可编辑

          if (mode === 'create') {
            // 新增模式：检查第 1 位（索引 0）
            if (mask[0] !== '1') {
              return false
            }
          } else if (mode === 'edit') {
            // 修改模式：检查第 3 位（索引 2）
            if (mask[2] !== '1') {
              return false
            }
          }
        }

        return true
      })
      .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
  })

  /**
   * 必填字段列表
   */
  const requiredFields = computed(() => {
    return formColumns.value
      .filter(c => c.NULL_ABLE === 'N')
      .map(c => c.DB_NAME)
  })

  /**
   * 是否只读模式
   */
  const isReadonly = computed(() => mode === 'view')

  /**
   * 是否可以保存
   */
  const canSave = computed(() => {
    if (mode === 'view') return false
    if (!tableConfig.value) return false

    const mask = tableConfig.value.table.MASK || ''
    if (mode === 'create') return mask.includes('A')
    if (mode === 'edit') return mask.includes('M')
    return false
  })

  /**
   * 表单是否有错误
   */
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)

  // ==================== 方法 ====================

  /**
   * 加载表单配置
   */
  async function loadTableConfig() {
    loading.value = true
    try {
      tableConfig.value = await metadataStore.loadTableConfig(tableId)

      // 初始化表单数据
      initFormData()

      return tableConfig.value
    } catch (error: any) {
      Message.error(error.message || '加载表单配置失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 初始化表单数据
   */
  function initFormData() {
    if (!tableConfig.value) return

    const data: FormData = {}

    // 设置默认值
    formColumns.value.forEach(column => {
      if (column.DEFAULT_VALUE) {
        data[column.DB_NAME] = column.DEFAULT_VALUE
      } else {
        data[column.DB_NAME] = null
      }
    })

    formData.value = data
  }

  /**
   * 加载记录数据
   */
  async function loadRecordData(recordId: number) {
    if (!tableConfig.value) {
      await loadTableConfig()
    }

    loading.value = true
    try {
      const tableName = tableConfig.value!.table.TABLE_NAME || tableConfig.value!.table.NAME
      const record = await formStore.loadRecord(tableName, recordId)

      // 保存原始数据（深拷贝）
      originalData.value = JSON.parse(JSON.stringify(record))

      // 设置表单数据
      formData.value = { ...record }

      return record
    } catch (error: any) {
      Message.error(error.message || '加载数据失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 验证单个字段
   */
  function validateField(column: SysColumn, value: any): string | null {
    // 兼容大小写字段名
    const nullAble = column.NULL_ABLE || (column as any).nullAble
    const displayName = column.DISPLAY_NAME || (column as any).displayName || column.DB_NAME
    const errorMsg = column.ERROR_MSG || (column as any).errorMsg
    const regExpression = column.REG_EXPRESSION || (column as any).regExpression
    const length = column.LENGTH || (column as any).length
    const colType = column.COL_TYPE || (column as any).colType
    const colLength = column.COL_LENGTH || (column as any).colLength

    // 必填验证
    if (nullAble === 'N') {
      if (value === null || value === undefined || value === '') {
        return errorMsg || `${displayName}不能为空`
      }
    }

    // 如果值为空且非必填，跳过后续验证
    if (value === null || value === undefined || value === '') {
      return null
    }

    // 数据类型验证
    const typeError = validateDataType(colType, value, displayName, colLength)
    if (typeError) return typeError

    // 正则表达式验证
    if (regExpression && value) {
      try {
        const regex = new RegExp(regExpression)
        if (!regex.test(String(value))) {
          return errorMsg || `${displayName}格式不正确`
        }
      } catch (error) {
        console.error('Invalid regex:', regExpression)
      }
    }

    // 长度验证
    if (length && value) {
      const strValue = String(value)
      if (strValue.length > length) {
        return `${displayName}长度不能超过${length}个字符`
      }
    }

    return null
  }

  /**
   * 验证数据类型
   */
  function validateDataType(colType: string, value: any, displayName: string, colLength?: number): string | null {
    if (!colType) return null

    const type = colType.toLowerCase()

    // 整数类型
    if (type === 'int' || type === 'integer' || type === 'bigint' || type === 'tinyint' || type === 'smallint') {
      const num = Number(value)
      if (isNaN(num) || !Number.isInteger(num)) {
        return `${displayName}必须是整数`
      }
      // 检查范围
      if (type === 'tinyint' && (num < -128 || num > 127)) {
        return `${displayName}超出范围（-128 到 127）`
      }
      if (type === 'smallint' && (num < -32768 || num > 32767)) {
        return `${displayName}超出范围（-32768 到 32767）`
      }
      if (type === 'int' && (num < -2147483648 || num > 2147483647)) {
        return `${displayName}超出范围（-2147483648 到 2147483647）`
      }
    }

    // 浮点数类型
    if (type === 'float' || type === 'double' || type === 'decimal' || type === 'numeric') {
      const num = Number(value)
      if (isNaN(num)) {
        return `${displayName}必须是数字`
      }
    }

    // 日期类型
    if (type === 'date' || type === 'datetime' || type === 'timestamp') {
      const dateValue = value instanceof Date ? value : new Date(value)
      if (isNaN(dateValue.getTime())) {
        return `${displayName}日期格式不正确`
      }
    }

    // 字符串长度（varchar/char）
    if ((type === 'varchar' || type === 'char') && colLength) {
      const strValue = String(value)
      if (strValue.length > colLength) {
        return `${displayName}长度不能超过${colLength}个字符`
      }
    }

    return null
  }

  /**
   * 验证整个表单
   */
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    formColumns.value.forEach(column => {
      const value = formData.value[column.DB_NAME]
      const error = validateField(column, value)
      if (error) {
        newErrors[column.DB_NAME] = error
      }
    })

    errors.value = newErrors
    return Object.keys(newErrors).length === 0
  }

  /**
   * 清除字段错误
   */
  function clearFieldError(fieldName: string) {
    delete errors.value[fieldName]
  }

  /**
   * 清除所有错误
   */
  function clearErrors() {
    errors.value = {}
  }

  /**
   * 设置字段值
   */
  function setFieldValue(fieldName: string, value: any) {
    formData.value[fieldName] = value
    // 清除该字段的错误
    clearFieldError(fieldName)
  }

  /**
   * 获取字段值
   */
  function getFieldValue(fieldName: string) {
    return formData.value[fieldName]
  }

  /**
   * 提交表单
   */
  async function submitForm() {
    // 验证表单
    if (!validateForm()) {
      Message.error('请检查表单填写')
      return
    }

    if (!tableConfig.value) {
      Message.error('表单配置未加载')
      return
    }

    submitting.value = true
    try {
      const tableName = tableConfig.value.table.TABLE_NAME || tableConfig.value.table.NAME
      const pkField = tableConfig.value.table.PK || 'ID'

      let result: FormData

      if (mode === 'create') {
        // 创建记录
        result = await formStore.createRecord(tableName, formData.value)
        Message.success('创建成功')
      } else if (mode === 'edit') {
        // 更新记录
        const recordId = formData.value[pkField] as number
        result = await formStore.updateRecord(tableName, recordId, formData.value)
        Message.success('更新成功')
      } else {
        throw new Error('当前模式不支持保存')
      }

      formData.value = { ...result }
      return result
    } catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    } finally {
      submitting.value = false
    }
  }

  /**
   * 重置表单
   */
  function resetForm() {
    initFormData()
    clearErrors()
  }

  /**
   * 检查字段是否应该显示（级联显示逻辑）
   */
  function shouldShowField(column: SysColumn): boolean {
    // 如果没有配置显示控制，默认显示
    if (!column.SHOW_COLUMN_ID || !column.SHOW_COLUMN_VALUE) {
      return true
    }

    // 查找控制字段
    const controlColumn = formColumns.value.find(c => c.ID === column.SHOW_COLUMN_ID)
    if (!controlColumn) {
      return true
    }

    // 获取控制字段的值
    const controlValue = formData.value[controlColumn.DB_NAME]

    // 比较值（支持多个值，用逗号分隔）
    const expectedValues = column.SHOW_COLUMN_VALUE.split(',').map(v => v.trim())
    return expectedValues.includes(String(controlValue))
  }

  /**
   * 检查字段是否只读
   */
  function isFieldReadonly(column: SysColumn): boolean {
    // 查看模式下所有字段都只读
    if (isReadonly.value) return true

    // 字段本身配置为只读
    if (column.IS_READONLY === 'Y') return true

    // 根据 MASK 检查是否可编辑
    const mask = column.MASK || (column as any).mask
    if (mask && mask.length >= 4) {
      // MASK 位说明：
      // 位 2 (索引 1): 新增可编辑
      // 位 4 (索引 3): 修改可编辑

      if (mode === 'create') {
        // 新增模式：检查第 2 位（索引 1）
        if (mask[1] !== '1') {
          return true  // 不可编辑 = 只读
        }
      } else if (mode === 'edit') {
        // 修改模式：检查第 4 位（索引 3）
        if (mask[3] !== '1') {
          return true  // 不可编辑 = 只读
        }
      }
    }

    return false
  }

  /**
   * 获取字段的验证规则（Arco Design 格式）
   */
  function getFieldRules(column: SysColumn): ValidationRule[] {
    const rules: ValidationRule[] = []

    // 必填规则
    if (column.NULL_ABLE === 'N') {
      rules.push({
        required: true,
        message: column.ERROR_MSG || `${column.DISPLAY_NAME}不能为空`
      })
    }

    // 正则规则
    if (column.REG_EXPRESSION) {
      try {
        const regex = new RegExp(column.REG_EXPRESSION)
        rules.push({
          pattern: regex,
          message: column.ERROR_MSG || `${column.DISPLAY_NAME}格式不正确`
        })
      } catch (error) {
        console.error('Invalid regex:', column.REG_EXPRESSION)
      }
    }

    return rules
  }

  /**
   * 获取变更的字段（只返回修改过的字段）
   */
  function getChangedFields(): FormData {
    const changedFields: FormData = {}

    // 遍历当前表单数据
    for (const key in formData.value) {
      const currentValue = formData.value[key]
      const originalValue = originalData.value[key]

      // 比较值是否变化
      if (!isEqual(currentValue, originalValue)) {
        changedFields[key] = currentValue
      }
    }

    console.log('[useDynamicForm] 检测到变更的字段：', Object.keys(changedFields))
    return changedFields
  }

  /**
   * 深度比较两个值是否相等
   */
  function isEqual(value1: any, value2: any): boolean {
    // 处理 null 和 undefined
    if (value1 === value2) return true
    if (value1 == null && value2 == null) return true
    if (value1 == null || value2 == null) return false

    // 处理日期对象
    if (value1 instanceof Date && value2 instanceof Date) {
      return value1.getTime() === value2.getTime()
    }

    // 处理数组
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) return false
      return value1.every((item, index) => isEqual(item, value2[index]))
    }

    // 处理对象
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const keys1 = Object.keys(value1)
      const keys2 = Object.keys(value2)
      if (keys1.length !== keys2.length) return false
      return keys1.every(key => isEqual(value1[key], value2[key]))
    }

    // 基本类型比较
    return value1 === value2
  }

  // ==================== 监听 ====================

  // 监听字段变化，自动验证
  watch(
    () => formData.value,
    () => {
      if (hasErrors.value) {
        // 如果有错误，在用户修改时实时验证
        validateForm()
      }
    },
    { deep: true }
  )

  // ==================== 返回 ====================

  return {
    // 状态
    loading,
    submitting,
    tableConfig,
    formData,
    errors,

    // 计算属性
    formColumns,
    requiredFields,
    isReadonly,
    canSave,
    hasErrors,

    // 方法
    loadTableConfig,
    loadRecordData,
    validateField,
    validateForm,
    clearFieldError,
    clearErrors,
    setFieldValue,
    getFieldValue,
    getChangedFields,
    submitForm,
    resetForm,
    shouldShowField,
    isFieldReadonly,
    getFieldRules
  }
}
