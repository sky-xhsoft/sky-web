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
 * 生成文件预览 URL
 */
export function getFilePreviewUrl(shareCode: string, fileId: number): string {
  return `/api/v1/cloud/shares/${shareCode}/files/${fileId}/preview`
}

/**
 * 生成文件下载 URL
 */
export function getFileDownloadUrl(shareCode: string, fileId: number): string {
  return `/api/v1/cloud/shares/${shareCode}/files/${fileId}/download`
}
