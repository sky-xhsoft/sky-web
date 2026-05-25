/**
 * useNavMenu - 导航菜单数据处理
 *
 * 从 menuStore 派生出 navItems / rootMenus / sidebarItems / keyPathMap
 */
import { ref, computed } from 'vue'
import { useMenuStore } from '../../stores/menu'

export interface NavItem {
  key: string
  title: string
  path?: string
  children?: NavItem[]
}

/**
 * 把后端菜单数据映射为前端 NavItem 树
 * 并按 orderno 排序
 */
function mapMenu(items: any[]): NavItem[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => ({
      key: item.path || item.url || item.id || item.name,
      title: item.title,
      path: item.path || item.url,
      order: item.orderno ?? item.sortOrder ?? 0,
      children: item.children ? mapMenu(item.children) : undefined,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...rest }) => rest)
}

/**
 * 构建 key -> path 的映射，便于点击菜单时查找路径
 */
function buildKeyPathMap(items: NavItem[]): Map<string, string> {
  const map = new Map<string, string>()
  const walk = (list?: NavItem[]) => {
    list?.forEach((item) => {
      if (item.path) map.set(item.key, item.path)
      if (item.children?.length) walk(item.children)
    })
  }
  walk(items)
  return map
}

export function useNavMenu() {
  const menuStore = useMenuStore()

  // 导航数据源
  const navItems = computed<NavItem[]>(() => {
    const mapped =
      menuStore.navMenus.length
        ? mapMenu(menuStore.navMenus)
        : menuStore.menus.length
          ? mapMenu(menuStore.menus)
          : []

    // 过滤掉后端返回的 dashboard 和 cloud（避免重复）
    return mapped.filter((m) => m.key !== 'dashboard' && m.key !== 'cloud')
  })

  // key -> path 映射
  const keyPathMap = computed(() => buildKeyPathMap(navItems.value))

  // 顶级菜单
  const rootMenus = computed(() => navItems.value)

  // 当前选中的顶级菜单 key
  const selectedRootKey = ref<string | null>(null)

  // 顶级菜单的选中状态（含默认值）
  const rootSelectedKeys = computed(() => {
    if (selectedRootKey.value) return [selectedRootKey.value]
    const firstRoot = rootMenus.value[0]
    return firstRoot ? [firstRoot.key] : []
  })

  // 当前显示的侧边栏菜单（顶级菜单的 children）
  const sidebarItems = computed(() => {
    const currentRoot =
      rootMenus.value.find((item) => item.key === selectedRootKey.value) ||
      rootMenus.value[0]
    return currentRoot?.children || []
  })

  // 默认展开的菜单 keys
  const defaultOpenKeys = computed(() => {
    const firstWithChildren = sidebarItems.value.find((item) => item.children?.length)
    if (firstWithChildren) return [firstWithChildren.key]
    const firstSidebarItem = sidebarItems.value[0]
    return firstSidebarItem ? [firstSidebarItem.key] : []
  })

  return {
    navItems,
    keyPathMap,
    rootMenus,
    selectedRootKey,
    rootSelectedKeys,
    sidebarItems,
    defaultOpenKeys,
  }
}

// 导出工具函数供测试
export const _internals = {
  mapMenu,
  buildKeyPathMap,
}
