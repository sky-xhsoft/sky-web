/**
 * 字段名适配器 - 将后端 camelCase 字段映射到前端 UPPER_CASE 格式
 */

type FieldMapping = [string, string]

/**
 * 通用的字段适配器工厂函数
 */
function createAdapter<T extends Record<string, any>>(fieldMappings: FieldMapping[]) {
  return (raw: Record<string, any>): T => {
    const result = { ...raw }
    for (const [targetKey, sourceKey] of fieldMappings) {
      if (result[targetKey] === undefined && raw[sourceKey] !== undefined) {
        result[targetKey] = raw[sourceKey]
      }
    }
    return result as T
  }
}

// 表字段映射
const TABLE_FIELD_MAPPINGS: FieldMapping[] = [
  ['ID', 'id'],
  ['NAME', 'name'],
  ['DISPLAY_NAME', 'displayName'],
  ['ENAME', 'EName'],
  ['REAL_TABLE_ID', 'realTableId'],
  ['AK_COLUMN_ID', 'AK_COLUMN_ID'],
  ['DK_COLUMN_ID', 'DK_COLUMN_ID'],
  ['PK', 'pk'],
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

// 列字段映射
const COLUMN_FIELD_MAPPINGS: FieldMapping[] = [
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
  ['DEFAULT_VALUE', 'defaultValue'],
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
  ['SHOW_COLUMN_VALUE', 'showColumnValue'],
  ['HR_COLUMN_ID', 'hrColumnId'],
  ['SGRADE', 'sgrade'],
  ['FILTER', 'filter'],
  ['MASK', 'mask'],
  ['ORDERNO', 'orderno'],
  ['IS_ACTIVE', 'isActive'],
  ['DESCRIPTION', 'description'],
]

// 子表引用映射
const CHILD_REF_MAPPINGS: FieldMapping[] = [
  ['EDIT_TYPE', 'editType'],
  ['FILTER', 'filter'],
  ['ASSOCTYPE', 'assocType'],
]

// 字典项映射
const DICT_ITEM_MAPPINGS: FieldMapping[] = [
  ['VALUE', 'value'],
  ['DISPLAY_NAME', 'displayName'],
]

/**
 * 适配表数据
 */
export const adaptTable = createAdapter<Record<string, any>>(TABLE_FIELD_MAPPINGS)

/**
 * 适配列数据
 */
export const adaptColumn = createAdapter<Record<string, any>>(COLUMN_FIELD_MAPPINGS)

/**
 * 适配子表引用数据
 */
export const adaptChildRef = createAdapter<Record<string, any>>(CHILD_REF_MAPPINGS)

/**
 * 适配字典项数据
 */
export const adaptDictItem = createAdapter<Record<string, any>>(DICT_ITEM_MAPPINGS)
