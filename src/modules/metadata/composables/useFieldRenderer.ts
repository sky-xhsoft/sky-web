/**
 * 字段渲染器 - Composable
 * 用于根据字段配置动态选择合适的渲染组件
 */

import { computed } from 'vue'
import type { Component } from 'vue'
import type { SysColumn, FormMode } from '../types'

// 字段类型到组件的映射
const FIELD_COMPONENT_MAP: Record<string, string> = {
  text: 'TextField',
  textarea: 'TextareaField',
  number: 'NumberField',
  select: 'SelectField',
  radio: 'RadioField',
  checkbox: 'CheckboxField',
  date: 'DateField',
  datetime: 'DatetimeField',
  file: 'FileField',
  image: 'ImageField',
  foreign_key: 'ForeignKeyField',
  password: 'PasswordField',
  email: 'EmailField',
  url: 'UrlField'
}

export function useFieldRenderer(column: SysColumn, mode: FormMode = 'view') {
  /**
   * 获取字段渲染组件名称
   */
  const componentName = computed(() => {
    // 特殊处理：系统时间字段
    const timeFields = ['CREATE_TIME', 'UPDATE_TIME', 'CREATED_AT', 'UPDATED_AT']
    if (timeFields.includes(column.DB_NAME)) {
      return 'DatetimeField'
    }

    return FIELD_COMPONENT_MAP[column.CONTROL_TYPE] || 'TextField'
  })

  /**
   * 是否为只读模式
   */
  const isReadonly = computed(() => {
    // 查看模式下所有字段都只读
    if (mode === 'view') return true

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
  })

  /**
   * 是否为必填字段
   */
  const isRequired = computed(() => {
    // 兼容大写 NULL_ABLE 和小写 nullAble
    const nullAble = column.NULL_ABLE || (column as any).nullAble
    return nullAble === 'N'
  })

  /**
   * 获取字段占位符
   */
  const placeholder = computed(() => {
    if (column.PLACEHOLDER) {
      return column.PLACEHOLDER
    }

    // 根据控件类型生成默认占位符
    switch (column.CONTROL_TYPE) {
      case 'text':
      case 'textarea':
      case 'number':
      case 'password':
      case 'email':
      case 'url':
        return `请输入${column.DISPLAY_NAME}`
      case 'select':
      case 'radio':
        return `请选择${column.DISPLAY_NAME}`
      case 'date':
        return '请选择日期'
      case 'datetime':
        return '请选择日期时间'
      case 'file':
      case 'image':
        return '点击上传'
      default:
        return `请输入${column.DISPLAY_NAME}`
    }
  })

  /**
   * 获取字段帮助文本
   */
  const helpText = computed(() => {
    return column.HELP_TEXT || ''
  })

  /**
   * 获取表单项 label 配置
   */
  const labelConfig = computed(() => {
    return {
      label: column.DISPLAY_NAME,
      required: isRequired.value,
      tooltip: helpText.value || undefined
    }
  })

  /**
   * 获取输入组件的 props
   */
  const inputProps = computed(() => {
    const props: Record<string, any> = {
      placeholder: placeholder.value,
      disabled: isReadonly.value
    }

    // 根据控件类型添加特定属性
    switch (column.CONTROL_TYPE) {
      case 'number':
        if (column.DECIMAL_PLACES !== undefined) {
          props.precision = column.DECIMAL_PLACES
        }
        break

      case 'textarea':
        props.rows = 4
        if (column.LENGTH) {
          props.maxLength = column.LENGTH
          props.showWordLimit = true
        }
        break

      case 'text':
      case 'password':
      case 'email':
      case 'url':
        if (column.LENGTH) {
          props.maxLength = column.LENGTH
        }
        break

      case 'select':
      case 'radio':
        // 字典配置
        if (column.DICT_TABLE_ID) {
          props.dictTableId = column.DICT_TABLE_ID
          props.valueField = column.DICT_VALUE_FIELD || 'DICT_VALUE'
          props.displayField = column.DICT_DISPLAY_FIELD || 'DICT_NAME'
        }
        break

      case 'foreign_key':
        // 外键配置
        if (column.FK_TABLE_ID) {
          props.fkTableId = column.FK_TABLE_ID
          props.valueField = column.FK_VALUE_FIELD || 'ID'
          props.displayField = column.FK_DISPLAY_FIELD || 'NAME'
        }
        break

      case 'file':
      case 'image':
        props.accept = column.CONTROL_TYPE === 'image' ? 'image/*' : '*'
        props.maxSize = 10 * 1024 * 1024 // 10MB
        break
    }

    return props
  })

  /**
   * 获取验证规则
   */
  const validationRules = computed(() => {
    const rules: any[] = []

    // 兼容大小写字段名
    const nullAble = column.NULL_ABLE || (column as any).nullAble
    const displayName = column.DISPLAY_NAME || (column as any).displayName || column.DB_NAME
    const errorMsg = column.ERROR_MSG || (column as any).errorMsg
    const regExpression = column.REG_EXPRESSION || (column as any).regExpression
    const length = column.LENGTH || (column as any).length
    const controlType = column.CONTROL_TYPE || (column as any).controlType

    // 必填规则
    if (nullAble === 'N') {
      rules.push({
        required: true,
        message: errorMsg || `${displayName}不能为空`
      })
    }

    // 正则规则
    if (regExpression) {
      try {
        const regex = new RegExp(regExpression)
        rules.push({
          pattern: regex,
          message: errorMsg || `${displayName}格式不正确`
        })
      } catch (error) {
        console.error('Invalid regex:', regExpression)
      }
    }

    // 长度规则
    if (length && ['text', 'textarea', 'password', 'email', 'url'].includes(controlType)) {
      rules.push({
        maxLength: length,
        message: `${displayName}长度不能超过${length}个字符`
      })
    }

    // 邮箱格式
    if (controlType === 'email') {
      rules.push({
        type: 'email',
        message: '请输入有效的邮箱地址'
      })
    }

    // URL格式
    if (controlType === 'url') {
      rules.push({
        type: 'url',
        message: '请输入有效的URL地址'
      })
    }

    return rules
  })

  /**
   * 格式化字段值用于显示
   */
  function formatValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    switch (column.CONTROL_TYPE) {
      case 'date':
        return new Date(value).toLocaleDateString('zh-CN')

      case 'datetime':
        return new Date(value).toLocaleString('zh-CN')

      case 'number':
        if (column.DECIMAL_PLACES !== undefined) {
          return Number(value).toFixed(column.DECIMAL_PLACES)
        }
        return String(value)

      case 'checkbox':
        return value ? '是' : '否'

      default:
        return String(value)
    }
  }

  /**
   * 解析字段值（从字符串转换为对应类型）
   */
  function parseValue(value: string): any {
    if (!value) return null

    switch (column.DATA_TYPE) {
      case 'int':
        return parseInt(value, 10)

      case 'decimal':
        return parseFloat(value)

      case 'date':
      case 'datetime':
        return new Date(value)

      case 'char':
        if (column.CONTROL_TYPE === 'checkbox') {
          return value === 'Y' || value === '1' || value === 'true'
        }
        return value

      default:
        return value
    }
  }

  return {
    componentName,
    isReadonly,
    isRequired,
    placeholder,
    helpText,
    labelConfig,
    inputProps,
    validationRules,
    formatValue,
    parseValue
  }
}
