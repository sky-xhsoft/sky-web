import { describe, expect, it } from 'vitest'
import { accountLabel, formatGB, formatMinutes, formatSeconds, recentMonths } from './billing'

describe('费用中心显示规则', () => {
  it('直播时长', () => {
    expect(formatMinutes(0)).toBe('0 分钟')
    expect(formatMinutes(45)).toBe('45 分钟')
    expect(formatMinutes(185)).toBe('3 小时 05 分')
    expect(formatMinutes(60 * 1234)).toBe('1,234 小时 00 分')
  })
  it('推流时长', () => {
    expect(formatSeconds(65)).toBe('1:05')
    expect(formatSeconds(3725)).toBe('1:02:05')
    expect(formatSeconds(-3)).toBe('0:00')
  })
  it('流量与存储', () => {
    expect(formatGB(0)).toBe('0 GB')
    expect(formatGB(0.005)).toBe('5.1 MB')
    expect(formatGB(0.5)).toBe('512 MB')
    expect(formatGB(1282.5253)).toBe('1,282.53 GB')
  })
  it('账号与月份', () => {
    expect(accountLabel('global')).toBe('平台账号')
    expect(accountLabel('tc:0072ca1905')).toBe('自有账号 0072ca1905')
    expect(recentMonths(new Date(2026, 0, 15), 3)).toEqual(['2026-01', '2025-12', '2025-11'])
  })
})
