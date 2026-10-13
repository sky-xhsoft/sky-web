import { describe, it, expect, vi, afterEach } from 'vitest'
import { copyText } from './clipboard'

const setSecure = (v: boolean) => Object.defineProperty(window, 'isSecureContext', { value: v, configurable: true })
const setClipboard = (c: unknown) => Object.defineProperty(navigator, 'clipboard', { value: c, configurable: true })

describe('copyText', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setClipboard(undefined)
  })

  it('HTTP 下没有 navigator.clipboard 时用 execCommand 复制（原先测试环境点复制没有反应）', async () => {
    setSecure(false)
    setClipboard(undefined)
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec
    expect(await copyText('rtmp://push.example.com/live')).toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('安全上下文优先用 navigator.clipboard', async () => {
    setSecure(true)
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    const exec = vi.fn()
    document.execCommand = exec
    expect(await copyText('abc')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('abc')
    expect(exec).not.toHaveBeenCalled()
  })

  it('navigator.clipboard 写入失败时退回 execCommand；都失败返回 false', async () => {
    setSecure(true)
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    document.execCommand = vi.fn().mockReturnValue(true)
    expect(await copyText('abc')).toBe(true)
    document.execCommand = vi.fn().mockReturnValue(false)
    expect(await copyText('abc')).toBe(false)
    expect(await copyText('')).toBe(false)
  })
})
