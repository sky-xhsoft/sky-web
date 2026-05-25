/**
 * useFieldRenderer Composable 测试
 */

import { describe, it, expect } from 'vitest'
import { useFieldRenderer, FIELD_COMPONENT_MAP } from './useFieldRenderer'
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

  describe('属性计算', () => {
    it('获取允许清除状态', () => {
      const column = { NULL_ABLE: 'Y' } as SysColumn
      const { allowClear } = useFieldRenderer(column, 'edit')
      expect(allowClear.value).toBe(true)
    })

    it('必填字段不允许清除', () => {
      const column = { NULL_ABLE: 'N' } as SysColumn
      const { allowClear } = useFieldRenderer(column, 'edit')
      expect(allowClear.value).toBe(false)
    })

    it('只读状态下不允许清除', () => {
      const column = { NULL_ABLE: 'Y' } as SysColumn
      const { allowClear } = useFieldRenderer(column, 'view')
      expect(allowClear.value).toBe(false)
    })

    it('选择字段允许搜索', () => {
      const column = { SET_VALUE_TYPE: 'select' } as SysColumn
      const { allowSearch } = useFieldRenderer(column)
      expect(allowSearch.value).toBe(true)
    })

    it('外键字段允许搜索', () => {
      const column = { SET_VALUE_TYPE: 'fk' } as SysColumn
      const { allowSearch } = useFieldRenderer(column)
      expect(allowSearch.value).toBe(true)
    })

    it('获取最大长度', () => {
      const column = { LENGTH: 100 } as SysColumn
      const { maxLength } = useFieldRenderer(column)
      expect(maxLength.value).toBe(100)
    })

    it('获取 COL_LENGTH 作为最大长度', () => {
      const column = { COL_LENGTH: 50 } as SysColumn
      const { maxLength } = useFieldRenderer(column)
      expect(maxLength.value).toBe(50)
    })

    it('检测自动转大写', () => {
      const column = { IS_UPPERCASE: 'Y' } as SysColumn
      const { isUppercase } = useFieldRenderer(column)
      expect(isUppercase.value).toBe(true)
    })

    it('获取显示列数', () => {
      const column = { DISPLAY_COLS: 2 } as SysColumn
      const { displayCols } = useFieldRenderer(column)
      expect(displayCols.value).toBe(2)
    })

    it('获取默认显示行数', () => {
      const column = {} as SysColumn
      const { displayRows } = useFieldRenderer(column)
      expect(displayRows.value).toBe(4)
    })

    it('获取自定义显示行数', () => {
      const column = { DISPLAY_ROWS: 8 } as SysColumn
      const { displayRows } = useFieldRenderer(column)
      expect(displayRows.value).toBe(8)
    })

    it('获取字典 ID', () => {
      const column = { SYS_DICT_ID: '123' } as SysColumn
      const { dictId } = useFieldRenderer(column)
      expect(dictId.value).toBe('123')
    })

    it('获取外键关联表 ID', () => {
      const column = { REF_TABLE_ID: 456 } as SysColumn
      const { refTableId } = useFieldRenderer(column)
      expect(refTableId.value).toBe(456)
    })
  })

  describe('FIELD_COMPONENT_MAP', () => {
    it('包含所有必要的组件映射', () => {
      expect(FIELD_COMPONENT_MAP.text).toBe('TextField')
      expect(FIELD_COMPONENT_MAP.textarea).toBe('TextareaField')
      expect(FIELD_COMPONENT_MAP.number).toBe('NumberField')
      expect(FIELD_COMPONENT_MAP.select).toBe('SelectField')
      expect(FIELD_COMPONENT_MAP.date).toBe('DateField')
      expect(FIELD_COMPONENT_MAP.datetime).toBe('DatetimeField')
      expect(FIELD_COMPONENT_MAP.foreign_key).toBe('ForeignKeyField')
      expect(FIELD_COMPONENT_MAP.file).toBe('FileField')
      expect(FIELD_COMPONENT_MAP.image).toBe('ImageField')
      expect(FIELD_COMPONENT_MAP.json).toBe('JsonField')
      expect(FIELD_COMPONENT_MAP.richtext).toBe('RichTextField')
    })
  })
})
