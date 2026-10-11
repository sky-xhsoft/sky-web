import { describe, expect, it } from 'vitest'
import { cnameHost, defaultCname } from './useDomainList'

describe('域名 CNAME 解析', () => {
  it('主机记录去掉主域名', () => {
    expect(cnameHost('skyttt.skyzhou.cn')).toBe('skyttt')
    expect(cnameHost('push.live.skyzhou.cn')).toBe('push.live')
    expect(cnameHost('skyzhou.cn')).toBe('@')
    expect(cnameHost('live.example.com.cn')).toBe('live')
    expect(cnameHost('example.com.cn')).toBe('@')
  })

  it('默认 CNAME 按域名类型区分', () => {
    expect(defaultCname('skyttt.skyzhou.cn', 0)).toBe('skyttt.skyzhou.cn.tlivepush.com')
    expect(defaultCname('play.skyzhou.cn', 1)).toBe('play.skyzhou.cn.txlivecdn.com')
  })
})
