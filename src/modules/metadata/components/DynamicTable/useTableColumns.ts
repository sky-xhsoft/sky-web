/**
 * 表格列配置 composable
 * 从 DynamicTable.vue 提取列配置逻辑
 */
import { computed, type Ref } from 'vue'
import type { TableColumnData } from '@arco-design/web-vue'

interface UseTableColumnsOptions {
  tableConfig: Ref<any>
  tableColumns: Ref<any[]>
  allColumns: Ref<TableColumnData[]>
  selectedColumnKeys: Ref<string[]>
  customColumns: string[]
}

export function useTableColumns(options: UseTableColumnsOptions) {
  const { tableConfig, tableColumns, allColumns, selectedColumnKeys, customColumns } = options

  function findColumnConfig(dataIndex: string) {
    return tableConfig.value?.columns.find((c: any) => {
      const dbName = c.DB_NAME || c.dbName
      return dbName === dataIndex
    })
  }

  function isStatusColumn(dataIndex: string): boolean {
    if (!dataIndex) return false
    return dataIndex.toUpperCase().includes('STATUS') ||
      dataIndex.toUpperCase().includes('STATE') ||
      dataIndex === 'IS_ACTIVE'
  }

  function isDateColumn(dataIndex: string): boolean {
    const column = findColumnConfig(dataIndex)
    return column?.CONTROL_TYPE === 'date'
  }

  function isDateTimeColumn(dataIndex: string): boolean {
    const commonFields = ['CREATE_TIME', 'UPDATE_TIME', 'createTime', 'updateTime']
    if (commonFields.includes(dataIndex)) return true
    const column = findColumnConfig(dataIndex)
    return column?.CONTROL_TYPE === 'datetime'
  }

  function getColumnAlign(dataIndex: string): 'left' | 'center' | 'right' {
    const column = findColumnConfig(dataIndex)
    if (!column) return 'left'
    if (column.CONTROL_TYPE === 'number') return 'right'
    if (isStatusColumn(dataIndex)) return 'center'
    return 'left'
  }

  /** 完整列配置 */
  const columns = computed<TableColumnData[]>(() => {
    const cols: TableColumnData[] = []

    cols.push({
      title: '序号', dataIndex: '__selection_index__', width: 80, align: 'center',
      slotName: '__selection_index__', titleSlotName: 'selection-index-title', fixed: 'left',
    })

    tableColumns.value.forEach((column) => {
      const col: TableColumnData = {
        title: column.title, dataIndex: column.dataIndex, width: column.width || 180,
        ellipsis: true, tooltip: true, align: getColumnAlign(column.dataIndex),
      }
      if (column.sortable) col.titleSlotName = `title-${column.dataIndex}`

      const originalColumn = findColumnConfig(column.dataIndex)
      const setValueType = originalColumn?.SET_VALUE_TYPE || (originalColumn as any)?.setValueType
      const displayType = originalColumn?.DISPLAY_TYPE || (originalColumn as any)?.displayType

      if (displayType === 'image') {
        col.slotName = 'image'; (col as any).originalColumn = originalColumn
      } else if (setValueType === 'fk') {
        col.slotName = 'foreignkey'; (col as any).originalColumn = originalColumn
      } else if (setValueType === 'select') {
        col.slotName = 'select'; (col as any).originalColumn = originalColumn
      } else if (isStatusColumn(column.dataIndex)) {
        col.slotName = 'status'
      } else if (isDateColumn(column.dataIndex)) {
        col.slotName = 'date'
      } else if (isDateTimeColumn(column.dataIndex)) {
        col.slotName = 'datetime'
      } else if (customColumns.includes(column.dataIndex)) {
        col.slotName = column.dataIndex
      }
      cols.push(col)
    })

    cols.push({
      title: '操作', dataIndex: 'actions', width: 200, align: 'center', fixed: 'right', slotName: 'actions',
    })
    return cols
  })

  /** 可见列 */
  const visibleColumns = computed(() => {
    if (selectedColumnKeys.value.length === 0) return columns.value
    const fixedCols = columns.value.filter((c) => c.dataIndex === '__selection_index__' || c.dataIndex === 'actions')
    const businessCols = allColumns.value
      .filter((c) => selectedColumnKeys.value.includes(c.dataIndex as string))
      .map((c) => columns.value.find((col) => col.dataIndex === c.dataIndex) || c)
    const selectionCol = fixedCols.find((c) => c.dataIndex === '__selection_index__')
    const actionCol = fixedCols.find((c) => c.dataIndex === 'actions')
    return [...(selectionCol ? [selectionCol] : []), ...businessCols, ...(actionCol ? [actionCol] : [])]
  })

  return { columns, visibleColumns, isStatusColumn, isDateColumn, isDateTimeColumn, getColumnAlign, findColumnConfig }
}
