/**
 * 验证工具函数
 *
 * 提供文件名、文件大小等验证功能
 */

/**
 * 文件名非法字符正则
 */
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g

/**
 * 文件名最大长度
 */
const MAX_FILENAME_LENGTH = 255

/**
 * 验证文件名是否合法
 *
 * @param filename 文件名
 * @returns 验证结果，包含是否合法和错误信息
 *
 * @example
 * validateFileName('report.pdf') // { valid: true }
 * validateFileName('report<>.pdf') // { valid: false, error: '文件名包含非法字符' }
 * validateFileName('') // { valid: false, error: '文件名不能为空' }
 */
export function validateFileName(filename: string): { valid: boolean; error?: string } {
  if (!filename || filename.trim() === '') {
    return { valid: false, error: '文件名不能为空' }
  }

  if (filename.length > MAX_FILENAME_LENGTH) {
    return { valid: false, error: `文件名长度不能超过${MAX_FILENAME_LENGTH}个字符` }
  }

  if (INVALID_FILENAME_CHARS.test(filename)) {
    return { valid: false, error: '文件名包含非法字符: < > : " / \\ | ? *' }
  }

  // 检查是否以空格或点开头/结尾
  if (filename.startsWith(' ') || filename.endsWith(' ')) {
    return { valid: false, error: '文件名不能以空格开头或结尾' }
  }

  if (filename.startsWith('.') && filename.length === 1) {
    return { valid: false, error: '文件名不能只是一个点' }
  }

  // Windows保留文件名检查
  const windowsReserved = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ]

  const nameWithoutExt = filename.split('.')[0].toUpperCase()
  if (windowsReserved.includes(nameWithoutExt)) {
    return { valid: false, error: '文件名不能使用系统保留名称' }
  }

  return { valid: true }
}

/**
 * 验证文件夹名是否合法
 *
 * @param folderName 文件夹名
 * @returns 验证结果
 */
export function validateFolderName(folderName: string): { valid: boolean; error?: string } {
  // 文件夹名验证规则与文件名基本相同
  return validateFileName(folderName)
}

/**
 * 验证文件大小是否超过限制
 *
 * @param fileSize 文件大小（字节）
 * @param maxSize 最大大小（字节），默认 100MB
 * @returns 验证结果
 *
 * @example
 * validateFileSize(1024) // { valid: true }
 * validateFileSize(200 * 1024 * 1024, 100 * 1024 * 1024) // { valid: false, error: '文件大小超过限制' }
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number = 20 * 1024 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (fileSize <= 0) {
    return { valid: false, error: '文件大小无效' }
  }

  if (fileSize > maxSize) {
    const maxSizeMB = Math.floor(maxSize / 1024 / 1024)
    return { valid: false, error: `文件大小不能超过 ${maxSizeMB} MB` }
  }

  return { valid: true }
}

/**
 * 验证文件类型是否允许
 *
 * @param fileType 文件MIME类型
 * @param allowedTypes 允许的类型列表，如果为空则允许所有类型
 * @returns 验证结果
 *
 * @example
 * validateFileType('image/png', ['image/*']) // { valid: true }
 * validateFileType('application/exe', ['image/*', 'video/*']) // { valid: false, error: '不允许上传此类型的文件' }
 */
export function validateFileType(
  fileType: string,
  allowedTypes: string[] = []
): { valid: boolean; error?: string } {
  if (allowedTypes.length === 0) {
    return { valid: true } // 允许所有类型
  }

  const isAllowed = allowedTypes.some((allowed) => {
    if (allowed.endsWith('/*')) {
      // 通配符匹配，如 image/*
      const prefix = allowed.slice(0, -2)
      return fileType.startsWith(prefix)
    }
    return fileType === allowed
  })

  if (!isAllowed) {
    return { valid: false, error: '不允许上传此类型的文件' }
  }

  return { valid: true }
}

/**
 * 验证文件扩展名
 *
 * @param filename 文件名
 * @param allowedExts 允许的扩展名列表（小写，带点），如果为空则允许所有扩展名
 * @returns 验证结果
 *
 * @example
 * validateFileExt('report.pdf', ['.pdf', '.doc']) // { valid: true }
 * validateFileExt('report.exe', ['.pdf', '.doc']) // { valid: false, error: '不允许的文件扩展名' }
 */
export function validateFileExt(
  filename: string,
  allowedExts: string[] = []
): { valid: boolean; error?: string } {
  if (allowedExts.length === 0) {
    return { valid: true } // 允许所有扩展名
  }

  const ext = getFileExtension(filename).toLowerCase()
  if (!ext) {
    return { valid: false, error: '文件缺少扩展名' }
  }

  const isAllowed = allowedExts.some((allowed) => allowed.toLowerCase() === ext)
  if (!isAllowed) {
    return { valid: false, error: `不允许的文件扩展名，仅支持: ${allowedExts.join(', ')}` }
  }

  return { valid: true }
}

/**
 * 获取文件扩展名
 *
 * @param filename 文件名
 * @returns 扩展名（包含点），如果没有扩展名则返回空字符串
 *
 * @example
 * getFileExtension('report.pdf') // '.pdf'
 * getFileExtension('archive.tar.gz') // '.gz'
 * getFileExtension('README') // ''
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return ''
  }
  return filename.substring(lastDotIndex)
}

/**
 * 清理文件名中的非法字符
 *
 * @param filename 原始文件名
 * @returns 清理后的文件名
 *
 * @example
 * sanitizeFileName('report<>.pdf') // 'report.pdf'
 * sanitizeFileName(' report .pdf ') // 'report .pdf'
 */
export function sanitizeFileName(filename: string): string {
  // 移除非法字符
  let sanitized = filename.replace(INVALID_FILENAME_CHARS, '')

  // 移除首尾空格
  sanitized = sanitized.trim()

  // 如果文件名为空或只有点，返回默认名称
  if (sanitized === '' || sanitized === '.') {
    sanitized = 'untitled'
  }

  // 限制长度
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    const ext = getFileExtension(sanitized)
    const nameWithoutExt = sanitized.substring(0, sanitized.length - ext.length)
    const maxNameLength = MAX_FILENAME_LENGTH - ext.length
    sanitized = nameWithoutExt.substring(0, maxNameLength) + ext
  }

  return sanitized
}

/**
 * 生成唯一文件名（避免重复）
 *
 * @param filename 原始文件名
 * @param existingNames 已存在的文件名列表
 * @returns 唯一的文件名
 *
 * @example
 * generateUniqueName('report.pdf', ['report.pdf']) // 'report (1).pdf'
 * generateUniqueName('report.pdf', ['report.pdf', 'report (1).pdf']) // 'report (2).pdf'
 */
export function generateUniqueName(filename: string, existingNames: string[]): string {
  if (!existingNames.includes(filename)) {
    return filename
  }

  const ext = getFileExtension(filename)
  const nameWithoutExt = filename.substring(0, filename.length - ext.length)

  let counter = 1
  let newName = `${nameWithoutExt} (${counter})${ext}`

  while (existingNames.includes(newName)) {
    counter++
    newName = `${nameWithoutExt} (${counter})${ext}`
  }

  return newName
}
