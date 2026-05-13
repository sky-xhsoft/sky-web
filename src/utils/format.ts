/**
 * 格式化工具函数
 * 日期函数统一从 date.ts 导出，保证行为一致
 */

export { formatDateTime, formatDate, formatTime, formatRelativeTime, formatDuration } from './date'

/**
 * 格式化文件大小
 */
export function formatFileSize(size: number, decimals: number = 1): string {
  if (size === 0) return '0 B'
  if (size < 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(size) / Math.log(k))
  return `${(size / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`
}
