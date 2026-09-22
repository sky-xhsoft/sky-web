/**
 * useFieldRenderer Composable 测试
 */

import { describe, it, expect } from 'vitest'
import { useFieldRenderer } from './useFieldRenderer'
import type { SysColumn } from '../types'

describe('useFieldRenderer', () => {
  describe('组件名称映射', () => {
    it('通过 SET_VALUE_TYPE=fk 返回 ForeignKeyField', () => {
      const column = { SET_VALUE_TYPE: 'fk' } as SysColumn
      const { componentName } = useFieldRenderer(column)
      expect(componentName.value).toBe('ForeignKeyField')
    })

    it('通过 SET_VALUE_TYPE=select 返回 SelectField', () => {
      const column = { SET_VALUE_TYPE: 'select' } as SysColumn
      const { componentName } = useFieldRenderer(column)
      expect(componentName.value).toBe('SelectField')
    })

    it('通过 DISPLAY_TYPE 返回对应组件', () => {
      const column = { DISPLAY_TYPE: 'textarea' } as SysColumn
      const { componentName } = useFieldRenderer(column)
      expect(componentName.value).toBe('TextareaField')
    })

    it('通过 CONTROL_TYPE 返回对应组件', () => {
      const column = { CONTROL_TYPE: 'checkbox' } as SysColumn
      const { componentName } = useFieldRenderer(column)
      expect(componentName.value).toBe('CheckboxField')
    })

    it('默认返回 TextField', () => {
      const column = {} as SysColumn
      const { componentName } = useFieldRenderer(column)
      expect(componentName.value).toBe('TextField')
    })

    it('clob 类型映射到 TextareaField', () => {
      const column = { DISPLAY_TYPE: 'clob' } as SysColumn
      const { componentName } = useFieldRenderer(column)
      expect(componentName.value).toBe('TextareaField')
    })

    it('系统时间字段映射到 DatetimeField', () => {
      const column = { DB_NAME: 'CREATE_TIME' } as SysColumn
      const { componentName } = useFieldRenderer(column)
      expect(componentName.value).toBe('DatetimeField')
    })
  })
})