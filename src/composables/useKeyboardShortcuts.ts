/**
 * useKeyboardShortcuts - 键盘快捷键支持
 *
 * 使用示例：
 * useKeyboardShortcuts({
 *   'ctrl+s': () => save(),
 *   'ctrl+/': () => showHelp(),
 *   'esc': () => close(),
 * })
 */
import { onMounted, onBeforeUnmount } from 'vue'

export type ShortcutHandler = (e: KeyboardEvent) => void
export type ShortcutMap = Record<string, ShortcutHandler>

interface Options {
  /** 是否在 input/textarea 中也触发（默认 false） */
  enableInForm?: boolean
  /** 是否阻止默认行为（默认 true） */
  preventDefault?: boolean
  /** 监听的目标元素（默认 window） */
  target?: EventTarget | (() => EventTarget | null)
}

/**
 * 解析快捷键字符串，返回标准化的 key（lowercase, modifier+key）
 * 例: "Ctrl+S" -> "ctrl+s", "Cmd+/" -> "meta+/"
 */
function normalizeShortcut(shortcut: string): string {
  return shortcut
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/cmd/g, 'meta')
    .split('+')
    .sort((a, b) => {
      // modifier 排序固定：ctrl > meta > alt > shift > key
      const order: Record<string, number> = { ctrl: 0, meta: 1, alt: 2, shift: 3 }
      const aOrder = order[a] ?? 99
      const bOrder = order[b] ?? 99
      return aOrder - bOrder
    })
    .join('+')
}

/**
 * 从事件构建标准化快捷键字符串
 */
function getEventShortcut(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('ctrl')
  if (e.metaKey) parts.push('meta')
  if (e.altKey) parts.push('alt')
  if (e.shiftKey) parts.push('shift')

  // 键名规范化
  let key = e.key.toLowerCase()
  if (key === ' ') key = 'space'
  if (key === 'escape') key = 'esc'
  if (key === 'arrowup') key = 'up'
  if (key === 'arrowdown') key = 'down'
  if (key === 'arrowleft') key = 'left'
  if (key === 'arrowright') key = 'right'

  // 排除单独按 modifier 键的情况
  if (['control', 'meta', 'alt', 'shift'].includes(key)) {
    return ''
  }

  parts.push(key)
  return parts.join('+')
}

/**
 * 注册键盘快捷键
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, options: Options = {}) {
  const {
    enableInForm = false,
    preventDefault = true,
    target = typeof window !== 'undefined' ? window : null,
  } = options

  // 预先标准化所有 shortcut keys
  const normalized: ShortcutMap = {}
  for (const [key, handler] of Object.entries(shortcuts)) {
    normalized[normalizeShortcut(key)] = handler
  }

  function handler(e: KeyboardEvent) {
    // 在表单元素中默认不触发
    if (!enableInForm) {
      const t = e.target as HTMLElement
      const tag = t?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || t?.isContentEditable) {
        return
      }
    }

    const shortcut = getEventShortcut(e)
    if (!shortcut) return

    const fn = normalized[shortcut]
    if (fn) {
      if (preventDefault) {
        e.preventDefault()
      }
      fn(e)
    }
  }

  let attachedTarget: EventTarget | null = null

  onMounted(() => {
    attachedTarget = typeof target === 'function' ? target() : target
    if (attachedTarget) {
      attachedTarget.addEventListener('keydown', handler as EventListener)
    }
  })

  onBeforeUnmount(() => {
    if (attachedTarget) {
      attachedTarget.removeEventListener('keydown', handler as EventListener)
    }
  })

  return {
    /** 手动触发快捷键检查（用于测试） */
    trigger: handler,
  }
}

/**
 * 导出工具函数供测试
 */
export const _internals = {
  normalizeShortcut,
  getEventShortcut,
}
