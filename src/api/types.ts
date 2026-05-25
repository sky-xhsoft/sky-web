/**
 * 通用 API 响应类型定义
 * 适用于所有后端 /api/v1 端点的统一响应结构
 */
export interface ApiResponse<T = unknown> {
  /** 业务状态码：200 成功，其他为业务错误 */
  code: number
  /** 提示信息 */
  message: string
  /** 业务数据载荷 */
  data: T
  /** 请求追踪 ID（可选） */
  request_id?: string
  /** 时间戳（可选） */
  timestamp?: string
}

/**
 * 分页数据响应
 */
export interface PageData<T = unknown> {
  /** 数据列表 */
  list: T[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page?: number
  /** 每页大小 */
  pageSize?: number
}

/**
 * 分页请求参数
 */
export interface PageRequest {
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 自定义 API 错误类，扩展原生 Error
 */
export class ApiError extends Error {
  /** HTTP 响应对象 */
  response?: unknown
  /** 业务错误码 */
  code?: number | null
  /** 完整响应数据 */
  data?: ApiResponse

  constructor(message: string, options?: {
    response?: unknown
    code?: number | null
    data?: ApiResponse
  }) {
    super(message)
    this.name = 'ApiError'
    this.response = options?.response
    this.code = options?.code
    this.data = options?.data
  }
}

/**
 * 类型守卫：判断对象是否为 ApiResponse
 */
export function isApiResponse(obj: unknown): obj is ApiResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    'message' in obj
  )
}

/**
 * 类型守卫：判断错误是否为 ApiError
 */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}