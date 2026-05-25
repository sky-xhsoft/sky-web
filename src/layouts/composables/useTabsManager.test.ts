import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTabsManager } from './useTabsManager'
import { useNavigationStore } from '../../stores/navigation'

describe('useTabsManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('returns expected API surface', () => {
    const mgr = useTabsManager()
    expect(typeof mgr.onTabChange).toBe('function')
    expect(typeof mgr.onTabClose).toBe('function')
    expect(typeof mgr.handleCloseOtherTabs).toBe('function')
    expect(typeof mgr.handleCloseAllTabs).toBe('function')
    expect(typeof mgr.handleTabContextMenu).toBe('function')
    expect(typeof mgr.closeContextMenu).toBe('function')
    expect(typeof mgr.refreshTab).toBe('function')
  })

  it('initial context menu state is closed', () => {
    const mgr = useTabsManager()
    expect(mgr.contextMenuVisible.value).toBe(false)
    expect(mgr.currentRightClickTabKey.value).toBe('')
  })

  it('handleTabContextMenu opens menu with position', () => {
    const mgr = useTabsManager()
    const fakeEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      clientX: 100,
      clientY: 200,
    } as unknown as MouseEvent

    mgr.handleTabContextMenu(fakeEvent, 'tab-1')
    expect(mgr.contextMenuVisible.value).toBe(true)
    expect(mgr.contextMenuPosition.value.x).toBe(100)
    expect(mgr.contextMenuPosition.value.y).toBe(200)
    expect(mgr.currentRightClickTabKey.value).toBe('tab-1')
  })

  it('closeContextMenu hides menu', () => {
    const mgr = useTabsManager()
    const fakeEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent
    mgr.handleTabContextMenu(fakeEvent, 'x')
    expect(mgr.contextMenuVisible.value).toBe(true)

    mgr.closeContextMenu()
    expect(mgr.contextMenuVisible.value).toBe(false)
  })

  it('onTabContextMenuClick with empty tab key does nothing', () => {
    const mgr = useTabsManager()
    // 未设置 currentRightClickTabKey，直接调用应该是 no-op
    expect(() => mgr.onTabContextMenuClick('refresh')).not.toThrow()
  })

  it('refreshTab on non-existent tab is safe', () => {
    const mgr = useTabsManager()
    expect(() => mgr.refreshTab('non-existent-key')).not.toThrow()
  })

  it('handleCloseAllTabs invokes navigation store', () => {
    const navStore = useNavigationStore()
    // 添加一些 tabs
    navStore.tabs.push({
      key: 't1',
      title: 'T1',
      componentName: 'A',
      params: {},
    })

    const mgr = useTabsManager()
    mgr.handleCloseAllTabs()
    expect(navStore.tabs.length).toBe(0)
  })
})
