/**
 * format.ts 工具函数单元测试
 */

import { describe, it, expect } from 'vitest'
import {
  formatSize,
  formatDate,
  formatRelativeTime,
  formatSpeed,
  formatRemainingTime,
  formatPercentage,
} from '@/modules/cloud/utils/format'

describe('formatSize', () => {
  it('应该正确格式化0字节', () => {
    expect(formatSize(0)).toBe('0 B')
  })

  it('应该正确格式化字节', () => {
    expect(formatSize(100)).toBe('100.0 B')
    expect(formatSize(512)).toBe('512.0 B')
  })

  it('应该正确格式化KB', () => {
    expect(formatSize(1024)).toBe('1.0 KB')
    expect(formatSize(1536)).toBe('1.5 KB')
    expect(formatSize(2048)).toBe('2.0 KB')
  })

  it('应该正确格式化MB', () => {
    expect(formatSize(1048576)).toBe('1.0 MB')
    expect(formatSize(1572864)).toBe('1.5 MB')
    expect(formatSize(10485760)).toBe('10.0 MB')
  })

  it('应该正确格式化GB', () => {
    expect(formatSize(1073741824)).toBe('1.0 GB')
    expect(formatSize(5368709120)).toBe('5.0 GB')
  })

  it('应该正确格式化TB', () => {
    expect(formatSize(1099511627776)).toBe('1.0 TB')
  })

  it('应该支持自定义小数位数', () => {
    expect(formatSize(1536, 0)).toBe('2 KB')
    expect(formatSize(1536, 2)).toBe('1.50 KB')
  })

  it('应该处理负数', () => {
    expect(formatSize(-100)).toBe('0 B')
  })
})

describe('formatDate', () => {
  it('应该正确格式化日期时间', () => {
    const date = new Date('2026-01-13T10:30:45Z')
    const result = formatDate(date, 'datetime')
    // 注意：结果会根据本地时区而不同，这里假设UTC+8
    expect(result).toMatch(/^\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('应该正确格式化日期', () => {
    const date = new Date('2026-01-13T10:30:45Z')
    const result = formatDate(date, 'date')
    expect(result).toMatch(/^2026-\d{2}-\d{2}$/)
  })

  it('应该正确格式化时间', () => {
    const date = new Date('2026-01-13T10:30:45Z')
    const result = formatDate(date, 'time')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('应该正确格式化完整日期时间', () => {
    const date = new Date('2026-01-13T10:30:45Z')
    const result = formatDate(date, 'full')
    expect(result).toMatch(/^2026-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('应该处理字符串日期', () => {
    const result = formatDate('2026-01-13T10:30:45Z', 'date')
    expect(result).toMatch(/^2026-\d{2}-\d{2}$/)
  })

  it('应该处理时间戳', () => {
    const timestamp = new Date('2026-01-13T10:30:45Z').getTime()
    const result = formatDate(timestamp, 'date')
    expect(result).toMatch(/^2026-\d{2}-\d{2}$/)
  })

  it('应该处理null和undefined', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('应该处理无效日期', () => {
    expect(formatDate('invalid-date')).toBe('')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date()

  it('应该显示"刚刚"', () => {
    expect(formatRelativeTime(now)).toBe('刚刚')
    expect(formatRelativeTime(new Date(now.getTime() - 30 * 1000))).toBe('刚刚')
  })

  it('应该显示"X分钟前"', () => {
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1分钟前')

    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5分钟前')
  })

  it('应该显示"X小时前"', () => {
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    expect(formatRelativeTime(oneHourAgo)).toBe('1小时前')

    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(threeHoursAgo)).toBe('3小时前')
  })

  it('应该显示"X天前"', () => {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(oneDayAgo)).toBe('1天前')

    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(threeDaysAgo)).toBe('3天前')
  })

  it('超过7天应该显示具体日期', () => {
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(eightDaysAgo)
    expect(result).toMatch(/^\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('应该处理null和undefined', () => {
    expect(formatRelativeTime(null)).toBe('')
    expect(formatRelativeTime(undefined)).toBe('')
  })
})

describe('formatSpeed', () => {
  it('应该正确格式化速度', () => {
    expect(formatSpeed(0)).toBe('0 B/s')
    expect(formatSpeed(1024)).toBe('1.0 KB/s')
    expect(formatSpeed(1572864)).toBe('1.5 MB/s')
  })
})

describe('formatRemainingTime', () => {
  it('应该正确格式化秒', () => {
    expect(formatRemainingTime(0)).toBe('计算中...')
    expect(formatRemainingTime(30)).toBe('30秒')
    expect(formatRemainingTime(59)).toBe('59秒')
  })

  it('应该正确格式化分钟', () => {
    expect(formatRemainingTime(60)).toBe('1分')
    expect(formatRemainingTime(90)).toBe('1分30秒')
    expect(formatRemainingTime(150)).toBe('2分30秒')
  })

  it('应该正确格式化小时', () => {
    expect(formatRemainingTime(3600)).toBe('1小时')
    expect(formatRemainingTime(3665)).toBe('1小时1分5秒')
    expect(formatRemainingTime(7200)).toBe('2小时')
  })

  it('应该处理无穷大', () => {
    expect(formatRemainingTime(Infinity)).toBe('计算中...')
    expect(formatRemainingTime(-Infinity)).toBe('计算中...')
  })

  it('应该处理负数', () => {
    expect(formatRemainingTime(-10)).toBe('计算中...')
  })
})

describe('formatPercentage', () => {
  it('应该正确格式化百分比', () => {
    expect(formatPercentage(0)).toBe('0.0%')
    expect(formatPercentage(50)).toBe('50.0%')
    expect(formatPercentage(100)).toBe('100.0%')
  })

  it('应该钳制范围在0-100', () => {
    expect(formatPercentage(-10)).toBe('0.0%')
    expect(formatPercentage(150)).toBe('100.0%')
  })

  it('应该支持自定义小数位数', () => {
    expect(formatPercentage(50.5, 0)).toBe('51%')  // 四舍五入到整数
    expect(formatPercentage(50.5, 2)).toBe('50.50%')
  })
})
