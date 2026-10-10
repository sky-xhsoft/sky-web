import { describe, it, expect, vi, beforeEach } from 'vitest'
import SparkMD5 from 'spark-md5'

vi.mock('@/modules/cloud/constants/config', () => ({
  RESUMABLE_UPLOAD_CONFIG: { CHUNK_SIZE: 1024, MAX_RETRIES: 2, RETRY_DELAY: 1, CONCURRENT_COUNT: 3 },
}))

vi.mock('@/modules/cloud/api', () => ({
  initMultipartUpload: vi.fn(),
  uploadMultipartChunk: vi.fn(),
  completeMultipartUpload: vi.fn().mockResolvedValue({ ID: 99 }),
  abortMultipartUpload: vi.fn().mockResolvedValue(undefined),
  getChunkPresignedURLs: vi.fn(),
  putChunkToStorage: vi.fn(),
  markChunkUploaded: vi.fn().mockResolvedValue(undefined),
}))

import { computeChunkedHash, hashFileChunks } from './file-hash'
import { ResumableUploadManager, STORAGE_CORS_ERROR } from './resumable-upload'
import * as api from '@/modules/cloud/api'

// 5 个分片：1024 × 4 + 500
function makeFile(size = 1024 * 4 + 500) {
  const bytes = new Uint8Array(size)
  for (let i = 0; i < size; i += 1) bytes[i] = (i * 31 + 7) % 256
  return { file: new File([bytes], 'video.mp4', { type: 'video/mp4' }), bytes }
}

describe('文件校验值计算', () => {
  it('一次读取同时得到整个文件与每个分片的 MD5，与单独计算一致', async () => {
    const { file, bytes } = makeFile()
    const result = await hashFileChunks(file, 1024)
    expect(result.fileMd5).toBe(SparkMD5.ArrayBuffer.hash(bytes.buffer))
    expect(result.chunkMd5s).toHaveLength(5)
    expect(result.chunkMd5s[4]).toBe(SparkMD5.ArrayBuffer.hash(bytes.slice(4096).buffer))
  })

  it('分片大于每次读取的大小时按 4MB 分段读取，结果不变', async () => {
    const size = 9 * 1024 * 1024 + 123
    const data = new Uint8Array(size).map((_, i) => i % 251)
    const reads: number[] = []
    const result = await computeChunkedHash(size, 8 * 1024 * 1024, (start, end) => {
      reads.push(end - start)
      return data.slice(start, end).buffer
    })
    expect(Math.max(...reads)).toBeLessThanOrEqual(4 * 1024 * 1024)
    expect(result.fileMd5).toBe(SparkMD5.ArrayBuffer.hash(data.buffer))
    expect(result.chunkMd5s[1]).toBe(SparkMD5.ArrayBuffer.hash(data.slice(8 * 1024 * 1024).buffer))
  })
})

describe('ResumableUploadManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.initMultipartUpload).mockResolvedValue({ sessionId: 7, uploadedChunks: [1] } as any)
  })

  it('跳过已上传分片，并发上传其余分片，失败的分片自动重试', async () => {
    let active = 0
    let maxActive = 0
    const attempts: Record<number, number> = {}
    vi.mocked(api.uploadMultipartChunk).mockImplementation(async (_s, index, _md5, blob, _signal, onProgress) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      attempts[index] = (attempts[index] || 0) + 1
      await new Promise((r) => setTimeout(r, 5))
      onProgress?.((blob as Blob).size)
      active -= 1
      if (index === 3 && attempts[index] === 1) throw new Error('network error')
    })

    const { file } = makeFile()
    const manager = new ResumableUploadManager(file, 0)
    const progress: any[] = []
    manager.setProgressCallback((p) => progress.push(p))
    const id = await manager.start()

    expect(id).toBe(99)
    const uploaded = vi.mocked(api.uploadMultipartChunk).mock.calls.map((c) => c[1])
    expect(uploaded).not.toContain(1)
    expect(new Set(uploaded)).toEqual(new Set([0, 2, 3, 4]))
    expect(attempts[3]).toBe(2)
    expect(maxActive).toBeLessThanOrEqual(3)
    expect(maxActive).toBeGreaterThan(1)
    expect(api.completeMultipartUpload).toHaveBeenCalledWith(7)
    expect(progress.at(-1)).toMatchObject({ status: 'completed', progress: 100 })
  })

  it('会话不存在等错误不重试，直接失败', async () => {
    vi.mocked(api.uploadMultipartChunk).mockRejectedValue({ response: { status: 404 }, message: '上传会话不存在' })
    const { file } = makeFile()
    const manager = new ResumableUploadManager(file, 0)
    await expect(manager.start()).rejects.toMatchObject({ message: '上传会话不存在' })
    // 每个分片最多尝试一次（404 不重试）
    const calls = vi.mocked(api.uploadMultipartChunk).mock.calls.map((c) => c[1])
    expect(calls.length).toBe(new Set(calls).size)
    expect(api.completeMultipartUpload).not.toHaveBeenCalled()
  })

  it('暂停后继续：不重复计算校验值，按服务端记录跳过已上传分片', async () => {
    const { file } = makeFile()
    const manager = new ResumableUploadManager(file, 0)
    vi.mocked(api.uploadMultipartChunk).mockImplementation((_s, _i, _m, _b, signal) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(Object.assign(new Error('canceled'), { name: 'CanceledError' })))
      }),
    )
    const first = manager.start()
    await new Promise((r) => setTimeout(r, 10))
    manager.abort()
    await expect(first).rejects.toBeTruthy()

    // 继续：服务端已记录 0~3，只剩 4
    const hashSpy = vi.spyOn(SparkMD5.ArrayBuffer.prototype, 'end')
    vi.mocked(api.initMultipartUpload).mockResolvedValue({ sessionId: 7, uploadedChunks: [0, 1, 2, 3] } as any)
    vi.mocked(api.uploadMultipartChunk).mockReset().mockResolvedValue(undefined)
    await manager.start()
    expect(hashSpy).not.toHaveBeenCalled()
    expect(vi.mocked(api.uploadMultipartChunk).mock.calls.map((c) => c[1])).toEqual([4])
    hashSpy.mockRestore()
  })
})

describe('ResumableUploadManager 直传云存储', () => {
  const presign = (indexes: number[], expireSeconds = 3600) =>
    indexes.map((i) => ({ chunkIndex: i, presignedUrl: `https://bucket/obj?partNumber=${i + 1}&n=${Math.random()}`, expireSeconds }))

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.initMultipartUpload).mockResolvedValue({ sessionId: 8, uploadedChunks: [1], uploadMode: 'direct' } as any)
    vi.mocked(api.getChunkPresignedURLs).mockImplementation(async (_s, indexes) => presign(indexes))
    vi.mocked(api.putChunkToStorage).mockImplementation(async (url) => `etag-${url.split('partNumber=')[1].split('&')[0]}`)
  })

  it('分块直接 PUT 到存储桶并登记 ETag，不经服务器中转；地址批量获取', async () => {
    const { file } = makeFile()
    const id = await new ResumableUploadManager(file, 0).start()

    expect(id).toBe(99)
    expect(api.uploadMultipartChunk).not.toHaveBeenCalled()
    expect(api.getChunkPresignedURLs).toHaveBeenCalledTimes(1)
    expect(new Set(vi.mocked(api.getChunkPresignedURLs).mock.calls[0][1])).toEqual(new Set([0, 2, 3, 4]))
    const marked = vi.mocked(api.markChunkUploaded).mock.calls.map((c) => [c[1], c[2]])
    expect(new Map(marked as [number, string][])).toEqual(new Map([[0, 'etag-1'], [2, 'etag-3'], [3, 'etag-4'], [4, 'etag-5']]))
  })

  it('存储桶返回 403（地址过期）时换新地址重试', async () => {
    let failed = false
    vi.mocked(api.putChunkToStorage).mockImplementation(async (url) => {
      if (url.includes('partNumber=3&') && !failed) {
        failed = true
        throw Object.assign(new Error('Forbidden'), { response: { status: 403 } })
      }
      return 'etag'
    })
    const { file } = makeFile()
    await new ResumableUploadManager(file, 0).start()

    const urlsForChunk2 = vi.mocked(api.putChunkToStorage).mock.calls.map((c) => c[0]).filter((u) => u.includes('partNumber=3&'))
    expect(urlsForChunk2).toHaveLength(2)
    expect(urlsForChunk2[0]).not.toBe(urlsForChunk2[1])
    expect(api.markChunkUploaded).toHaveBeenCalledTimes(4)
  })

  it('直传始终没有响应（存储桶未配置跨域）时提示配置跨域', async () => {
    vi.mocked(api.putChunkToStorage).mockRejectedValue(new Error('Network Error'))
    const { file } = makeFile()
    await expect(new ResumableUploadManager(file, 0).start()).rejects.toThrow(STORAGE_CORS_ERROR)
    expect(api.uploadMultipartChunk).not.toHaveBeenCalled()
    expect(api.completeMultipartUpload).not.toHaveBeenCalled()
  })
})
