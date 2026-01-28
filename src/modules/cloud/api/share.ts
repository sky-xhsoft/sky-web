/**
 * 分享访问 API
 *
 * 用于公开访问分享链接（不需要认证）
 */

import api from '@/api/http'
import { API_BASE_URL } from '@/config'
import type { ShareInfo, ApiResponse } from '@/modules/cloud/types'

/**
 * 获取分享信息（不需要认证）
 * @param code 分享码
 */
export async function getShareInfo(code: string): Promise<ShareInfo> {
  const { data } = await api.get<ApiResponse<ShareInfo>>(`/cloud/shares/${code}`)

  if (!data?.data) {
    throw new Error('获取分享信息失败')
  }

  return data.data
}

/**
 * 访问分享（验证密码）
 * @param code 分享码
 * @param password 访问密码
 */
export async function accessShare(code: string, password: string): Promise<ShareInfo> {
  const { data } = await api.post<ApiResponse<ShareInfo>>(`/cloud/shares/${code}/access`, {
    password,
  })

  if (!data?.data) {
    throw new Error('访问分享失败')
  }

  return data.data
}

/**
 * 下载分享的文件
 * @param code 分享码
 * @param filename 文件名
 */
export async function downloadShareFile(code: string, filename: string): Promise<void> {
  const baseUrl = (API_BASE_URL || '').replace(/\/$/, '')
  const url = `${baseUrl}/api/v1/cloud/shares/${code}/download`

  // 使用 fetch 下载文件
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`下载失败，状态码 ${response.status}`)
    }

    const blob = await response.blob()
    if (!blob || blob.size === 0) {
      throw new Error('下载内容为空')
    }

    // 触发浏览器下载
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.rel = 'noopener'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (e: any) {
    throw new Error(e?.message || '下载失败，请稍后重试')
  }
}

/**
 * 获取分享文件夹的内容
 * @param code 分享码
 * @param parentId 父文件夹ID（可选）
 */
export async function getShareFolderContent(
  code: string,
  parentId?: number
): Promise<{ folders: any[]; files: any[] }> {
  const params = parentId ? { parentId } : {}
  const { data } = await api.get<ApiResponse<{ folders: any[]; files: any[] }>>(
    `/cloud/shares/${code}/content`,
    { params }
  )

  if (!data?.data) {
    throw new Error('获取文件夹内容失败')
  }

  return data.data
}

export default {
  getShareInfo,
  accessShare,
  downloadShareFile,
  getShareFolderContent,
}
