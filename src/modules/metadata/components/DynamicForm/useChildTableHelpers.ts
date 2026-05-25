/**
 * 子表通用工具 composable
 * ChildTableInlinePanel / ChildTablePanel / DynamicForm 共享
 */
import type { SysColumn } from '../../types'

export function useChildTableHelpers() {
  /**
   * 从表对象获取物理表名 (NAME || name)
   */
  function getTableName(table: any): string {
    return table?.NAME || table?.name || ''
  }

  /**
   * 从列对象获取数据库字段名 (DB_NAME || dbName)
   */
  function getColumnDbName(col: any): string {
    return col?.DB_NAME || col?.dbName || ''
  }

  /**
   * 查找子表中指向父表的外键列
   */
  function findRefColumn(parentTableId: number, childTable: { columns: SysColumn[] }): any {
    return childTable.columns.find((col: any) => {
      const refTableId = col.REF_TABLE_ID || col.refTableId
      return refTableId === parentTableId
    })
  }

  /**
   * 根据 OBJUICONF_ID 计算对话框宽度
   * 1=700px, 2=1000px, 3=1200px, 4=1400px
   */
  function getDialogWidth(objUiConfId: number): string {
    switch (objUiConfId) {
      case 1: return '700px'
      case 2: return '1000px'
      case 3: return '1200px'
      case 4: return '1400px'
      default: return '1000px'
    }
  }

  /**
   * 从列中提取 ordnerno (兼容大小写)
   */
  function getOrderNo(col: any): number {
    return col?.ORDERNO || col?.orderno || 0
  }

  /**
   * 检查字段 MASK 在某位置是否为 '1'
   */
  function isMaskBitSet(col: any, bitIndex: number): boolean {
    const mask = col?.MASK || col?.mask || ''
    return mask.length > bitIndex && mask[bitIndex] === '1'
  }

  /**
   * 生成临时 ID（负数递增）
   */
  function generateTempId(counter: { value: number }): number {
    return counter.value--
  }

  /**
   * 根据 OBJUICONF_ID 获取表单列宽 (1→24, 2→12, 3→8, 4→6)
   */
  function getFormColumnSpan(objUiConfId: number): number {
    switch (objUiConfId) {
      case 1: return 24
      case 2: return 12
      case 3: return 8
      case 4: return 6
      default: return 12
    }
  }

  /**
   * 从表配置获取 OBJUICONF_ID（兼容大小写）
   */
  function getObjUiConfId(tableConfig: any): number {
    return (tableConfig?.table?.SYS_OBJUICONF_ID ||
            (tableConfig?.table as any)?.sysObjuiconfId ||
            2)
  }

  return {
    getTableName,
    getColumnDbName,
    findRefColumn,
    getDialogWidth,
    getOrderNo,
    isMaskBitSet,
    generateTempId,
    getFormColumnSpan,
    getObjUiConfId,
  }
}
