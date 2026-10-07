/**
 * 分享访问 API
 *
 * 用于公开访问分享链接（不需要认证）
 */

import api from '@/api/http'
import { API_BASE_URL } from '@/config'
import type { ShareInfo, ApiResponse } from '@/modules/cloud/types'

/** 加密分享访问凭证请求头（凭证由 accessShare 验证密码后返回） */
function shareTokenHeaders(accessToken?: string): Record<string, string> {
  return accessToken ? { 'X-Share-Token': accessToken } : {}
}

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
 * 点击下载时获取下载地址：后端校验并计入下载次数（达到上限会报错）后返回文件直链；
 * url 为空表示文件没有直链，需走流式下载接口
 * @param code 分享码
 * @param accessToken 加密/私密分享访问凭证
 * @param fileId 文件夹分享中的文件ID
 */
export async function getShareDownloadUrl(
  code: string,
  accessToken?: string,
  fileId?: number
): Promise<{ url: string; name: string }> {
  const { data } = await api.post<ApiResponse<{ url: string; name: string }>>(
    `/cloud/shares/${code}/download-url`,
    {},
    { params: fileId ? { fileId } : undefined, headers: shareTokenHeaders(accessToken) }
  )
  return data?.data || { url: '', name: '' }
}

/**
 * 下载分享的文件
 * @param code 分享码
 * @param filename 文件名
 * @param accessToken 加密分享访问凭证
 */
export async function downloadShareFile(code: string, filename: string, accessToken?: string): Promise<void> {
  const baseUrl = (API_BASE_URL || '').replace(/\/$/, '')
  // API_BASE_URL 已包含 /api/v1，不能再拼一次（原先请求 /api/v1/api/v1/... 返回 404）
  const url = `${baseUrl}/cloud/shares/${code}/download`

  // 使用 fetch 下载文件
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: shareTokenHeaders(accessToken),
    })

    if (!response.ok) {
      // 带上状态码与后端提示，便于调用方识别凭证过期（403）等情况
      const body = await response.json().catch(() => null)
      throw Object.assign(new Error(body?.message || `下载失败，状态码 ${response.status}`), { status: response.status })
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
    if (e?.status) throw e
    throw new Error(e?.message || '下载失败，请稍后重试')
  }
}

/**
 * 获取分享文件夹的内容
 * @param code 分享码
 * @param parentId 父文件夹ID（可选）
 * @param accessToken 加密分享访问凭证
 */
export async function getShareFolderContent(
  code: string,
  parentId?: number,
  accessToken?: string
): Promise<{ folders: any[]; files: any[] }> {
  const params = parentId ? { parentId } : {}
  const { data } = await api.get<ApiResponse<{ folders: any[]; files: any[] }>>(
    `/cloud/shares/${code}/content`,
    { params, headers: shareTokenHeaders(accessToken) }
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
