import { describe, it, expect } from 'vitest'
import { _internals } from './useKeyboardShortcuts'

const { normalizeShortcut, getEventShortcut } = _internals

describe('normalizeShortcut', () => {
  it('lowercases keys', () => {
    expect(normalizeShortcut('Ctrl+S')).toBe('ctrl+s')
  })

  it('removes spaces', () => {
    expect(normalizeShortcut('Ctrl + S')).toBe('ctrl+s')
  })

  it('maps cmd to meta', () => {
    expect(normalizeShortcut('Cmd+S')).toBe('meta+s')
  })

  it('sorts modifiers consistently', () => {
    expect(normalizeShortcut('S+Ctrl')).toBe('ctrl+s')
    expect(normalizeShortcut('Alt+Ctrl+S')).toBe('ctrl+alt+s')
    expect(normalizeShortcut('Shift+Ctrl+A')).toBe('ctrl+shift+a')
  })

  it('handles single keys', () => {
    expect(normalizeShortcut('Esc')).toBe('esc')
  })
})

describe('getEventShortcut', () => {
  it('extracts key + modifiers from event', () => {
    const e = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    expect(getEventShortcut(e)).toBe('ctrl+s')
  })

  it('returns empty for modifier-only events', () => {
    const e = new KeyboardEvent('keydown', { key: 'Control' })
    expect(getEventShortcut(e)).toBe('')
  })

  it('normalizes space key', () => {
    const e = new KeyboardEvent('keydown', { key: ' ' })
    expect(getEventShortcut(e)).toBe('space')
  })

  it('normalizes arrow keys', () => {
    const up = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    const down = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    expect(getEventShortcut(up)).toBe('up')
    expect(getEventShortcut(down)).toBe('down')
  })

  it('handles multiple modifiers', () => {
    const e = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
    })
    expect(getEventShortcut(e)).toBe('ctrl+shift+a')
  })
})
