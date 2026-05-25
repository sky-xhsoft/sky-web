import { describe, it, expect, beforeEach, vi } from 'vitest'
import { requestCache, RequestCache } from '@/api/cache'

describe('requestCache', () => {
  beforeEach(() => {
    requestCache.clear()
  })

  it('returns null for uncached keys', () => {
    expect(requestCache.get('test')).toBeNull()
  })

  it('stores and retrieves data', () => {
    const data = { id: 1, name: 'test' }
    requestCache.set('key1', data)
    expect(requestCache.get('key1')).toEqual(data)
  })

  it('respects TTL expiration', async () => {
    requestCache.set('key1', 'data', 10) // 10ms TTL
    await new Promise((r) => setTimeout(r, 20))
    expect(requestCache.get('key1')).toBeNull()
  })

  it('deletes specific keys', () => {
    requestCache.set('key1', 'a')
    requestCache.set('key2', 'b')
    requestCache.delete('key1')
    expect(requestCache.get('key1')).toBeNull()
    expect(requestCache.get('key2')).toBe('b')
  })

  it('clears by prefix', () => {
    requestCache.set('prefix:a', 1)
    requestCache.set('prefix:b', 2)
    requestCache.set('other:c', 3)
    requestCache.clearPrefix('prefix')
    expect(requestCache.get('prefix:a')).toBeNull()
    expect(requestCache.get('prefix:b')).toBeNull()
    expect(requestCache.get('other:c')).toBe(3)
  })

  it('clears all', () => {
    requestCache.set('a', 1)
    requestCache.set('b', 2)
    requestCache.clear()
    expect(requestCache.get('a')).toBeNull()
    expect(requestCache.get('b')).toBeNull()
  })

  it('generates consistent keys from makeKey', () => {
    const key1 = RequestCache.makeKey('GET', '/api/test', { id: 1 })
    const key2 = RequestCache.makeKey('GET', '/api/test', { id: 1 })
    const key3 = RequestCache.makeKey('GET', '/api/test', { id: 2 })
    expect(key1).toBe(key2)
    expect(key1).not.toBe(key3)
  })
})
