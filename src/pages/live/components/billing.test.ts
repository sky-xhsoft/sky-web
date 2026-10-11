import { describe, expect, it } from 'vitest'
import {
  accountLabel, formatGB, formatMinutes, formatMoney, formatQty, formatSeconds, formatSigned, formatUnitPrice,
  quotaPercent, recentMonths, yuanToLi, yuanToUnitPrice,
} from './billing'

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
    expect(formatGB(0.00001)).toBe('< 0.1 MB')
    expect(formatGB(0.5)).toBe('512 MB')
    expect(formatGB(1282.5253)).toBe('1,282.53 GB')
  })
  it('账号与月份', () => {
    expect(accountLabel('global')).toBe('平台账号')
    expect(accountLabel('tc:0072ca1905')).toBe('自有账号 0072ca1905')
    expect(recentMonths(new Date(2026, 0, 15), 3)).toEqual(['2026-01', '2025-12', '2025-11'])
  })
})

describe('金额与单价', () => {
  it('金额', () => {
    expect(formatMoney(1286400)).toBe('¥ 1,286.40')
    expect(formatMoney(-3000)).toBe('-¥ 3.00')
    expect(formatMoney(5)).toBe('¥ 0.01')
    expect(formatSigned(100000)).toBe('+¥ 100.00')
    expect(formatSigned(-50)).toBe('-¥ 0.05')
    expect(yuanToLi(12.345)).toBe(12345)
    expect(yuanToLi(0.1 + 0.2)).toBe(300)
  })
  it('单价与用量', () => {
    expect(yuanToUnitPrice(0.05)).toBe(500)
    expect(yuanToUnitPrice(0.0025)).toBe(25)
    expect(formatUnitPrice('live_duration', 500)).toBe('¥ 0.05 / 分钟')
    expect(formatUnitPrice('storage', 3100)).toBe('¥ 0.31 / GB·月')
    expect(formatQty('live_duration', 1234.4)).toBe('1,234 分钟')
    expect(formatQty('play_flux', 1.23456)).toBe('1.235 GB')
    expect(quotaPercent(50, 200)).toBe(25)
    expect(quotaPercent(300, 200)).toBe(100)
    expect(quotaPercent(1, 0)).toBe(0)
  })
})
