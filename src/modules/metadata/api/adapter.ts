/**
 * 字段名适配器 — 将后端 camelCase 字段映射到前端 UPPER_CASE 格式
 */

export function adaptColumn(raw: Record<string, any>): Record<string, any> {
  const col = { ...raw }
  const map: [string, string][] = [
    ['DB_NAME', 'dbName'],
    ['FULL_NAME', 'fullName'],
    ['DISPLAY_NAME', 'displayName'],
    ['ENAME', 'EName'],
    ['DISPLAY_TYPE', 'displayType'],
    ['COL_TYPE', 'colType'],
    ['COL_LENGTH', 'colLength'],
    ['COL_PRECISION', 'colPrecision'],
    ['SET_VALUE_TYPE', 'setValueType'],
    ['REF_TABLE_ID', 'refTableId'],
    ['REF_COLUMN_ID', 'refColumnId'],
    ['REF_ON_DELETE', 'refOnDelete'],
    ['SYS_DICT_ID', 'sysDictId'],
    ['SEQ', 'seq'],
    ['NULL_ABLE', 'nullAble'],
    ['REG_EXPRESSION', 'regExpression'],
    ['ERR_MSG', 'errMsg'],
    ['DEFAULT_VAL', 'defaultValue'],
    ['IS_AK', 'isAk'],
    ['IS_DK', 'isDk'],
    ['IS_QUERY', 'isQuery'],
    ['IS_UPPERCASE', 'isUppercase'],
    ['MODIFI_ABLE', 'modifiAble'],
    ['IS_SHOW_TITLE', 'isShowTitle'],
    ['SUBMETHOD', 'submethod'],
    ['DISPLAY_COLS', 'displayCols'],
    ['DISPLAY_ROWS', 'displayRows'],
    ['PROPS', 'props'],
    ['SHOW_COLUMN_ID', 'showColumnId'],
    ['SHOW_COLUMN_VAL', 'showColumnVal'],
    ['HR_COLUMN_ID', 'hrColumnId'],
    ['SGRADE', 'sgrade'],
    ['FILTER', 'filter'],
    ['MASK', 'mask'],
    ['ORDERNO', 'orderno'],
    ['IS_ACTIVE', 'isActive'],
    ['DESCRIPTION', 'description'],
  ]

  for (const [upper, camel] of map) {
    if (col[upper] === undefined && (raw as any)[camel] !== undefined) {
      col[upper] = (raw as any)[camel]
    }
  }

  return col
}

export function adaptTable(raw: Record<string, any>): Record<string, any> {
  const tbl = { ...raw }
  const map: [string, string][] = [
    ['ID', 'id'],
    ['NAME', 'name'],
    ['DISPLAY_NAME', 'displayName'],
    ['ENAME', 'EName'],
    ['REAL_TABLE_ID', 'realTableId'],
    ['AK_COLUMN_ID', 'AK_COLUMN_ID'],
    ['DK_COLUMN_ID', 'DK_COLUMN_ID'],
    ['FILTER', 'filter'],
    ['MASK', 'mask'],
    ['IS_BIG', 'isBig'],
    ['IS_DROPDOWN', 'isDropdown'],
    ['IS_MENU', 'isMenu'],
    ['ICO_IMG', 'icoImg'],
    ['URL', 'url'],
    ['RPC_NAME', 'rpcName'],
    ['ROWCNT', 'ROWCNT'],
    ['PROPS', 'props'],
    ['ORDERNO', 'orderno'],
    ['SYS_OBJUICONF_ID', 'sysObjUIConfId'],
    ['SYS_TABLECATEGORY_ID', 'sysTableCategoryId'],
    ['SYS_PARENT_TABLE_ID', 'sysParentTableId'],
    ['SYS_DIRECTORY_ID', 'sysDirectoryId'],
    ['IS_ACTIVE', 'isActive'],
    ['DESCRIPTION', 'description'],
  ]

  for (const [upper, camel] of map) {
    if (tbl[upper] === undefined && (raw as any)[camel] !== undefined) {
      tbl[upper] = (raw as any)[camel]
    }
  }

  return tbl
}

export function adaptDictItem(raw: Record<string, any>): Record<string, any> {
  const item = { ...raw }
  if (item.VALUE === undefined && (raw as any).value !== undefined) {
    item.VALUE = (raw as any).value
  }
  if (item.DISPLAY_NAME === undefined && (raw as any).displayName !== undefined) {
    item.DISPLAY_NAME = (raw as any).displayName
  }
  return item
}

export function adaptChildRef(ref: Record<string, any>): Record<string, any> {
  const r = { ...ref }
  if (r.EDIT_TYPE === undefined && (ref as any).editType !== undefined) {
    r.EDIT_TYPE = (ref as any).editType
  }
  if (r.FILTER === undefined && (ref as any).filter !== undefined) {
    r.FILTER = (ref as any).filter
  }
  if (r.ASSOCTYPE === undefined && (ref as any).assocType !== undefined) {
    r.ASSOCTYPE = (ref as any).assocType
  }
  return r
}
