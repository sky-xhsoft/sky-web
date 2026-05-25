import { describe, it, expect, beforeEach } from 'vitest'
import { useForeignKeyCache } from './useForeignKeyCache'

describe('useForeignKeyCache', () => {
  const cache = useForeignKeyCache()

  beforeEach(() => {
    cache.clear()
  })

  describe('display value cache', () => {
    it('returns null for uncached values', () => {
      expect(cache.getDisplayValue(1, '123')).toBeNull()
    })

    it('stores and retrieves display values', () => {
      cache.setDisplayValue(1, '123', 'Test Value')
      expect(cache.getDisplayValue(1, '123')).toBe('Test Value')
    })

    it('uses columnId in cache key', () => {
      cache.setDisplayValue(1, '123', 'Name A', 10)
      cache.setDisplayValue(1, '123', 'Name B', 20)
      expect(cache.getDisplayValue(1, '123', 10)).toBe('Name A')
      expect(cache.getDisplayValue(1, '123', 20)).toBe('Name B')
    })

    it('returns null when columnId doesnt match', () => {
      cache.setDisplayValue(1, '123', 'Name A', 10)
      expect(cache.getDisplayValue(1, '123', 20)).toBeNull()
    })
  })

  describe('options cache', () => {
    it('returns null for uncached options', () => {
      expect(cache.getOptions('test-key')).toBeNull()
    })

    it('stores and retrieves options', () => {
      const options = [{ value: 1, label: 'A' }, { value: 2, label: 'B' }]
      cache.setOptions('test-key', options)
      expect(cache.getOptions('test-key')).toEqual(options)
    })
  })

  describe('pending requests', () => {
    it('returns null when no pending request', () => {
      expect(cache.getPendingRequest('key-1')).toBeNull()
    })

    it('stores and removes pending requests', () => {
      const promise = Promise.resolve('result')
      cache.setPendingRequest('key-1', promise)
      expect(cache.getPendingRequest('key-1')).toBe(promise)

      cache.removePendingRequest('key-1')
      expect(cache.getPendingRequest('key-1')).toBeNull()
    })
  })

  describe('clear', () => {
    it('clears all caches', () => {
      cache.setDisplayValue(1, '1', 'A')
      cache.setOptions('key', [{ value: 1, label: 'A' }])
      cache.setPendingRequest('key', Promise.resolve('x'))

      cache.clear()

      expect(cache.getDisplayValue(1, '1')).toBeNull()
      expect(cache.getOptions('key')).toBeNull()
      expect(cache.getPendingRequest('key')).toBeNull()
    })
  })
})
