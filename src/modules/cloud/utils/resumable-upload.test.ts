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
}))

import { computeChunkedHash, hashFileChunks } from './file-hash'
import { ResumableUploadManager } from './resumable-upload'
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
