import api from './http'
import type { ApiResponse } from './types'

export interface SysGroups {
  id: number
  name: string
  description?: string
  sgrade?: number
  sysCompanyId?: number
  createTime?: string
}

export interface PermissionBitInfo {
  bit: number
  label: string
  assignedGroups: number[]
}

export interface PermissionMatrixModule {
  id: number
  name: string
  displayName?: string
  type: 'directory' | 'table'
  tableId?: number
  directoryId: number
  permissions: PermissionBitInfo[]
  children?: PermissionMatrixModule[]
}

export interface PermissionMatrix {
  groups: SysGroups[]
  modules: PermissionMatrixModule[]
}

export interface GroupPermission {
  directoryId: number
  permission: number
  filterObj?: string
}

export async function getPermissionMatrix(): Promise<PermissionMatrix> {
  const { data } = await api.get<ApiResponse<PermissionMatrix>>('/groups/matrix')
  return data.data ?? { groups: [], modules: [] }
}

export async function assignPermissions(groupId: number, permissions: GroupPermission[]): Promise<void> {
  await api.post<ApiResponse<void>>(`/groups/${groupId}/permissions`, { permissions })
}

export async function listGroups(params?: { name?: string; page?: number; pageSize?: number }): Promise<{ list: SysGroups[]; total: number; page: number; size: number }> {
  const { data } = await api.get<ApiResponse<{ list: SysGroups[]; total: number; page: number; size: number }>>('/groups', { params })
  return data.data ?? { list: [], total: 0, page: 1, size: 20 }
}
