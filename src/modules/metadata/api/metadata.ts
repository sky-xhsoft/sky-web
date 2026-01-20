/**
 * 元数据管理 - API 接口
 */

import api from '@/api/http'
import type {
  ApiResponse,
  PageRequest,
  PageResponse,
  Subsystem,
  TableCategory,
  SysTable,
  SysColumn,
  SysDict,
  TableConfig,
  FormData
} from '../types'

// ==================== 子系统 ====================

/**
 * 获取子系统列表
 */
export async function fetchSubsystems(): Promise<PageResponse<Subsystem>> {
  const { data } = await api.get<ApiResponse<PageResponse<Subsystem>>>('/metadata/subsystems')
  return data.data
}

/**
 * 获取子系统详情
 */
export async function fetchSubsystem(id: number): Promise<Subsystem> {
  const { data } = await api.get<ApiResponse<Subsystem>>(`/metadata/subsystems/${id}`)
  return data.data
}

/**
 * 创建子系统
 */
export async function createSubsystem(params: Partial<Subsystem>): Promise<Subsystem> {
  const { data } = await api.post<ApiResponse<Subsystem>>('/metadata/subsystems', params)
  return data.data
}

/**
 * 更新子系统
 */
export async function updateSubsystem(id: number, params: Partial<Subsystem>): Promise<Subsystem> {
  const { data } = await api.put<ApiResponse<Subsystem>>(`/metadata/subsystems/${id}`, params)
  return data.data
}

/**
 * 删除子系统
 */
export async function deleteSubsystem(id: number): Promise<void> {
  await api.delete(`/metadata/subsystems/${id}`)
}

// ==================== 表类别 ====================

/**
 * 获取表类别列表
 */
export async function fetchTableCategories(subsystemId?: number): Promise<PageResponse<TableCategory>> {
  const params = subsystemId ? { subsystemId } : {}
  const { data } = await api.get<ApiResponse<PageResponse<TableCategory>>>('/metadata/categories', { params })
  return data.data
}

/**
 * 获取表类别详情
 */
export async function fetchTableCategory(id: number): Promise<TableCategory> {
  const { data } = await api.get<ApiResponse<TableCategory>>(`/metadata/categories/${id}`)
  return data.data
}

/**
 * 创建表类别
 */
export async function createTableCategory(params: Partial<TableCategory>): Promise<TableCategory> {
  const { data } = await api.post<ApiResponse<TableCategory>>('/metadata/categories', params)
  return data.data
}

/**
 * 更新表类别
 */
export async function updateTableCategory(id: number, params: Partial<TableCategory>): Promise<TableCategory> {
  const { data } = await api.put<ApiResponse<TableCategory>>(`/metadata/categories/${id}`, params)
  return data.data
}

/**
 * 删除表类别
 */
export async function deleteTableCategory(id: number): Promise<void> {
  await api.delete(`/metadata/categories/${id}`)
}

// ==================== 表单配置 ====================

/**
 * 获取表单列表
 */
export async function fetchTables(params?: Partial<PageRequest & { categoryId?: number }>): Promise<PageResponse<SysTable>> {
  const { data } = await api.get<ApiResponse<PageResponse<SysTable>>>('/metadata/tables', { params })
  return data.data
}

/**
 * 获取表单详情
 */
export async function fetchTable(id: number): Promise<SysTable> {
  const { data } = await api.get<ApiResponse<SysTable>>(`/metadata/tables/${id}`)
  return data.data
}

/**
 * 获取表单完整配置（包含字段列表）
 */
export async function fetchTableConfig(id: number): Promise<TableConfig> {
  const { data } = await api.get<ApiResponse<TableConfig>>(`/metadata/tables/${id}/config`)
  return data.data
}

/**
 * 创建表单
 */
export async function createTable(params: Partial<SysTable>): Promise<SysTable> {
  const { data } = await api.post<ApiResponse<SysTable>>('/metadata/tables', params)
  return data.data
}

/**
 * 更新表单
 */
export async function updateTable(id: number, params: Partial<SysTable>): Promise<SysTable> {
  const { data } = await api.put<ApiResponse<SysTable>>(`/metadata/tables/${id}`, params)
  return data.data
}

/**
 * 删除表单
 */
export async function deleteTable(id: number): Promise<void> {
  await api.delete(`/metadata/tables/${id}`)
}

// ==================== 字段配置 ====================

/**
 * 获取字段列表
 */
export async function fetchColumns(tableId: number): Promise<SysColumn[]> {
  const { data } = await api.get<ApiResponse<SysColumn[]>>(`/metadata/tables/${tableId}/columns`)
  return data.data
}

/**
 * 获取字段详情
 */
export async function fetchColumn(id: number): Promise<SysColumn> {
  const { data } = await api.get<ApiResponse<SysColumn>>(`/metadata/columns/${id}`)
  return data.data
}

/**
 * 创建字段
 */
export async function createColumn(params: Partial<SysColumn>): Promise<SysColumn> {
  const { data } = await api.post<ApiResponse<SysColumn>>('/metadata/columns', params)
  return data.data
}

/**
 * 更新字段
 */
export async function updateColumn(id: number, params: Partial<SysColumn>): Promise<SysColumn> {
  const { data } = await api.put<ApiResponse<SysColumn>>(`/metadata/columns/${id}`, params)
  return data.data
}

/**
 * 删除字段
 */
export async function deleteColumn(id: number): Promise<void> {
  await api.delete(`/metadata/columns/${id}`)
}

/**
 * 批量更新字段排序
 */
export async function updateColumnsOrder(tableId: number, columnIds: number[]): Promise<void> {
  await api.put(`/metadata/tables/${tableId}/columns/order`, { columnIds })
}

// ==================== 数据字典 ====================

/**
 * 获取字典列表
 */
export async function fetchDictItems(dictTableId: number): Promise<SysDict[]> {
  const { data } = await api.get<ApiResponse<SysDict[]>>(`/metadata/dicts/${dictTableId}/items`)
  return data.data
}

/**
 * 获取字典树（支持父子关系）
 */
export async function fetchDictTree(dictTableId: number): Promise<SysDict[]> {
  const { data } = await api.get<ApiResponse<SysDict[]>>(`/metadata/dicts/${dictTableId}/tree`)
  return data.data
}

/**
 * 创建字典项
 */
export async function createDictItem(params: Partial<SysDict>): Promise<SysDict> {
  const { data } = await api.post<ApiResponse<SysDict>>('/metadata/dicts', params)
  return data.data
}

/**
 * 更新字典项
 */
export async function updateDictItem(id: number, params: Partial<SysDict>): Promise<SysDict> {
  const { data } = await api.put<ApiResponse<SysDict>>(`/metadata/dicts/${id}`, params)
  return data.data
}

/**
 * 删除字典项
 */
export async function deleteDictItem(id: number): Promise<void> {
  await api.delete(`/metadata/dicts/${id}`)
}

// ==================== 数据 CRUD ====================

/**
 * 查询数据列表（动态表）
 */
export async function fetchRecords(
  tableName: string,
  params?: Partial<PageRequest>
): Promise<PageResponse<FormData>> {
  const requestBody = {
    tableName,
    page: params?.page || 1,
    pageSize: params?.pageSize || 20,
    ...params
  }
  const { data } = await api.post<ApiResponse<any>>(`/data/${tableName}/query`, requestBody)

  // 转换后端响应格式到前端期望的格式
  // 后端返回: { data: [], total, page, pageSize }
  // 前端期望: { list: [], total, page, pageSize }
  return {
    list: data.data.data || data.data.Data || [],
    total: data.data.total || data.data.Total || 0,
    page: data.data.page || data.data.Page || 1,
    pageSize: data.data.pageSize || data.data.PageSize || 20
  }
}

/**
 * 获取单条记录
 */
export async function fetchRecord(tableName: string, id: number): Promise<FormData> {
  const { data } = await api.get<ApiResponse<FormData>>(`/data/${tableName}/${id}`)
  return data.data
}

/**
 * 创建记录
 */
export async function createRecord(tableName: string, record: FormData): Promise<FormData> {
  const { data } = await api.post<ApiResponse<FormData>>(`/data/${tableName}`, record)
  return data.data
}

/**
 * 更新记录
 */
export async function updateRecord(tableName: string, id: number, record: Partial<FormData>): Promise<FormData> {
  const { data } = await api.put<ApiResponse<FormData>>(`/data/${tableName}/${id}`, record)
  return data.data
}

/**
 * 删除记录
 */
export async function deleteRecord(tableName: string, id: number): Promise<void> {
  await api.delete(`/data/${tableName}/${id}`)
}

/**
 * 批量删除记录
 */
export async function batchDeleteRecords(tableName: string, ids: number[]): Promise<void> {
  await api.post(`/data/${tableName}/batch-delete`, { ids })
}

// ==================== 业务流程 ====================

/**
 * 提交记录
 */
export async function submitRecord(tableName: string, id: number): Promise<void> {
  await api.post(`/metadata/data/${tableName}/${id}/submit`)
}

/**
 * 反提交记录
 */
export async function unsubmitRecord(tableName: string, id: number): Promise<void> {
  await api.post(`/metadata/data/${tableName}/${id}/unsubmit`)
}

/**
 * 作废记录
 */
export async function voidRecord(tableName: string, id: number): Promise<void> {
  await api.post(`/metadata/data/${tableName}/${id}/void`)
}
