/**
 * useTabsManager - 标签页管理
 *
 * 从 BasicLayout 抽取的标签页操作逻辑
 * 封装标签切换、关闭、右键菜单等
 */
import { ref, nextTick } from 'vue'
import { useNavigationStore } from '../../stores/navigation'

export function useTabsManager() {
  const navigationStore = useNavigationStore()

  // 右键菜单状态
  const contextMenuVisible = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const currentRightClickTabKey = ref<string>('')

  /**
   * 处理标签页右键
   */
  function handleTabContextMenu(e: MouseEvent, key: string) {
    e.preventDefault()
    e.stopPropagation()
    currentRightClickTabKey.value = key
    contextMenuPosition.value = { x: e.clientX, y: e.clientY }
    contextMenuVisible.value = true
  }

  /**
   * 关闭右键菜单
   */
  function closeContextMenu() {
    contextMenuVisible.value = false
  }

  /**
   * 标签切换
   */
  function onTabChange(key: string) {
    navigationStore.switchTab(key)
  }

  /**
   * 关闭单个标签
   */
  function onTabClose(key: string) {
    navigationStore.removeTab(key)
  }

  /**
   * 关闭其他标签
   */
  function handleCloseOtherTabs() {
    navigationStore.closeOtherTabs(navigationStore.activeTabKey)
  }

  /**
   * 关闭所有标签
   */
  function handleCloseAllTabs() {
    navigationStore.closeAllTabs()
  }

  /**
   * 刷新当前标签（先从缓存中移除，下一帧再加回去触发重渲染）
   */
  function refreshTab(tabKey: string) {
    const tab = navigationStore.tabs.find((t) => t.key === tabKey)
    if (!tab) return

    const index = navigationStore.keepAliveIncludes.indexOf(tab.componentName)
    if (index > -1) {
      navigationStore.keepAliveIncludes.splice(index, 1)
    }
    nextTick(() => {
      if (!navigationStore.keepAliveIncludes.includes(tab.componentName)) {
        navigationStore.keepAliveIncludes.push(tab.componentName)
      }
    })
  }

  /**
   * 处理右键菜单项点击
   */
  function onTabContextMenuClick(action: string) {
    const tabKey = currentRightClickTabKey.value
    if (!tabKey) return

    switch (action) {
      case 'refresh':
        refreshTab(tabKey)
        break
      case 'close':
        navigationStore.removeTab(tabKey)
        break
      case 'closeOther':
        navigationStore.closeOtherTabs(tabKey)
        break
      case 'closeAll':
        navigationStore.closeAllTabs()
        break
    }
    contextMenuVisible.value = false
  }

  return {
    // 状态
    contextMenuVisible,
    contextMenuPosition,
    currentRightClickTabKey,

    // 标签操作
    onTabChange,
    onTabClose,
    handleCloseOtherTabs,
    handleCloseAllTabs,

    // 右键菜单
    handleTabContextMenu,
    closeContextMenu,
    onTabContextMenuClick,

    // 工具
    refreshTab,
  }
}
