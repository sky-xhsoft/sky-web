import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCloudSort } from './useCloudSort'

describe('useCloudSort', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes sort options', () => {
    const { sortOptions } = useCloudSort()
    expect(sortOptions.length).toBe(3)
    expect(sortOptions.map((o) => o.value)).toEqual(['name', 'size', 'date'])
  })

  it('returns the current sort option based on sortBy', () => {
    const { currentSortOption } = useCloudSort()
    expect(currentSortOption.value).toBeDefined()
    expect(currentSortOption.value.value).toBeDefined()
  })

  it('exposes sortOrderIcon as arrow', () => {
    const { sortOrderIcon } = useCloudSort()
    expect(['↑', '↓']).toContain(sortOrderIcon.value)
  })

  it('exposes sortOrderText', () => {
    const { sortOrderText } = useCloudSort()
    expect(['升序', '降序']).toContain(sortOrderText.value)
  })

  it('exposes sortDescription combining option and order', () => {
    const { sortDescription, currentSortOption, sortOrderText } = useCloudSort()
    expect(sortDescription.value).toContain(currentSortOption.value.label)
    expect(sortDescription.value).toContain(sortOrderText.value)
  })

  it('isDefaultSort is true by default', () => {
    const { isDefaultSort, sortBy, sortOrder } = useCloudSort()
    expect(sortBy.value).toBe('name')
    expect(sortOrder.value).toBe('asc')
    expect(isDefaultSort.value).toBe(true)
  })

  it('toggles sort order', () => {
    const { sortOrder, toggleSortOrder, isDefaultSort } = useCloudSort()
    expect(sortOrder.value).toBe('asc')
    toggleSortOrder()
    expect(sortOrder.value).toBe('desc')
    expect(isDefaultSort.value).toBe(false)
  })

  it('setSortBy changes sort field', () => {
    const { sortBy, setSortBy } = useCloudSort()
    setSortBy('size')
    expect(sortBy.value).toBe('size')
  })

  it('resetSort returns to default (name asc)', () => {
    const { sortBy, sortOrder, setSortBy, toggleSortOrder, resetSort } = useCloudSort()
    setSortBy('size')
    toggleSortOrder()
    expect(sortBy.value).toBe('size')
    expect(sortOrder.value).toBe('desc')

    resetSort()
    expect(sortBy.value).toBe('name')
    expect(sortOrder.value).toBe('asc')
  })

  it('smartToggle switches direction when same field', () => {
    const { sortBy, sortOrder, smartToggle } = useCloudSort()
    expect(sortBy.value).toBe('name')
    expect(sortOrder.value).toBe('asc')

    smartToggle('name')
    expect(sortOrder.value).toBe('desc')

    smartToggle('name')
    expect(sortOrder.value).toBe('asc')
  })

  it('smartToggle on date defaults to desc', () => {
    const { sortBy, sortOrder, smartToggle } = useCloudSort()
    smartToggle('date')
    expect(sortBy.value).toBe('date')
    expect(sortOrder.value).toBe('desc')
  })

  it('sortByName/Size/Date quick methods', () => {
    const { sortBy, sortByName, sortBySize, sortByDate } = useCloudSort()

    sortBySize('desc')
    expect(sortBy.value).toBe('size')

    sortByDate('asc')
    expect(sortBy.value).toBe('date')

    sortByName('asc')
    expect(sortBy.value).toBe('name')
  })
})