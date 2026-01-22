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
 */
export interface SysTable {
  ID: number
  CATEGORY_ID: number        // 所属类别
  NAME: string              // 表单唯一标识
  DISPLAY_NAME: string      // 显示名称
  TABLE_NAME?: string       // 实际数据库表名
  DESCRIPTION?: string      // 描述

  // 主键配置
  PK?: string               // 主键字段名
  AK?: string               // 输入主键(Alternate Key)
  DK?: string               // 显示主键(Display Key)

  // 界面展示
  MASK?: string             // 权限掩码 (A:新增 M:修改 D:删除 Q:查询 S:提交 U:反提交 V:作废)
  ALLOW_BROWSE?: 'Y' | 'N'  // 允许翻阅
  BROWSE_AFTER_ADD?: 'Y' | 'N'   // 新增后翻阅
  BROWSE_AFTER_DELETE?: 'Y' | 'N' // 删除后翻阅

  // 扩展属性
  FILTER_CONDITION?: string  // 过滤条件 SQL
  PROPS?: string            // 扩展属性 JSON

  ORDERNO?: number
  IS_ACTIVE: 'Y' | 'N'
  CREATE_BY?: string
  CREATE_TIME?: string
  UPDATE_BY?: string
  UPDATE_TIME?: string
}

/**
 * 字段配置
 */
export interface SysColumn {
  ID: number
  TABLE_ID: number           // 所属表单
  DB_NAME: string           // 数据库字段名
  DISPLAY_NAME: string      // 显示名称

  // 字段类型
  DATA_TYPE: 'text' | 'int' | 'decimal' | 'date' | 'datetime' | 'char' | 'varchar'
  LENGTH?: number           // 字段长度
  DECIMAL_PLACES?: number   // 小数位数

  // 控件类型
  CONTROL_TYPE: 'text' | 'textarea' | 'number' | 'select' | 'radio' |
                'checkbox' | 'date' | 'datetime' | 'file' | 'image' |
                'foreign_key' | 'password' | 'email' | 'url'

  // 字典关联
  DICT_TABLE_ID?: number    // 字典表ID
  DICT_VALUE_FIELD?: string // 字典值字段
  DICT_DISPLAY_FIELD?: string // 字典显示字段
  SYS_DICT_ID?: string      // 字典ID（用于 select 类型）

  // 外键关联
  SET_VALUE_TYPE?: string       // 赋值方式（fk: 外键关联, select: 下拉选择）
  REF_TABLE_ID?: number         // 关联表ID（数据库字段：REF_TABLE_ID）
  REF_COLUMN_ID?: number        // 关联显示字段ID（数据库字段：REF_COLUMN_ID）
  REF_ON_DELETE?: 'noAction' | 'cascade' | 'setNull'  // 删除动作（数据库字段：REF_ON_DELETE）
  FK_TABLE_ID?: number          // 外键表ID（旧字段，向后兼容）
  FK_VALUE_FIELD?: string       // 外键值字段（旧字段，向后兼容）
  FK_DISPLAY_FIELD?: string     // 外键显示字段（旧字段，向后兼容）

  // 显示类型
  DISPLAY_TYPE?: string         // 显示类型（blank,button,hr,check,file,image,select,text,textarea,date,datetime,clob,xml,json）

  // 验证规则
  NULL_ABLE?: 'Y' | 'N'     // 是否可空
  DEFAULT_VALUE?: string    // 默认值
  REG_EXPRESSION?: string   // 正则表达式
  ERROR_MSG?: string        // 错误提示

  // 显示控制
  IS_VISIBLE?: 'Y' | 'N'    // 是否可见
  IS_READONLY?: 'Y' | 'N'   // 是否只读
  IS_EDITABLE_IN_GRID?: 'Y' | 'N' // 表格中可编辑
  IS_QUERY?: 'Y' | 'N'      // 是否作为查询条件
  SHOW_COLUMN_ID?: number   // 显示控制字段ID
  SHOW_COLUMN_VALUE?: string // 显示控制字段值

  // 界面布局
  GRID_WIDTH?: number       // 表格列宽度
  FORM_COLSPAN?: number     // 表单列跨度
  PLACEHOLDER?: string      // 占位符
  HELP_TEXT?: string        // 帮助文本

  ORDERNO?: number
  IS_ACTIVE: 'Y' | 'N'
  CREATE_BY?: string
  CREATE_TIME?: string
  UPDATE_BY?: string
  UPDATE_TIME?: string
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
export interface ForeignKeyOption {
  value: number | string
  label: string
  record?: Record<string, any>
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
