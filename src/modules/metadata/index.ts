/**
 * 元数据驱动动态表单系统 - 公共导出
 */

// ==================== 组件 ====================

// 动态表单组件
export { DynamicForm } from './components/DynamicForm'

// 动态表格组件
export { DynamicTable } from './components/DynamicTable'

// 字段渲染器组件
export { default as TextField } from './components/FieldRenderers/TextField.vue'
export { default as TextareaField } from './components/FieldRenderers/TextareaField.vue'
export { default as NumberField } from './components/FieldRenderers/NumberField.vue'
export { default as SelectField } from './components/FieldRenderers/SelectField.vue'
export { default as CheckboxField } from './components/FieldRenderers/CheckboxField.vue'
export { default as DateField } from './components/FieldRenderers/DateField.vue'
export { default as DatetimeField } from './components/FieldRenderers/DatetimeField.vue'

// 视图组件
export { default as MetadataListView } from './views/MetadataListView.vue'
export { default as MetadataSimpleListView } from './views/MetadataSimpleListView.vue'
export { default as MetadataFormView } from './views/MetadataFormView.vue'

// ==================== Composables ====================

export { useDynamicForm } from './composables/useDynamicForm'
export { useDynamicList } from './composables/useDynamicList'
export { useFieldRenderer } from './composables/useFieldRenderer'

// ==================== Stores ====================

export { useMetadataStore } from './stores/useMetadataStore'
export { useDynamicFormStore } from './stores/useDynamicFormStore'
export { useDynamicTableStore } from './stores/useDynamicTableStore'
export { useDictStore } from './stores/useDictStore'

// ==================== Types ====================

export type {
  // 核心实体类型
  Subsystem,
  TableCategory,
  SysTable,
  SysColumn,
  SysDict,

  // 辅助类型
  FormMode,
  FieldValue,
  FormData,
  ValidationRule,
  TableConfig,

  // 树形结构类型
  TreeNode,

  // 选项类型
  SelectOption,
  TreeSelectOption,

  // 请求响应类型
  PageResponse,
  ApiResponse
} from './types'

// ==================== API ====================

export * as metadataApi from './api/metadata'

// ==================== 工具函数 ====================

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化日期
 */
export function formatDate(value: any): string {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 格式化日期时间
 */
export function formatDateTime(value: any): string {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 检查是否为状态字段
 */
export function isStatusColumn(fieldName: string): boolean {
  const statusKeywords = ['STATUS', 'STATE', 'IS_ACTIVE', 'IS_ENABLED', 'IS_VALID']
  const upperName = fieldName.toUpperCase()
  return statusKeywords.some(keyword => upperName.includes(keyword))
}

/**
 * 检查是否为日期字段
 */
export function isDateColumn(fieldName: string): boolean {
  const dateKeywords = ['_DATE', 'DATE_']
  const upperName = fieldName.toUpperCase()
  return dateKeywords.some(keyword => upperName.includes(keyword)) &&
         !upperName.includes('TIME') &&
         !upperName.includes('DATETIME')
}

/**
 * 检查是否为日期时间字段
 */
export function isDateTimeColumn(fieldName: string): boolean {
  const datetimeKeywords = ['_TIME', 'TIME_', 'DATETIME', 'TIMESTAMP']
  const upperName = fieldName.toUpperCase()
  return datetimeKeywords.some(keyword => upperName.includes(keyword))
}

/**
 * 获取状态颜色
 */
export function getStatusColor(value: any): string {
  if (value === 'Y' || value === '1' || value === true || value === 'active' || value === 'enabled') {
    return 'green'
  }
  if (value === 'N' || value === '0' || value === false || value === 'inactive' || value === 'disabled') {
    return 'red'
  }
  return 'gray'
}

/**
 * 获取状态文本
 */
export function getStatusText(value: any): string {
  if (value === 'Y' || value === '1' || value === true) {
    return '启用'
  }
  if (value === 'N' || value === '0' || value === false) {
    return '禁用'
  }
  if (value === 'active') return '激活'
  if (value === 'inactive') return '未激活'
  if (value === 'enabled') return '已启用'
  if (value === 'disabled') return '已禁用'
  return String(value || '-')
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    }
  }
}
