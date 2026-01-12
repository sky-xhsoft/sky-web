import { defineStore } from 'pinia'
import { fetchUserMenuTree, type MenuTreeNode } from '../api/menu'
import type { Router, RouteRecordRaw } from 'vue-router'
import TableView from '../pages/TableView.vue'

export type AppRouteLike = MenuTreeNode & { path?: string; title?: string; children?: AppRouteLike[] }

type MenuState = {
  menus: MenuTreeNode[]
  loading: boolean
  routesAdded: boolean
}

const buildRoutesFromMenus = (menus: MenuTreeNode[]): RouteRecordRaw[] => {
  const routes: RouteRecordRaw[] = []
  const walk = (nodes?: MenuTreeNode[]) => {
    nodes?.forEach((node) => {
      if (node.children?.length) {
        walk(node.children)
      }
      if ((node.type === 'table' || !node.children?.length) && node.name) {
        routes.push({
          path: `/tables/${node.name}`,
          name: `table-${node.name}`,
          component: TableView,
          meta: { title: node.displayName || node.name, requiresAuth: true },
        })
      }
    })
  }
  walk(menus)
  return routes
}

const mapMenusToNav = (menus: MenuTreeNode[]): AppRouteLike[] => {
  const walk = (nodes?: MenuTreeNode[]): AppRouteLike[] => {
    return (nodes || [])
      .map((node) => {
        const isLeaf = !node.children || node.children.length === 0
        const path = node.type === 'table' || isLeaf ? `/tables/${node.name}` : undefined
        return {
          ...node,
          title: node.displayName || node.name,
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
  }),
  getters: {
    navMenus: (state) => mapMenusToNav(state.menus),
  },
  actions: {
    async loadMenus() {
      this.loading = true
      try {
        const data = await fetchUserMenuTree()
        this.menus = data || []
        this.routesAdded = false
        return this.menus
      } finally {
        this.loading = false
      }
    },
    ensureRoutes(router: Router) {
      const routes = buildRoutesFromMenus(this.menus)
      routes.forEach((r) => {
        if (!router.hasRoute(r.name as string)) {
          router.addRoute('root', r)
        }
      })
      this.routesAdded = true
    },
    reset() {
      this.menus = []
      this.routesAdded = false
    },
  },
})
