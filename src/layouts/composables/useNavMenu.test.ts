import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { _internals } from './useNavMenu'

const { mapMenu, buildKeyPathMap } = _internals

describe('mapMenu', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns empty array for non-array input', () => {
    expect(mapMenu(null as any)).toEqual([])
    expect(mapMenu(undefined as any)).toEqual([])
    expect(mapMenu('string' as any)).toEqual([])
  })

  it('returns empty array for empty input', () => {
    expect(mapMenu([])).toEqual([])
  })

  it('maps items with path field', () => {
    const result = mapMenu([
      { path: '/home', title: 'Home', orderno: 1 },
      { path: '/about', title: 'About', orderno: 2 },
    ])
    expect(result).toHaveLength(2)
    expect(result[0].path).toBe('/home')
    expect(result[0].title).toBe('Home')
  })

  it('uses url if path is missing', () => {
    const result = mapMenu([{ url: '/users', title: 'Users', orderno: 1 }])
    expect(result[0].path).toBe('/users')
  })

  it('sorts by orderno ascending', () => {
    const result = mapMenu([
      { path: '/b', title: 'B', orderno: 20 },
      { path: '/a', title: 'A', orderno: 10 },
    ])
    expect(result[0].title).toBe('A')
    expect(result[1].title).toBe('B')
  })

  it('recursively processes children', () => {
    const result = mapMenu([
      {
        path: '/parent',
        title: 'Parent',
        orderno: 1,
        children: [
          { path: '/parent/child', title: 'Child', orderno: 1 },
        ],
      },
    ])
    expect(result[0].children).toHaveLength(1)
    expect(result[0].children?.[0].title).toBe('Child')
  })
})

describe('buildKeyPathMap', () => {
  it('builds map from flat items', () => {
    const items = [
      { key: 'home', title: 'Home', path: '/home' },
      { key: 'about', title: 'About', path: '/about' },
    ]
    const map = buildKeyPathMap(items)
    expect(map.size).toBe(2)
    expect(map.get('home')).toBe('/home')
    expect(map.get('about')).toBe('/about')
  })

  it('handles nested children', () => {
    const items = [
      {
        key: 'parent',
        title: 'Parent',
        path: '/parent',
        children: [{ key: 'child', title: 'Child', path: '/parent/child' }],
      },
    ]
    const map = buildKeyPathMap(items)
    expect(map.get('parent')).toBe('/parent')
    expect(map.get('child')).toBe('/parent/child')
  })

  it('skips items without path', () => {
    const items = [{ key: 'no-path', title: 'No Path' }]
    const map = buildKeyPathMap(items)
    expect(map.has('no-path')).toBe(false)
  })

  it('handles empty array', () => {
    expect(buildKeyPathMap([]).size).toBe(0)
  })
})
