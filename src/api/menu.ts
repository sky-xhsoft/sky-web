import api from './http'

export type MenuTreeNode = {
  id: number
  name: string
  displayName?: string
  orderno?: number
  type?: string
  url?: string
  children?: MenuTreeNode[]
}

export async function fetchUserMenuTree(systemType?: string) {
  const params = systemType ? { params: { type: systemType } } : {}
  const { data } = await api.get('/menus/user/tree', params)
  return data?.data as MenuTreeNode[]
}

export async function fetchUserRouters() {
  const { data } = await api.get('/menus/user/routers')
  return data?.data ?? []
}
