/**
 * 格式化工具函数
 */

/**
 * 格式化日期时间为：YYYY-MM-DD HH:mm:ss
 * @param value 日期值（Date对象、时间戳或日期字符串）
 * @returns 格式化后的字符串，如果无效则返回 '-'
 */
export function formatDateTime(value: any): string {
  if (!value) return '-'

  try {
    const date = new Date(value)

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('[formatDateTime] Invalid date:', value)
      return String(value)
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('[formatDateTime] Error formatting date:', value, error)
    return String(value)
  }
}

/**
 * 格式化日期为：YYYY-MM-DD
 * @param value 日期值
 * @returns 格式化后的字符串
 */
export function formatDate(value: any): string {
  if (!value) return '-'

  try {
    const date = new Date(value)

    if (isNaN(date.getTime())) {
      console.warn('[formatDate] Invalid date:', value)
      return String(value)
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('[formatDate] Error formatting date:', value, error)
    return String(value)
  }
}

/**
 * 格式化时间为：HH:mm:ss
 * @param value 时间值
 * @returns 格式化后的字符串
 */
export function formatTime(value: any): string {
  if (!value) return '-'

  try {
    const date = new Date(value)

    if (isNaN(date.getTime())) {
      return String(value)
    }

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${hours}:${minutes}:${seconds}`
  } catch (error) {
    return String(value)
  }
}
