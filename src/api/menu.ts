import api from './http'

export type MenuItem = {
  id: number
  menuName: string
  path: string
  component?: string
  icon?: string
  redirect?: string
  children?: MenuItem[]
  menuType?: string
  alwaysShow?: string
  status?: string
}

export async function fetchUserRouters() {
  const { data } = await api.get('/menus/user/routers')
  return data?.data ?? []
}

export async function fetchUserMenuTree() {
  const { data } = await api.get('/menus/user/tree')
  return data?.data ?? []
}

