/**
 * useFieldRendererBase Composable 测试
 */

import { describe, it, expect } from 'vitest'
import { useFieldRendererBase } from './useFieldRendererBase'
import type { SysColumn } from '../types'

describe('useFieldRendererBase', () => {
  describe('基础属性', () => {
    it('获取显示名称', () => {
      const column = { DISPLAY_NAME: '用户名称' } as SysColumn
      const { displayName } = useFieldRendererBase({ column })
      expect(displayName).toBe('用户名称')
    })

    it('获取占位符', () => {
      const column = { DISPLAY_NAME: '用户名称' } as SysColumn
      const { placeholder } = useFieldRendererBase({ column })
      expect(placeholder).toContain('用户名称')
    })

    it('使用自定义占位符', () => {
      const column = { DISPLAY_NAME: '用户名称', PLACEHOLDER: '请输入姓名' } as SysColumn
      const { placeholder } = useFieldRendererBase({ column })
      expect(placeholder).toBe('请输入姓名')
    })
  })

  describe('状态判断', () => {
    it('view 模式下为只读', () => {
      const column = {} as SysColumn
      const { isReadonly } = useFieldRendererBase({ column, mode: 'view' })
      expect(isReadonly).toBe(true)
    })

    it('disabled prop 强制禁用', () => {
      const column = {} as SysColumn
      const { isDisabled } = useFieldRendererBase({ column, disabled: true, mode: 'edit' })
      expect(isDisabled).toBe(true)
    })

    it('readonly prop 强制只读', () => {
      const column = {} as SysColumn
      const { isReadonly } = useFieldRendererBase({ column, readonly: true, mode: 'edit' })
      expect(isReadonly).toBe(true)
    })

    it('识别必填字段', () => {
      const column = { NULL_ABLE: 'N' } as SysColumn
      const { isRequired } = useFieldRendererBase({ column })
      expect(isRequired).toBe(true)
    })

    it('识别非必填字段', () => {
      const column = { NULL_ABLE: 'Y' } as SysColumn
      const { isRequired } = useFieldRendererBase({ column })
      expect(isRequired).toBe(false)
    })
  })

  describe('类型识别', () => {
    it('识别选择类型字段', () => {
      const column = { SET_VALUE_TYPE: 'select' } as SysColumn
      const { isSelect } = useFieldRendererBase({ column })
      expect(isSelect).toBe(true)
    })

    it('识别外键类型字段', () => {
      const column = { SET_VALUE_TYPE: 'fk', REF_TABLE_ID: 123 } as SysColumn
      const { isForeignKey } = useFieldRendererBase({ column })
      expect(isForeignKey).toBe(true)
    })
  })

  describe('验证规则', () => {
    it('为必填字段生成验证规则', () => {
      const column = { NULL_ABLE: 'N', DISPLAY_NAME: '用户名称' } as SysColumn
      const { validationRules } = useFieldRendererBase({ column })
      expect(validationRules).toEqual([
        { required: true, message: '用户名称不能为空' }
      ])
    })

    it('使用自定义错误消息', () => {
      const column = { NULL_ABLE: 'N', ERR_MSG: '姓名不能为空' } as SysColumn
      const { validationRules } = useFieldRendererBase({ column })
      expect(validationRules).toEqual([
        { required: true, message: '姓名不能为空' }
      ])
    })

    it('非必填字段无验证规则', () => {
      const column = { NULL_ABLE: 'Y' } as SysColumn
      const { validationRules } = useFieldRendererBase({ column })
      expect(validationRules).toEqual([])
    })
  })

  describe('格式化值', () => {
    it('空值显示为短横线', () => {
      const column = {} as SysColumn
      const { formatValue } = useFieldRendererBase({ column })
      expect(formatValue(null)).toBe('-')
      expect(formatValue(undefined)).toBe('-')
      expect(formatValue('')).toBe('-')
    })

    it('布尔值显示为是/否（开关字段）', () => {
      const column = { DISPLAY_TYPE: 'switch' } as SysColumn
      const { formatValue } = useFieldRendererBase({ column })
      expect(formatValue(true)).toBe('是')
      expect(formatValue(false)).toBe('否')
    })

    it('格式化日期字段', () => {
      const column = { DISPLAY_TYPE: 'date' } as SysColumn
      const { formatValue } = useFieldRendererBase({ column })
      const dateStr = formatValue('2024-01-15')
      expect(dateStr).toContain('2024')
    })

    it('格式化数字字段精度', () => {
      const column = { DISPLAY_TYPE: 'number', COL_PRECISION: 2 } as SysColumn
      const { formatValue } = useFieldRendererBase({ column })
      expect(formatValue(123.456)).toBe('123.46')
    })

    it('富文本移除 HTML 标签', () => {
      const column = { DISPLAY_TYPE: 'richtext' } as SysColumn
      const { formatValue } = useFieldRendererBase({ column })
      expect(formatValue('<p>Hello <b>World</b></p>')).toBe('Hello World')
    })
  })
})
