import { defineStore } from 'pinia'
import { fetchUserMenuTree, type MenuTreeNode } from '../api/menu'
import type { Router, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from './auth'

export type AppRouteLike = MenuTreeNode & { path?: string; title?: string; children?: AppRouteLike[] }

type MenuState = {
  menus: MenuTreeNode[]
  loading: boolean
  routesAdded: boolean
  sidebarCollapsed: boolean
  localeVersion: number
}

// 根据当前语言获取显示名称
const getDisplayName = (node: MenuTreeNode, locale: string): string => {
  if (locale === 'en-US' && node.EName) {
    return node.EName
  }
  return node.displayName || node.name
}

const buildRoutesFromMenus = (menus: MenuTreeNode[], locale: string = 'zh-CN'): RouteRecordRaw[] => {
  const routes: RouteRecordRaw[] = []
  const walk = (nodes?: MenuTreeNode[]) => {
    nodes?.forEach((node) => {
      if (node.children?.length) {
        walk(node.children)
      }
      // 如果节点有 URL，使用 URL；否则使用 /metadata/list/{id} 作为默认路径
      if ((node.type === 'table' || !node.children?.length) && node.id) {
        const routePath = node.url || `/metadata/list/${node.id}`

        // 如果路由以 /metadata/ 开头，说明是元数据系统的路由，已经在 router/index.ts 中静态定义，跳过动态注册
        if (routePath.startsWith('/metadata/')) {
          return
        }

        routes.push({
          path: routePath,
          name: `table-${node.id}`,
          component: () => import('@/pages/system/TableView.vue'),
          meta: { title: getDisplayName(node, locale), requiresAuth: true },
        })
      }
    })
  }
  walk(menus)
  return routes
}

const mapMenusToNav = (menus: MenuTreeNode[], locale: string = 'zh-CN'): AppRouteLike[] => {
  const walk = (nodes?: MenuTreeNode[]): AppRouteLike[] => {
    return (nodes || [])
      .map((node) => {
        const isLeaf = !node.children || node.children.length === 0
        // 如果节点有 URL，使用 URL；否则使用 /metadata/list/{id} 作为默认路径
        const path = node.type === 'table' || isLeaf ? (node.url || (node.id ? `/metadata/list/${node.id}` : undefined)) : undefined
        return {
          ...node,
          title: getDisplayName(node, locale),
          path,
          children: node.children ? walk(node.children) : undefined,
        }
      })
      .sort((a, b) => (a.orderno ?? 0) - (b.orderno ?? 0))
  }
  return walk(menus)
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    menus: [],
    loading: false,
    routesAdded: false,
    sidebarCollapsed: false,
    localeVersion: 0,
  }),
  // 持久化侧边栏折叠状态（其他状态需要每次加载）
  persist: {
    key: 'sky_menu_ui_state',
    paths: ['sidebarCollapsed'],
  },
  getters: {
    navMenus: (state) => {
      // 使用 localeVersion 触发响应式依赖
      const locale = localStorage.getItem('language') || 'zh-CN'
      return mapMenusToNav(state.menus, locale)
    },
  },
  actions: {
    async loadMenus() {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const systemType = authStore.loginType
        const data = await fetchUserMenuTree(systemType || '')
        this.menus = data || []
        this.routesAdded = false
        return this.menus
      } finally {
        this.loading = false
      }
    },
    ensureRoutes(router: Router) {
      const locale = localStorage.getItem('language') || 'zh-CN'
      const routes = buildRoutesFromMenus(this.menus, locale)
      routes.forEach((route) => {
        if (router.hasRoute(route.name as string)) {
          // 删除现有路由，然后重新添加以确保 meta 信息更新
          router.removeRoute(route.name as string)
          router.addRoute('root', route)
        } else {
          router.addRoute('root', route)
        }
      })
      this.routesAdded = true
    },
    reset() {
      this.menus = []
      this.routesAdded = false
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    // 更新菜单显示语言
    updateMenuLanguage(locale: string, router: Router) {
      // 增加版本号，强制重新计算响应式数据
      this.localeVersion += 1
      // 重置路由添加标志
      this.routesAdded = false
      // 确保路由标题也更新
      this.ensureRoutes(router)
    },
  },
})
