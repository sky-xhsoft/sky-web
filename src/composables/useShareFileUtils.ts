/**
 * 分享文件类型检测和预览工具
 */

export type PreviewType = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unknown'

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
const VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'aac', 'm4a']
const PDF_EXTS = ['pdf']
const TEXT_EXTS = ['txt', 'md', 'json', 'xml', 'csv', 'log']

/**
 * 根据文件名获取文件类型
 */
export function getFileType(fileName: string): PreviewType {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  if (IMAGE_EXTS.includes(ext)) return 'image'
  if (VIDEO_EXTS.includes(ext)) return 'video'
  if (AUDIO_EXTS.includes(ext)) return 'audio'
  if (PDF_EXTS.includes(ext)) return 'pdf'
  if (TEXT_EXTS.includes(ext)) return 'text'

  return 'unknown'
}

/**
 * 判断文件是否可以预览
 */
export function canPreview(fileName: string): boolean {
  const type = getFileType(fileName)
  return ['image', 'video', 'audio', 'pdf', 'text'].includes(type)
}

/**
 * 判断 item 是否有有效的访问 URL
 */
export function hasAccessUrl(item: any): boolean {
  const url = getAccessUrl(item)
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * 获取 item 的访问 URL
 */
export function getAccessUrl(item: any): string {
  return item.accessUrl || item.accessURL || item.AccessURL || item.AccessUrl || ''
}

/**
 * 追加加密分享访问凭证（<img>/<video>/<a> 无法设置请求头，只能走查询参数）
 */
function withShareToken(url: string, accessToken?: string): string {
  return accessToken ? `${url}?token=${encodeURIComponent(accessToken)}` : url
}

/**
 * 生成文件预览 URL
 */
export function getFilePreviewUrl(shareCode: string, fileId: number, accessToken?: string): string {
  return withShareToken(`/api/v1/cloud/shares/${shareCode}/files/${fileId}/preview`, accessToken)
}

/**
 * 生成文件下载 URL
 */
export function getFileDownloadUrl(shareCode: string, fileId: number, accessToken?: string): string {
  return withShareToken(`/api/v1/cloud/shares/${shareCode}/files/${fileId}/download`, accessToken)
}
