/**
 * 表格单元格显示工具
 */
import { formatDateTime as formatDateTimeUtil } from '@/utils/date'
import type { SysColumn, TableConfig } from '../../types'

export function useCellDisplay(tableConfig: () => TableConfig | undefined) {
  /**
   * 是否数字列
   */
  function isNumberColumn(dataIndex: string): boolean {
    const col = tableConfig()?.columns.find(c => (c.DB_NAME || (c as any).dbName) === dataIndex)
    if (!col) return false
    const colType = (col.COL_TYPE || (col as any).colType || '').toLowerCase()
    return ['int', 'bigint', 'decimal', 'float', 'double', 'number'].includes(colType)
  }

  /**
   * 格式化日期时间
   */
  function formatDateTime(value: any): string {
    return formatDateTimeUtil(value)
  }

  /**
   * 获取字典标签（包含样式）
   */
  function getDictLabelWithStyle(dataIndex: string, value: any): { label: string; cssClass?: string } {
    if (!value) return { label: '-' }

    const column = tableConfig()?.columns.find(c => {
      const dbName = c.DB_NAME || (c as any).dbName
      return dbName === dataIndex
    })
    if (!column) return { label: String(value) }

    const displayType = (column.DISPLAY_TYPE || (column as any).displayType || column.CONTROL_TYPE || (column as any).controlType || '').toLowerCase()
    if (displayType === 'check' || displayType === 'checkbox' || displayType === 'bool' || displayType === 'boolean') {
      return {
        label: String(value) === 'Y' || String(value) === '1' || value === true ? '是' : String(value) === 'N' || String(value) === '0' || value === false ? '否' : String(value),
        cssClass: String(value) === 'Y' || String(value) === '1' || value === true ? 'success' : 'danger'
      }
    }

    const sysDictID = column.SYS_DICT_ID || (column as any).sysDictId || column.DICT_TABLE_ID || (column as any).dictTableId
    if (!sysDictID || !tableConfig()?.dictData) return { label: String(value) }

    const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
    const dictItems = tableConfig()!.dictData![dictID]
    if (!dictItems) return { label: String(value) }

    const item = dictItems.find(item => {
      const itemValue = item.VALUE || (item as any).value
      return itemValue === String(value)
    })

    if (item) {
      const displayName = item.DISPLAY_NAME || (item as any).displayName
      const cssClass = item.CSS_CLASS || (item as any).cssClass
      return { label: displayName || String(value), cssClass: cssClass || undefined }
    }

    return { label: String(value) }
  }

  /**
   * 获取字段的字典选项
   */
  function getDictOptions(column: SysColumn): Array<{ value: string; label: string }> {
    const sysDictID = column.SYS_DICT_ID || (column as any).sysDictId || column.DICT_TABLE_ID || (column as any).dictTableId
    if (!sysDictID || !tableConfig()?.dictData) return []

    const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
    const dictItems = tableConfig()!.dictData![dictID]
    if (!dictItems) return []

    return dictItems.map(item => ({
      value: item.VALUE || (item as any).value,
      label: String(item.DISPLAY_NAME || (item as any).displayName || '')
    }))
  }

  return {
    isNumberColumn,
    formatDateTime,
    getDictLabelWithStyle,
    getDictOptions
  }
}
