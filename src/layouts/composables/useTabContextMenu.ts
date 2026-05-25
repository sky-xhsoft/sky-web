
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useNavigationStore } from '../../stores/navigation'

export function useTabContextMenu() {
  const navigationStore = useNavigationStore()

  const contextMenuVisible = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const currentRightClickTabKey = ref('')

  function handleTabContextMenu(event: MouseEvent, tabKey: string): void {
    event.preventDefault()
    event.stopPropagation()
    currentRightClickTabKey.value = tabKey
    contextMenuPosition.value = { x: event.clientX, y: event.clientY }
    contextMenuVisible.value = true
  }

  function closeContextMenu(): void {
    contextMenuVisible.value = false
  }

  function onTabContextMenuClick(actionKey: string): void {
    const tabKey = currentRightClickTabKey.value
    if (!tabKey) return

    switch (actionKey) {
      case 'refresh':
        const tab = navigationStore.tabs.find(t => t.key === tabKey)
        if (tab) {
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

  // 监听点击事件，关闭右键菜单
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', closeContextMenu)
    }
  })

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', closeContextMenu)
    }
  })

  return {
    contextMenuVisible,
    contextMenuPosition,
    currentRightClickTabKey,
    handleTabContextMenu,
    closeContextMenu,
    onTabContextMenuClick,
  }
}

