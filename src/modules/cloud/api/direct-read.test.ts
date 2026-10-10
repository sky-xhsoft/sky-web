import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/api/http', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: new Blob(['via-server']) }) },
}))

import api from '@/api/http'
import { fetchFileBlobPreferDirect } from './cloud'

describe('fetchFileBlobPreferDirect 预览优先从云存储直链读取', () => {
  const realFetch = globalThis.fetch
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => { globalThis.fetch = realFetch })

  it('直链读取成功：不经过服务器', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('via-cos', { status: 200 })) as any
    const blob = await fetchFileBlobPreferDirect(7, 'https://bucket.cos.ap-guangzhou.myqcloud.com/a.pdf?sign=x')
    expect(await blob.text()).toBe('via-cos')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('直链读取失败（如存储桶未配跨域）：退回经服务器下载', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as any
    const blob = await fetchFileBlobPreferDirect(7, 'https://bucket.cos.ap-guangzhou.myqcloud.com/a.pdf?sign=x')
    expect(await blob.text()).toBe('via-server')
    expect(api.get).toHaveBeenCalledWith('/cloud/files/7/download', { responseType: 'blob' })
  })

  it('没有直链（本地存储）：直接经服务器下载', async () => {
    globalThis.fetch = vi.fn() as any
    await fetchFileBlobPreferDirect(7, '')
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(api.get).toHaveBeenCalledTimes(1)
  })
})
