/**
 * 元数据系统 - TypeScript 类型定义
 */

// ==================== 基础实体类型 ====================

/**
 * 子系统
 */
export interface Subsystem {
  ID: number
  SUBSYSTEM_CODE: string     // 子系统代码
  SUBSYSTEM_NAME: string     // 子系统名称
  DESCRIPTION?: string       // 描述
  ORDERNO?: number          // 排序号
  IS_ACTIVE: 'Y' | 'N'      // 是否启用
  CREATE_BY?: string
  CREATE_TIME?: string
  UPDATE_BY?: string
  UPDATE_TIME?: string
}

/**
 * 表类别
 */
export interface TableCategory {
  ID: number
  SUBSYSTEM_ID: number       // 所属子系统
  CATEGORY_CODE: string      // 类别代码
  CATEGORY_NAME: string      // 类别名称
  ORDERNO?: number          // 排序号
  IS_ACTIVE: 'Y' | 'N'      // 是否启用
  CREATE_BY?: string
  CREATE_TIME?: string
  UPDATE_BY?: string
  UPDATE_TIME?: string
}

/**
 * 表单配置
 * 与后端 entity.SysTable 对齐
 */
export interface SysTable {
  // === 来自后端实体 ===
  ID: number
  NAME: string                    // 表单唯一标识（物理表名）
  DISPLAY_NAME: string            // 显示名称
  ENAME?: string                  // 英文名称
  REAL_TABLE_ID?: number          // 虚拟表映射到的实体表ID
  FILTER?: string                 // 表级数据过滤SQL
  AK_COLUMN_ID?: number           // 输入主键列ID
  DK_COLUMN_ID?: number           // 显示主键列ID
  MASK?: string                   // 操作权限掩码 (A:新增 M:修改 D:删除 Q:查询 S:提交 U:反提交 V:作废 I:导入 E:导出)
  SYS_TABLECATEGORY_ID?: number   // 表分类ID
  URL?: string                    // 菜单跳转URL
  RPC_NAME?: string               // RPC服务名称
  IS_MENU?: 'Y' | 'N'             // 是否作为菜单项
  ICO_IMG?: string                // 菜单图标URL
  IS_DROPDOWN?: 'Y' | 'N'         // FK字段是否下拉显示
  SYS_OBJUICONF_ID?: number       // 界面配置ID
  SYS_DIRECTORY_ID?: number       // 安全目录ID
  SYS_PARENT_TABLE_ID?: number    // 父表ID（主从表）
  ROWCNT?: number                 // 统计行数
  IS_BIG?: 'Y' | 'N'              // 大表标识（跳过列表COUNT）
  PROPS?: string                  // 扩展属性JSON
  DESCRIPTION?: string            // 备注
  ORDERNO?: number                // 排序号

  // === 标准审计字段 ===
  IS_ACTIVE: 'Y' | 'N'
  CREATE_BY?: string
  CREATE_TIME?: string
  UPDATE_BY?: string
  UPDATE_TIME?: string

  // === 前端扩展字段 (向后兼容) ===
  /** @deprecated 使用 MASK 控制浏览行为 */
  ALLOW_BROWSE?: 'Y' | 'N'
  BROWSE_AFTER_ADD?: 'Y' | 'N'
  BROWSE_AFTER_DELETE?: 'Y' | 'N'
  TABLE_NAME?: string
  CATEGORY_ID?: number
  FILTER_CONDITION?: string
  PK?: string
  AK?: string
  DK?: string
}

/**
 * 字段配置
 * 与后端 entity.SysColumn 对齐（JSON camelCase）
 */
export interface SysColumn {
  // === 来自后端实体 ===
  ID: number
  SYS_TABLE_ID: number        // 所属表单
  DB_NAME: string             // 数据库字段名
  DISPLAY_NAME: string        // 显示名称
  FULL_NAME?: string          // 完整字段名
  ENAME?: string              // 英文名称
  COL_TYPE?: string           // 数据库列类型 (varchar/int/decimal/...)
  COL_LENGTH?: number         // 数据库列长度
  COL_PRECISION?: number      // 小数位数
  IS_DK?: 'Y' | 'N'           // 是否为显示主键
  IS_AK?: 'Y' | 'N'           // 是否为输入主键
  NULL_ABLE?: 'Y' | 'N'       // 是否可空
  IS_UPPERCASE?: 'Y' | 'N'    // 是否自动转大写
  IS_QUERY?: 'Y' | 'N'        // 是否作为查询条件
  ORDERNO?: number            // 字段排序号
  MASK?: string               // 字段级操作掩码
  MODIFI_ABLE?: 'Y' | 'N'     // 是否可修改
  SET_VALUE_TYPE?: string     // 赋值策略 (pk/docno/fk/byPage/select/createBy/sysdate/operator/password/ignore)
  REF_TABLE_ID?: number       // FK 关联目标表ID
  REF_COLUMN_ID?: number      // FK 关联目标列ID
  REF_ON_DELETE?: string      // FK 删除策略 (restrict/cascade/setNull/noAction)
  SEQ?: string                // 单据编号规则
  SYS_DICT_ID?: string        // 关联数据字典ID
  DEFAULT_VALUE?: string      // 默认值
  REG_EXPRESSION?: string     // 校验正则
  ERR_MSG?: string            // 错误提示
  FILTER?: string             // 字段级过滤SQL
  DISPLAY_TYPE?: string       // 显示控件类型 (text/textarea/select/date/...)
  DISPLAY_COLS?: number       // 显示列数
  DISPLAY_ROWS?: number       // 显示行数
  PROPS?: string              // 扩展属性JSON
  IS_SHOW_TITLE?: string      // 是否显示标题
  SUBMETHOD?: string          // 子方法
  HR_COLUMN_ID?: number       // HR折叠关联字段ID
  SHOW_COLUMN_ID?: number     // 显示控制字段ID
  SHOW_COLUMN_VALUE?: string  // 显示控制字段值
  DESCRIPTION?: string        // 备注
  SGRADE?: number             // 字段访问级别

  // === 运行时扩展 (非数据库字段) ===
  refTableIsDropdown?: string  // FK关联表是否下拉方式
  refTableName?: string        // FK关联表名
  fkDisplayValue?: string      // FK显示值

  // === 标准审计字段 ===
  IS_ACTIVE?: 'Y' | 'N'
  CREATE_BY?: string
  CREATE_TIME?: string
  UPDATE_BY?: string
  UPDATE_TIME?: string

  // === 前端扩展字段 (向后兼容，部分已废弃) ===
  /** @deprecated 使用 DISPLAY_TYPE 替代 */
  CONTROL_TYPE?: string
  /** @deprecated 使用 MASK 获取字段读写权限 */
  IS_VISIBLE?: 'Y' | 'N'
  IS_READONLY?: 'Y' | 'N'
  IS_EDITABLE_IN_GRID?: 'Y' | 'N'
  GRID_WIDTH?: number
  FORM_COLSPAN?: number
  PLACEHOLDER?: string
  HELP_TEXT?: string
  CONTROL_CONFIG?: string
  ACTION_ID?: number
  // 旧FK字段 (向后兼容)
  FK_TABLE_ID?: number
  FK_VALUE_FIELD?: string
  FK_DISPLAY_FIELD?: string
  DICT_TABLE_ID?: number
  DICT_VALUE_FIELD?: string
  DICT_DISPLAY_FIELD?: string
}

/**
 * 数据字典
 */
export interface SysDict {
  ID: number
  DICT_TABLE_ID: number     // 字典表ID
  DICT_CODE: string         // 字典代码
  DICT_NAME: string         // 字典名称
  DICT_VALUE: string        // 字典值
  PARENT_ID?: number        // 父节点ID
  ORDERNO?: number
  IS_ACTIVE: 'Y' | 'N'
  REMARK?: string
  CREATE_BY?: string
  CREATE_TIME?: string
  UPDATE_BY?: string
  UPDATE_TIME?: string
}

/**
 * 数据字典项
 */
export interface SysDictItem {
  ID: number
  SYS_DICT_ID: number       // 字典ID
  DISPLAY_NAME: string      // 显示名称
  VALUE: string             // 值
  ORDERNO?: number          // 排序号
  CSS_CLASS?: string        // CSS类
  IS_DEFAULT_VALUE?: 'Y' | 'N'  // 是否默认值
  CREATE_BY?: string
  CREATE_TIME?: string
  UPDATE_BY?: string
  UPDATE_TIME?: string
}

// ==================== 组合类型 ====================

/**
 * 表单配置（包含字段列表）
 */
export interface TableConfig {
  table: SysTable
  columns: SysColumn[]
  dictData?: Record<number, SysDictItem[]>  // 字典数据，key为字典ID
  props?: Record<string, any>  // 解析后的扩展属性
  childTables?: any[]  // 子表配置
}

/**
 * 表单模式
 */
export type FormMode = 'create' | 'edit' | 'view'

/**
 * 字段值类型
 */
export type FieldValue = string | number | boolean | Date | null | undefined

/**
 * 表单数据
 */
export type FormData = Record<string, FieldValue>

/**
 * 表单验证规则
 */
export interface ValidationRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  validator?: (value: FieldValue) => boolean | Promise<boolean>
}

// ==================== API 请求/响应类型 ====================

/**
 * 分页请求参数
 */
export interface PageRequest {
  page: number
  pageSize: number
  [key: string]: any  // 其他筛选条件
}

/**
 * 分页响应数据
 */
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 通用 API 响应
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 文件夹树节点
 */
export interface TreeNode {
  key: string | number
  title: string
  children?: TreeNode[]
  [key: string]: any
}

/**
 * 外键选项
 */
export interface SelectOption {
  value: string | number
  label: string
}

export interface TreeSelectOption {
  value: string | number
  label: string
  children?: TreeSelectOption[]
}

export interface ForeignKeyOption {
  value: number | string
  label: string
  record?: Record<string, any>
}

/**
 * 动作定义（SYS_ACTION）
 * DISPLAY_TYPE: list_button / list_menu_item / obj_button / obj_menu_item / tab_button
 * ACTION_TYPE: url / sp / job / js / bsh / py / go
 */
export interface SysAction {
  id: number
  sysTableId: number
  name: string
  displayName: string
  displayType: string
  actionType: string
  content?: string
  scripts?: string
  urlTarget?: string
  saveObj?: string
  comments?: string
  filter?: string
  orderno?: number
  SYS_COMPANY_ID?: number
  isActive?: string
}

// ==================== 组件 Props 类型 ====================

/**
 * DynamicForm Props
 */
export interface DynamicFormProps {
  tableId: number
  recordId?: number
  mode?: FormMode
  labelColSpan?: number
  wrapperColSpan?: number
}

/**
 * DynamicTable Props
 */
export interface DynamicTableProps {
  tableId: number
  filters?: Record<string, any>
  pageSize?: number
}

/**
 * FieldRenderer Props
 */
export interface FieldRendererProps {
  column: SysColumn
  value: FieldValue
  mode?: FormMode
  onChange?: (value: FieldValue) => void
}

// ==================== 工具类型 ====================

/**
 * 可选字段类型转换
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 必填字段类型转换
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

// ==================== 类型守卫与工具函数 ====================

/**
 * 检查是否为有效的表单模式
 */
export function isFormMode(mode: any): mode is FormMode {
  return mode === 'create' || mode === 'edit' || mode === 'view'
}

/**
 * 检查是否为有效的激活状态
 */
export function isActiveStatus(status: any): status is 'Y' | 'N' {
  return status === 'Y' || status === 'N'
}

/**
 * 检查字段是否为外键字段
 */
export function isForeignKeyColumn(column: Partial<SysColumn>): boolean {
  const setValueType = column.SET_VALUE_TYPE || (column as any).setValueType
  if (setValueType === 'fk') return true

  const displayType = column.DISPLAY_TYPE || (column as any).displayType
  const refTableId = column.REF_TABLE_ID || (column as any).refTableId
  if (refTableId && displayType === 'foreign_key') return true

  return false
}

/**
 * 检查字段是否为选择类型字段
 */
export function isSelectColumn(column: Partial<SysColumn>): boolean {
  const setValueType = column.SET_VALUE_TYPE || (column as any).setValueType
  if (setValueType === 'select') return true

  if (column.SYS_DICT_ID || (column as any).sysDictId) return true

  const displayType = column.DISPLAY_TYPE || (column as any).displayType
  if (displayType === 'select') return true

  return false
}

/**
 * TableMask 权限位索引
 */
export const TableMaskIndex = {
  SHOW_IN_CREATE: 0,
  EDIT_IN_CREATE: 1,
  SHOW_IN_EDIT: 2,
  EDIT_IN_EDIT: 3,
  SHOW_IN_VIEW: 4,
} as const

/**
 * 检查字段在指定模式下是否应该显示
 */
export function shouldShowColumnInMode(column: Partial<SysColumn>, mode: FormMode): boolean {
  const mask = column.MASK || column.mask || ''

  let bitIndex: number
  switch (mode) {
    case 'create':
      bitIndex = TableMaskIndex.SHOW_IN_CREATE
      break
    case 'edit':
      bitIndex = TableMaskIndex.SHOW_IN_EDIT
      break
    case 'view':
    default:
      bitIndex = TableMaskIndex.SHOW_IN_VIEW
      break
  }

  if (mask.length > bitIndex) {
    return mask[bitIndex] === '1'
  }

  // 默认显示
  return true
}

/**
 * 检查字段在指定模式下是否应该可编辑
 */
export function shouldEditColumnInMode(column: Partial<SysColumn>, mode: FormMode): boolean {
  if (mode === 'view') return false

  const modifiAble = column.MODIFI_ABLE || (column as any).modifiAble
  if (modifiAble === 'N') return false

  const mask = column.MASK || column.mask || ''

  let bitIndex: number
  switch (mode) {
    case 'create':
      bitIndex = TableMaskIndex.EDIT_IN_CREATE
      break
    case 'edit':
      bitIndex = TableMaskIndex.EDIT_IN_EDIT
      break
    default:
      return false
  }

  if (mask.length > bitIndex) {
    return mask[bitIndex] === '1'
  }

  // 默认可编辑
  return true
}

/**
 * 检查表是否有指定权限
 */
export function hasTablePermission(table: Partial<SysTable>, permission: string): boolean {
  const mask = table.MASK || table.mask || ''
  return mask.includes(permission)
}

/**
 * 安全解析 PROPS JSON 字符串
 */
export function parsePropsSafe(propsStr: string | undefined | null): Record<string, any> {
  if (!propsStr) return {}
  try {
    const parsed = JSON.parse(propsStr)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * 获取字段显示名称
 */
export function getColumnDisplayName(column: Partial<SysColumn>): string {
  return column.DISPLAY_NAME || (column as any).displayName || column.DB_NAME || (column as any).dbName || ''
}

/**
 * 获取字段数据库名称
 */
export function getColumnDbName(column: Partial<SysColumn>): string {
  return column.DB_NAME || (column as any).dbName || ''
}

/**
 * 获取表物理名称
 */
export function getTableName(table: Partial<SysTable>): string {
  return table.NAME || (table as any).name || ''
}

/**
 * 获取表显示名称
 */
export function getTableDisplayName(table: Partial<SysTable>): string {
  return table.DISPLAY_NAME || (table as any).displayName || table.NAME || (table as any).name || ''
}
