
import { ref, computed, watch, nextTick } from 'vue'
import { useMenuStore } from '../../stores/menu'
import { mapMenu, type NavItem } from './menuUtils'

export function useLayoutMenu() {
  const menuStore = useMenuStore()

  const currentMenuKey = ref('dashboard')
  const selectedKeys = ref<string[]>(['dashboard'])
  const selectedRootKey = ref<string | null>(null)
  const openKeys = ref<string[]>([])

  const navItems = computed<NavItem[]>(() => {
    const mapped =
      menuStore.navMenus.length ? mapMenu(menuStore.navMenus) : menuStore.menus.length ? mapMenu(menuStore.menus) : []
    return mapped.filter((m) => m.key !== 'dashboard' && m.key !== 'cloud')
  })

  const keyPathMap = computed(() => {
    const map = new Map<string, string>()
    const walk = (items?: NavItem[]) => {
      items?.forEach((item) => {
        if (item.path) map.set(item.key, item.path)
        if (item.children?.length) walk(item.children)
      })
    }
    walk(navItems.value)
    return map
  })

  const rootMenus = computed(() => navItems.value)

  const rootSelectedKeys = computed(() => {
    if (selectedRootKey.value) return [selectedRootKey.value]
    const firstRoot = rootMenus.value[0]
    return firstRoot ? [firstRoot.key] : []
  })

  const sidebarItems = computed(() => {
    const currentRoot =
      rootMenus.value.find((item) => item.key === selectedRootKey.value) || rootMenus.value[0]
    return currentRoot?.children || []
  })

  const defaultOpenKeys = computed(() => {
    const firstWithChildren = sidebarItems.value.find((item) => item.children?.length)
    if (firstWithChildren) return [firstWithChildren.key]
    const firstSidebarItem = sidebarItems.value[0]
    return firstSidebarItem ? [firstSidebarItem.key] : []
  })

  function onMenuClick(key: string): string | null {
    let parentKey: string | null = null
    for (const item of sidebarItems.value) {
      if (item.children?.some(child => child.key === key)) {
        parentKey = item.key
        break
      }
    }

    currentMenuKey.value = key
    selectedKeys.value = [key]

    if (parentKey && !openKeys.value.includes(parentKey)) {
      openKeys.value = [...openKeys.value, parentKey]
    }

    return keyPathMap.value.get(key) || null
  }

  function onOpenChange(keys: string[]): void {
    openKeys.value = keys
  }

  function onRootClick(key: string): string | null {
    if (selectedRootKey.value !== key) {
      selectedRootKey.value = key
      openKeys.value = defaultOpenKeys.value
    }
    currentMenuKey.value = key
    selectedKeys.value = [key]
    return keyPathMap.value.get(key) || null
  }

  function initializeState(): void {
    const firstRoot = rootMenus.value[0]
    if (!selectedRootKey.value && firstRoot) {
      selectedRootKey.value = firstRoot.key
    }
    openKeys.value = defaultOpenKeys.value
  }

  // 监听折叠状态变化
  watch(() => menuStore.sidebarCollapsed, (collapsed) => {
    if (!collapsed && openKeys.value.length === 0) {
      nextTick(() => {
        openKeys.value = [...defaultOpenKeys.value]
      })
    }
  })

  // 监听根菜单变化
  watch(rootMenus, (val) => {
    if (!val?.length) return
    const firstRoot = val[0]
    if (!firstRoot) return
    if (!selectedRootKey.value || !val.some((v) => v.key === selectedRootKey.value)) {
      selectedRootKey.value = firstRoot.key
    }
  }, { immediate: true })

  return {
    currentMenuKey,
    selectedKeys,
    selectedRootKey,
    openKeys,
    navItems,
    keyPathMap,
    rootMenus,
    rootSelectedKeys,
    sidebarItems,
    defaultOpenKeys,
    onMenuClick,
    onOpenChange,
    onRootClick,
    initializeState,
  }
}

