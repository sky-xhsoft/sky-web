/**
 * 类型守卫函数测试
 */

import { describe, it, expect } from 'vitest'
import {
  isFormMode,
  isActiveStatus,
  isForeignKeyColumn,
  isSelectColumn,
  shouldShowColumnInMode,
  shouldEditColumnInMode,
  hasTablePermission,
  parsePropsSafe,
  getColumnDisplayName,
  getColumnDbName,
  getTableName,
  getTableDisplayName,
  SysTable,
  SysColumn,
} from './index'

describe('类型守卫函数', () => {
  describe('isFormMode', () => {
    it('识别有效的表单模式', () => {
      expect(isFormMode('create')).toBe(true)
      expect(isFormMode('edit')).toBe(true)
      expect(isFormMode('view')).toBe(true)
    })

    it('拒绝无效的表单模式', () => {
      expect(isFormMode('invalid')).toBe(false)
      expect(isFormMode(null)).toBe(false)
      expect(isFormMode(undefined)).toBe(false)
      expect(isFormMode(123)).toBe(false)
    })
  })

  describe('isActiveStatus', () => {
    it('识别有效的激活状态', () => {
      expect(isActiveStatus('Y')).toBe(true)
      expect(isActiveStatus('N')).toBe(true)
    })

    it('拒绝无效的激活状态', () => {
      expect(isActiveStatus('y')).toBe(false)
      expect(isActiveStatus('n')).toBe(false)
      expect(isActiveStatus('YES')).toBe(false)
      expect(isActiveStatus(null)).toBe(false)
    })
  })

  describe('isForeignKeyColumn', () => {
    it('通过 SET_VALUE_TYPE=fk 识别外键字段', () => {
      const column = { SET_VALUE_TYPE: 'fk' } as SysColumn
      expect(isForeignKeyColumn(column)).toBe(true)
    })

    it('通过 REF_TABLE_ID 和 display_type 识别外键字段', () => {
      const column = { REF_TABLE_ID: 123, DISPLAY_TYPE: 'foreign_key' } as SysColumn
      expect(isForeignKeyColumn(column)).toBe(true)
    })

    it('识别非外键字段', () => {
      const column = { DB_NAME: 'name', DISPLAY_TYPE: 'text' } as SysColumn
      expect(isForeignKeyColumn(column)).toBe(false)
    })
  })

  describe('isSelectColumn', () => {
    it('通过 SET_VALUE_TYPE=select 识别选择字段', () => {
      const column = { SET_VALUE_TYPE: 'select' } as SysColumn
      expect(isSelectColumn(column)).toBe(true)
    })

    it('通过 SYS_DICT_ID 识别选择字段', () => {
      const column = { SYS_DICT_ID: '123' } as SysColumn
      expect(isSelectColumn(column)).toBe(true)
    })

    it('通过 DISPLAY_TYPE=select 识别选择字段', () => {
      const column = { DISPLAY_TYPE: 'select' } as SysColumn
      expect(isSelectColumn(column)).toBe(true)
    })

    it('识别非选择字段', () => {
      const column = { DB_NAME: 'name', DISPLAY_TYPE: 'text' } as SysColumn
      expect(isSelectColumn(column)).toBe(false)
    })
  })
})

describe('权限检查函数', () => {
  describe('shouldShowColumnInMode', () => {
    it('在 create 模式下检查 mask 位 0', () => {
      const column = { MASK: '1111111111' } as SysColumn
      expect(shouldShowColumnInMode(column, 'create')).toBe(true)

      const columnHidden = { MASK: '0111111111' } as SysColumn
      expect(shouldShowColumnInMode(columnHidden, 'create')).toBe(false)
    })

    it('在 edit 模式下检查 mask 位 2', () => {
      const column = { MASK: '1111111111' } as SysColumn
      expect(shouldShowColumnInMode(column, 'edit')).toBe(true)

      const columnHidden = { MASK: '1101111111' } as SysColumn
      expect(shouldShowColumnInMode(columnHidden, 'edit')).toBe(false)
    })

    it('无 mask 时默认显示', () => {
      const column = {} as SysColumn
      expect(shouldShowColumnInMode(column, 'view')).toBe(true)
    })
  })

  describe('shouldEditColumnInMode', () => {
    it('view 模式下始终不可编辑', () => {
      const column = { MASK: '1111111111' } as SysColumn
      expect(shouldEditColumnInMode(column, 'view')).toBe(false)
    })

    it('create 模式下检查 mask 位 1', () => {
      const column = { MASK: '1111111111' } as SysColumn
      expect(shouldEditColumnInMode(column, 'create')).toBe(true)

      const columnReadonly = { MASK: '1011111111' } as SysColumn
      expect(shouldEditColumnInMode(columnReadonly, 'create')).toBe(false)
    })

    it('edit 模式下检查 mask 位 3', () => {
      const column = { MASK: '1111111111' } as SysColumn
      expect(shouldEditColumnInMode(column, 'edit')).toBe(true)

      const columnReadonly = { MASK: '1110111111' } as SysColumn
      expect(shouldEditColumnInMode(columnReadonly, 'edit')).toBe(false)
    })

    it('尊重 MODIFI_ABLE=N 设置', () => {
      const column = { MASK: '1111111111', MODIFI_ABLE: 'N' } as SysColumn
      expect(shouldEditColumnInMode(column, 'edit')).toBe(false)
    })
  })

  describe('hasTablePermission', () => {
    it('检查表权限', () => {
      const table = { MASK: 'AMDQSUVIE' } as SysTable
      expect(hasTablePermission(table, 'A')).toBe(true)
      expect(hasTablePermission(table, 'M')).toBe(true)
      expect(hasTablePermission(table, 'D')).toBe(true)
      expect(hasTablePermission(table, 'Q')).toBe(true)
      expect(hasTablePermission(table, 'X')).toBe(false)
    })

    it('无 mask 时返回 false', () => {
      const table = {} as SysTable
      expect(hasTablePermission(table, 'A')).toBe(false)
    })
  })
})

describe('工具函数', () => {
  describe('parsePropsSafe', () => {
    it('安全解析有效 JSON', () => {
      expect(parsePropsSafe('{"key":"value"}')).toEqual({ key: 'value' })
    })

    it('对无效 JSON 返回空对象', () => {
      expect(parsePropsSafe('invalid json')).toEqual({})
    })

    it('对空字符串返回空对象', () => {
      expect(parsePropsSafe('')).toEqual({})
    })

    it('对 undefined 返回空对象', () => {
      expect(parsePropsSafe(undefined)).toEqual({})
    })
  })

  describe('字段名称获取', () => {
    it('getColumnDisplayName 支持大小写格式', () => {
      const column = { DISPLAY_NAME: '用户名称' } as SysColumn
      expect(getColumnDisplayName(column)).toBe('用户名称')

      const column2 = { displayName: '用户名称' } as unknown as SysColumn
      expect(getColumnDisplayName(column2)).toBe('用户名称')
    })

    it('getColumnDisplayName 降级到 DB_NAME', () => {
      const column = { DB_NAME: 'user_name' } as SysColumn
      expect(getColumnDisplayName(column)).toBe('user_name')
    })

    it('getColumnDbName 获取数据库字段名', () => {
      const column = { DB_NAME: 'user_name' } as SysColumn
      expect(getColumnDbName(column)).toBe('user_name')
    })
  })

  describe('表名称获取', () => {
    it('getTableName 获取物理表名', () => {
      const table = { NAME: 'sys_user' } as SysTable
      expect(getTableName(table)).toBe('sys_user')
    })

    it('getTableDisplayName 获取显示名称', () => {
      const table = { DISPLAY_NAME: '用户表' } as SysTable
      expect(getTableDisplayName(table)).toBe('用户表')
    })
  })
})
