import { defineStore } from 'pinia'
import { fetchUserMenuTree, fetchUserRouters, type MenuItem } from '../api/menu'

export type AppRoute = MenuItem & { children?: AppRoute[] }

type MenuState = {
  menus: AppRoute[]
  loading: boolean
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    menus: [],
    loading: false,
  }),
  actions: {
    async loadMenus() {
      this.loading = true
      try {
        const data = await fetchUserMenuTree()
        this.menus = data as AppRoute[]
        return this.menus
      } finally {
        this.loading = false
      }
    },
    async loadRouters() {
      this.loading = true
      try {
        const data = await fetchUserRouters()
        this.menus = (data as AppRoute[]) ?? []
        return this.menus
      } finally {
        this.loading = false
      }
    },
    reset() {
      this.menus = []
    },
  },
})

