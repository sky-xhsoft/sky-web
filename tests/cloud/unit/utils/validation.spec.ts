/**
 * validation.ts 工具函数单元测试
 */

import { describe, it, expect } from 'vitest'
import {
  validateFileName,
  validateFolderName,
  validateFileSize,
  validateFileType,
  validateFileExt,
  getFileExtension,
  sanitizeFileName,
  generateUniqueName,
} from '@/modules/cloud/utils/validation'

describe('validateFileName', () => {
  it('应该接受合法的文件名', () => {
    expect(validateFileName('report.pdf')).toEqual({ valid: true })
    expect(validateFileName('测试文档.docx')).toEqual({ valid: true })
    expect(validateFileName('file-name_123.txt')).toEqual({ valid: true })
  })

  it('应该拒绝空文件名', () => {
    expect(validateFileName('')).toEqual({ valid: false, error: '文件名不能为空' })
    expect(validateFileName('   ')).toEqual({ valid: false, error: '文件名不能为空' })
  })

  it('应该拒绝包含非法字符的文件名', () => {
    const result = validateFileName('file<>.txt')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('非法字符')
  })

  it('应该拒绝以空格开头或结尾的文件名', () => {
    expect(validateFileName(' file.txt').valid).toBe(false)
    expect(validateFileName('file.txt ').valid).toBe(false)
  })

  it('应该拒绝只有一个点的文件名', () => {
    expect(validateFileName('.')).toEqual({ valid: false, error: '文件名不能只是一个点' })
  })

  it('应该拒绝Windows保留文件名', () => {
    expect(validateFileName('CON').valid).toBe(false)
    expect(validateFileName('PRN').valid).toBe(false)
    expect(validateFileName('AUX.txt').valid).toBe(false)
    expect(validateFileName('COM1.doc').valid).toBe(false)
  })

  it('应该拒绝超长文件名', () => {
    const longName = 'a'.repeat(256) + '.txt'
    const result = validateFileName(longName)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('长度不能超过')
  })
})

describe('validateFolderName', () => {
  it('应该与validateFileName行为一致', () => {
    expect(validateFolderName('文件夹')).toEqual({ valid: true })
    expect(validateFolderName('')).toEqual({ valid: false, error: '文件名不能为空' })
    expect(validateFolderName('folder<>').valid).toBe(false)
  })
})

describe('validateFileSize', () => {
  it('应该接受合法的文件大小', () => {
    expect(validateFileSize(1024)).toEqual({ valid: true })
    expect(validateFileSize(50 * 1024 * 1024)).toEqual({ valid: true })
  })

  it('应该拒绝0或负数', () => {
    expect(validateFileSize(0).valid).toBe(false)
    expect(validateFileSize(-100).valid).toBe(false)
  })

  it('应该拒绝超过最大大小的文件', () => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const result = validateFileSize(150 * 1024 * 1024, maxSize)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('不能超过')
  })

  it('应该支持自定义最大大小', () => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    expect(validateFileSize(5 * 1024 * 1024, maxSize)).toEqual({ valid: true })
    expect(validateFileSize(15 * 1024 * 1024, maxSize).valid).toBe(false)
  })
})

describe('validateFileType', () => {
  it('空白允许列表应该允许所有类型', () => {
    expect(validateFileType('image/png', [])).toEqual({ valid: true })
    expect(validateFileType('application/pdf', [])).toEqual({ valid: true })
  })

  it('应该精确匹配MIME类型', () => {
    const allowed = ['image/png', 'image/jpeg']
    expect(validateFileType('image/png', allowed)).toEqual({ valid: true })
    expect(validateFileType('image/gif', allowed).valid).toBe(false)
  })

  it('应该支持通配符匹配', () => {
    const allowed = ['image/*', 'video/*']
    expect(validateFileType('image/png', allowed)).toEqual({ valid: true })
    expect(validateFileType('image/jpeg', allowed)).toEqual({ valid: true })
    expect(validateFileType('video/mp4', allowed)).toEqual({ valid: true })
    expect(validateFileType('application/pdf', allowed).valid).toBe(false)
  })
})

describe('validateFileExt', () => {
  it('空白允许列表应该允许所有扩展名', () => {
    expect(validateFileExt('file.pdf', [])).toEqual({ valid: true })
    expect(validateFileExt('file.doc', [])).toEqual({ valid: true })
  })

  it('应该匹配允许的扩展名', () => {
    const allowed = ['.pdf', '.doc', '.docx']
    expect(validateFileExt('report.pdf', allowed)).toEqual({ valid: true })
    expect(validateFileExt('report.doc', allowed)).toEqual({ valid: true })
    expect(validateFileExt('report.txt', allowed).valid).toBe(false)
  })

  it('应该不区分大小写', () => {
    const allowed = ['.PDF']
    expect(validateFileExt('report.pdf', allowed)).toEqual({ valid: true })
    expect(validateFileExt('report.PDF', allowed)).toEqual({ valid: true })
  })

  it('应该拒绝没有扩展名的文件', () => {
    const allowed = ['.pdf']
    const result = validateFileExt('README', allowed)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('缺少扩展名')
  })
})

describe('getFileExtension', () => {
  it('应该正确提取扩展名', () => {
    expect(getFileExtension('report.pdf')).toBe('.pdf')
    expect(getFileExtension('image.PNG')).toBe('.PNG')
    expect(getFileExtension('archive.tar.gz')).toBe('.gz')
  })

  it('应该处理没有扩展名的文件', () => {
    expect(getFileExtension('README')).toBe('')
    expect(getFileExtension('Makefile')).toBe('')
  })

  it('应该处理以点开头的文件', () => {
    expect(getFileExtension('.gitignore')).toBe('')
    expect(getFileExtension('.hidden.txt')).toBe('.txt')
  })
})

describe('sanitizeFileName', () => {
  it('应该移除非法字符', () => {
    expect(sanitizeFileName('file<>.txt')).toBe('file.txt')
    expect(sanitizeFileName('file:name|test.txt')).toBe('filenametest.txt')  // 非法字符被移除
  })

  it('应该移除首尾空格', () => {
    expect(sanitizeFileName(' file.txt ')).toBe('file.txt')
    expect(sanitizeFileName('   file.txt   ')).toBe('file.txt')
  })

  it('应该处理空字符串', () => {
    expect(sanitizeFileName('')).toBe('untitled')
    expect(sanitizeFileName('   ')).toBe('untitled')
    expect(sanitizeFileName('.')).toBe('untitled')
  })

  it('应该截断超长文件名', () => {
    const longName = 'a'.repeat(300) + '.txt'
    const result = sanitizeFileName(longName)
    expect(result.length).toBeLessThanOrEqual(255)
    expect(result.endsWith('.txt')).toBe(true)
  })
})

describe('generateUniqueName', () => {
  it('不存在重复时应该返回原名', () => {
    expect(generateUniqueName('file.txt', [])).toBe('file.txt')
    expect(generateUniqueName('file.txt', ['other.txt'])).toBe('file.txt')
  })

  it('存在重复时应该添加序号', () => {
    expect(generateUniqueName('file.txt', ['file.txt'])).toBe('file (1).txt')
    expect(generateUniqueName('file.txt', ['file.txt', 'file (1).txt'])).toBe('file (2).txt')
  })

  it('应该找到第一个可用的序号', () => {
    const existing = ['file.txt', 'file (1).txt', 'file (3).txt']
    expect(generateUniqueName('file.txt', existing)).toBe('file (2).txt')
  })

  it('应该处理没有扩展名的文件', () => {
    expect(generateUniqueName('README', ['README'])).toBe('README (1)')
  })
})
