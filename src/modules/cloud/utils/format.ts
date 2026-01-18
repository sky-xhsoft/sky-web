/**
 * 格式化工具函数
 *
 * 提供文件大小、日期等格式化功能
 */

/**
 * 格式化文件大小
 *
 * @param bytes 字节数
 * @param decimals 小数位数，默认1
 * @returns 格式化后的字符串，如 "1.5 MB"
 *
 * @example
 * formatSize(0) // "0 B"
 * formatSize(1024) // "1.0 KB"
 * formatSize(1536) // "1.5 KB"
 * formatSize(1048576) // "1.0 MB"
 * formatSize(1073741824) // "1.0 GB"
 */
export function formatSize(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B'
  if (bytes < 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)

  return `${size.toFixed(dm)} ${sizes[i]}`
}

/**
 * 格式化日期时间
 *
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式类型，默认 'datetime'
 * @returns 格式化后的字符串
 *
 * @example
 * formatDate('2026-01-13T10:00:00Z') // "01-13 10:00"
 * formatDate('2026-01-13T10:00:00Z', 'date') // "2026-01-13"
 * formatDate('2026-01-13T10:00:00Z', 'time') // "10:00"
 * formatDate('2026-01-13T10:00:00Z', 'full') // "2026-01-13 10:00:00"
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  format: 'datetime' | 'date' | 'time' | 'full' = 'datetime'
): string {
  if (!date) return ''

  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    // 检查是否为有效日期
    if (isNaN(d.getTime())) return ''

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    switch (format) {
      case 'date':
        return `${year}-${month}-${day}`
      case 'time':
        return `${hours}:${minutes}`
      case 'datetime':
        return `${month}-${day} ${hours}:${minutes}`
      case 'full':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      default:
        return `${month}-${day} ${hours}:${minutes}`
    }
  } catch (error) {
    console.error('formatDate error:', error)
    return ''
  }
}

/**
 * 格式化相对时间（如"刚刚"、"5分钟前"）
 *
 * @param date 日期对象、时间戳或日期字符串
 * @returns 相对时间字符串
 *
 * @example
 * formatRelativeTime(new Date()) // "刚刚"
 * formatRelativeTime(Date.now() - 60000) // "1分钟前"
 * formatRelativeTime(Date.now() - 3600000) // "1小时前"
 */
export function formatRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return ''

  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) return '刚刚'
    if (diffMinutes < 60) return `${diffMinutes}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    // 超过7天显示具体日期
    return formatDate(d, 'datetime')
  } catch (error) {
    console.error('formatRelativeTime error:', error)
    return ''
  }
}

/**
 * 格式化速度
 *
 * @param bytesPerSecond 每秒字节数
 * @returns 格式化后的速度字符串，如 "1.5 MB/s"
 *
 * @example
 * formatSpeed(0) // "0 B/s"
 * formatSpeed(1024) // "1.0 KB/s"
 * formatSpeed(1572864) // "1.5 MB/s"
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatSize(bytesPerSecond)}/s`
}

/**
 * 格式化剩余时间
 *
 * @param seconds 剩余秒数
 * @returns 格式化后的时间字符串，如 "5分30秒"
 *
 * @example
 * formatRemainingTime(0) // "0秒"
 * formatRemainingTime(30) // "30秒"
 * formatRemainingTime(90) // "1分30秒"
 * formatRemainingTime(3665) // "1小时1分5秒"
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return '计算中...'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`)

  return parts.join('')
}

/**
 * 格式化百分比
 *
 * @param value 百分比值（0-100）
 * @param decimals 小数位数，默认1
 * @returns 格式化后的百分比字符串
 *
 * @example
 * formatPercentage(0) // "0.0%"
 * formatPercentage(50) // "50.0%"
 * formatPercentage(99.99) // "100.0%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const clamped = Math.min(100, Math.max(0, value))
  return `${clamped.toFixed(decimals)}%`
}
