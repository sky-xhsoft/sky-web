import { describe, expect, it } from 'vitest'
import { formatDateTime } from './date'

describe('formatDateTime', () => {
  const local = (y: number, m: number, d: number, h: number, mi: number, s: number) => new Date(y, m - 1, d, h, mi, s)

  it('秒级时间戳（录制、切片回调的开始/结束时间）', () => {
    const t = local(2026, 10, 11, 17, 2, 23)
    expect(formatDateTime(Math.floor(t.getTime() / 1000))).toBe('2026-10-11 17:02:23')
  })

  it('毫秒时间戳', () => {
    expect(formatDateTime(local(2026, 10, 11, 17, 2, 23).getTime())).toBe('2026-10-11 17:02:23')
  })

  it('字符串与 Date 保持原样处理', () => {
    expect(formatDateTime('2026-10-11T17:02:23')).toBe('2026-10-11 17:02:23')
    expect(formatDateTime(local(2026, 1, 2, 3, 4, 5), 'YYYY-MM-DD HH:mm')).toBe('2026-01-02 03:04')
  })

  it('空值和 0 显示 -', () => {
    expect(formatDateTime(0)).toBe('-')
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime('not a date')).toBe('-')
  })
})
