/**
 * 字段渲染器基础 Composable
 * 提取所有字段渲染器的公共逻辑
 */

import { computed } from 'vue'
import type { SysColumn, FormMode, FieldValue } from '../types'
import {
  getColumnDisplayName,
  shouldEditColumnInMode,
  isSelectColumn,
  isForeignKeyColumn,
  parsePropsSafe,
} from '../types'

export interface UseFieldRendererBaseOptions {
  column: SysColumn
  mode?: FormMode
  disabled?: boolean
  readonly?: boolean
}

export interface UseFieldRendererBaseReturn {
  displayName: string
  placeholder: string
  helpText: string
  isReadonly: boolean
  isDisabled: boolean
  isRequired: boolean
  isSelect: boolean
  isForeignKey: boolean
  validationRules: { required?: boolean; message?: string }[]
  formatValue: (value: FieldValue) => string
  fieldProps: Record<string, any>
  allowClear: boolean
  maxLength?: number
  displayRows?: number
  displayCols?: number
  defaultValue?: any
}

export function useFieldRendererBase({
  column,
  mode = 'view',
  disabled = false,
  readonly = false,
}: UseFieldRendererBaseOptions): UseFieldRendererBaseReturn {
  // 显示名称
  const displayName = computed(() => getColumnDisplayName(column))

  // 解析 PROPS 配置
  const fieldProps = computed(() => {
    const propsStr = column.PROPS || (column as any).props
    return parsePropsSafe(propsStr)
  })

  // 占位符
  const placeholder = computed(() => {
    if (column.PLACEHOLDER || (column as any)?.placeholder) {
      return column.PLACEHOLDER || (column as any)?.placeholder
    }
    const displayType = column.DISPLAY_TYPE || (column as any)?.displayType
    const controlType = displayType || column.CONTROL_TYPE || (column as any)?.controlType
    switch (controlType?.toLowerCase()) {
      case 'select':
      case 'radio':
      case 'cascader':
      case 'treeSelect':
        return displayName.value ? `请选择${displayName.value}` : ''
      case 'date':
        return '请选择日期'
      case 'datetime':
        return '请选择日期时间'
      case 'time':
        return '请选择时间'
      case 'week':
        return '请选择周'
      case 'month':
        return '请选择月份'
      case 'quarter':
        return '请选择季度'
      case 'year':
        return '请选择年份'
      case 'richtext':
        return '请输入内容...'
      case 'email':
        return '请输入邮箱地址'
      case 'url':
        return '请输入URL地址'
      case 'password':
        return '请输入密码'
      case 'telephone':
      case 'phone':
      case 'tel':
        return '请输入电话号码'
      case 'file':
        return '请选择文件'
      case 'image':
        return '请选择图片'
      default:
        return displayName.value ? `请输入${displayName.value}` : ''
    }
  })

  // 帮助文本
  const helpText = computed(() => column.HELP_TEXT || (column as any)?.helpText || '')

  // 是否只读
  const isReadonly = computed(() => {
    if (disabled || readonly || mode === 'view') return true
    if (column.IS_READONLY === 'Y' || (column as any)?.isReadonly === 'Y') return true
    return !shouldEditColumnInMode(column, mode)
  })

  // 是否禁用
  const isDisabled = computed(() => disabled || isReadonly.value)

  // 是否必填
  const isRequired = computed(() => {
    const nullAble = column.NULL_ABLE || (column as any)?.nullAble
    return nullAble === 'N'
  })

  // 是否为选择类型
  const isSelect = computed(() => isSelectColumn(column))

  // 是否为外键类型
  const isForeignKey = computed(() => isForeignKeyColumn(column))

  // 验证规则
  const validationRules = computed(() => {
    const rules: { required?: boolean; message?: string }[] = []
    if (isRequired.value) {
      const errorMsg = column.ERR_MSG || (column as any)?.errMsg
      rules.push({
        required: true,
        message: errorMsg || `${displayName.value}不能为空`,
      })
    }
    return rules
  })

  // 是否允许清除
  const allowClear = computed(() => {
    if (isReadonly.value || isDisabled.value) return false
    const nullAble = column.NULL_ABLE || (column as any)?.nullAble
    // 从 PROPS 中读取 allowClear 配置，默认允许
    const propsAllowClear = fieldProps.value.allowClear
    if (propsAllowClear !== undefined) {
      return propsAllowClear
    }
    return nullAble !== 'N'
  })

  // 最大长度
  const maxLength = computed(() => {
    const colLength = column.COL_LENGTH || (column as any).colLength
    const length = column.LENGTH || (column as any).LENGTH
    return colLength || length || undefined
  })

  // 显示行数
  const displayRows = computed(() => {
    return column.DISPLAY_ROWS || (column as any).displayRows || undefined
  })

  // 显示列数
  const displayCols = computed(() => {
    return column.DISPLAY_COLS || (column as any).displayCols || undefined
  })

  // 默认值
  const defaultValue = computed(() => {
    const defaultVal = column.DEFAULT_VALUE || (column as any).defaultValue
    if (defaultVal === null || defaultVal === undefined || defaultVal === '') {
      return undefined
    }
    return defaultVal
  })

  // 格式化值用于显示
  const formatValue = (value: FieldValue): string => {
    if (value === null || value === undefined || value === '') return '-'

    const displayType = column.DISPLAY_TYPE || (column as any)?.displayType
    const controlType = (displayType || column.CONTROL_TYPE || (column as any).controlType)?.toLowerCase()

    switch (controlType) {
      case 'date':
        try {
          const date = new Date(value as string | number | Date)
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('zh-CN')
          }
        } catch {
          // 忽略错误
        }
        return String(value)
      case 'datetime':
        try {
          const date = new Date(value as string | number | Date)
          if (!isNaN(date.getTime())) {
            return date.toLocaleString('zh-CN')
          }
        } catch {
          // 忽略错误
        }
        return String(value)
      case 'time':
        try {
          const date = new Date(value as string | number | Date)
          if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('zh-CN')
          }
        } catch {
          // 忽略错误
        }
        return String(value)
      case 'number':
        if (column.COL_PRECISION !== undefined || (column as any).DECIMAL_PLACES !== undefined) {
          const precision = column.COL_PRECISION || (column as any).DECIMAL_PLACES || 0
          try {
            const num = Number(value)
            if (!isNaN(num)) {
              return num.toFixed(precision)
            }
          } catch {
            // 忽略错误
          }
        }
        return String(value)
      case 'checkbox':
      case 'switch':
        return value ? '是' : '否'
      case 'json':
        try {
          if (typeof value === 'string') {
            const parsed = JSON.parse(value)
            return JSON.stringify(parsed, null, 2)
          }
          return JSON.stringify(value, null, 2)
        } catch {
          return String(value)
        }
      case 'richtext':
        // 移除 HTML 标签用于纯文本显示
        return String(value).replace(/<[^>]*>/g, '')
      default:
        return String(value)
    }
  }

  return {
    displayName,
    placeholder,
    helpText,
    isReadonly,
    isDisabled,
    isRequired,
    isSelect,
    isForeignKey,
    validationRules,
    formatValue,
    fieldProps,
    allowClear,
    maxLength,
    displayRows,
    displayCols,
    defaultValue,
  }
}
