# 分片上传和断点续传 - 前后端集成指南

## 📋 概述

本文档描述前端如何对接后端的分片上传和断点续传API。

**后端实现**: ✅ 已完成
**前端集成**: ✅ 已完成
**兼容性**: ✅ 保持向后兼容

---

## 🔌 API映射

### 前端API → 后端接口

| 前端函数 | 后端接口 | 说明 |
|---------|----------|------|
| `initMultipartUpload()` | `POST /api/v1/cloud/files/multipart/init` | 初始化上传 |
| `uploadMultipartChunk()` | `POST /api/v1/cloud/files/multipart/upload` | 上传分片 |
| `getMultipartUploadStatus()` | `GET /api/v1/cloud/files/multipart/status` | 查询状态 |
| `completeMultipartUpload()` | `POST /api/v1/cloud/files/multipart/complete` | 完成上传 |
| `abortMultipartUpload()` | `DELETE /api/v1/cloud/files/multipart/:sessionId` | 取消上传 |
| `resumeMultipartUpload()` | `POST /api/v1/cloud/files/multipart/resume` | 恢复上传 |

---

## 🚀 使用示例

### 1. 基础分片上传

```typescript
import {
  initMultipartUpload,
  uploadMultipartChunk,
  completeMultipartUpload,
} from '@/modules/cloud/api'
import { calculateFileHash } from '@/modules/cloud/utils/resumable-upload'

async function uploadFile(file: File, folderId: number) {
  // 1. 计算文件MD5
  const fileMd5 = await calculateFileHash(file)

  // 2. 初始化上传
  const session = await initMultipartUpload({
    fileName: file.name,
    fileSize: file.size,
    fileMd5,
    fileType: file.type,
    chunkSize: 5 * 1024 * 1024, // 5MB
    folderId,
  })

  console.log(`会话ID: ${session.sessionId}`)
  console.log(`总分片数: ${session.totalChunks}`)
  console.log(`已上传: ${session.uploadedChunks.length}`)

  // 3. 上传分片
  const chunkSize = session.chunkSize
  for (let i = 0; i < session.totalChunks; i++) {
    // 跳过已上传的分片（断点续传）
    if (session.uploadedChunks.includes(i)) {
      console.log(`跳过分片 ${i}（已上传）`)
      continue
    }

    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    // 计算分片MD5
    const chunkMd5 = await calculateChunkMD5(chunk)

    // 上传分片
    await uploadMultipartChunk(
      session.sessionId,
      i,
      chunkMd5,
      chunk
    )

    console.log(`分片 ${i} 上传成功`)
  }

  // 4. 完成上传
  const result = await completeMultipartUpload(session.sessionId)
  console.log('上传完成:', result)

  return result
}

// 辅助函数：计算分片MD5
async function calculateChunkMD5(chunk: Blob): Promise<string> {
  const SparkMD5 = (await import('spark-md5')).default
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const spark = new SparkMD5.ArrayBuffer()
      spark.append(e.target?.result as ArrayBuffer)
      resolve(spark.end())
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(chunk)
  })
}
```

### 2. 断点续传

```typescript
async function resumeUpload(fileMd5: string, file: File) {
  // 1. 尝试恢复上传
  const resumed = await resumeMultipartUpload(fileMd5)

  console.log(`找到未完成的会话: ${resumed.sessionId}`)
  console.log(`已上传分片: ${resumed.uploadedChunks.length}`)

  // 2. 查询当前状态
  const status = await getMultipartUploadStatus(resumed.sessionId)

  console.log(`上传进度: ${(status.progress * 100).toFixed(2)}%`)

  // 3. 继续上传剩余分片
  const chunkSize = 5 * 1024 * 1024
  for (let i = 0; i < status.totalChunks; i++) {
    if (status.uploadedChunks.includes(i)) {
      continue
    }

    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)
    const chunkMd5 = await calculateChunkMD5(chunk)

    await uploadMultipartChunk(
      resumed.sessionId,
      i,
      chunkMd5,
      chunk
    )
  }

  // 4. 完成上传
  return await completeMultipartUpload(resumed.sessionId)
}
```

### 3. 使用ResumableUploadManager（推荐）

```typescript
import { ResumableUploadManager } from '@/modules/cloud/utils/resumable-upload'

async function uploadWithManager(file: File, folderId: number) {
  const manager = new ResumableUploadManager(file, folderId)

  // 设置进度回调
  manager.setProgressCallback((progress) => {
    console.log(`进度: ${progress.progress}%`)
    console.log(`已上传: ${progress.uploadedSize} / ${progress.totalSize}`)
  })

  try {
    // 开始上传（自动处理断点续传）
    const fileId = await manager.start()
    console.log('上传成功, 文件ID:', fileId)
    return fileId
  } catch (error) {
    console.error('上传失败:', error)
    throw error
  }
}
```

### 4. 通过MD5恢复未完成的上传

```typescript
import { resumeUploadByMd5 } from '@/modules/cloud/utils/resumable-upload'

async function resumeByMd5(file: File) {
  // 1. 计算文件MD5
  const fileMd5 = await calculateFileHash(file)

  try {
    // 2. 通过MD5恢复上传
    const fileId = await resumeUploadByMd5(fileMd5, file, (progress) => {
      console.log(`恢复上传进度: ${progress.progress}%`)
    })

    console.log('恢复上传成功, 文件ID:', fileId)
    return fileId
  } catch (error) {
    console.error('恢复上传失败:', error)
    // 如果没有找到未完成的上传，可以重新开始
    throw error
  }
}
```

---

## 📦 数据格式

### 1. 初始化上传

**请求**:
```typescript
{
  fileName: string      // 文件名
  fileSize: number      // 文件大小（字节）
  fileMd5: string       // 文件MD5
  fileType?: string     // MIME类型
  chunkSize?: number    // 分片大小（默认5MB）
  folderId?: number     // 目标文件夹ID
  storageType?: string  // 存储类型（默认'local'）
}
```

**响应**:
```typescript
{
  sessionId: number         // 会话ID
  fileId: string            // 文件ID（MD5）
  fileName: string          // 文件名
  fileSize: number          // 文件大小
  chunkSize: number         // 分片大小
  totalChunks: number       // 总分片数
  uploadedChunks: number[]  // 已上传的分片索引
  status: string            // 状态（uploading/paused/completed）
  expireTime: string        // 过期时间
}
```

### 2. 上传分片

**请求** (FormData):
```typescript
{
  sessionId: string     // 会话ID
  chunkIndex: string    // 分片索引
  chunkMd5: string      // 分片MD5
  chunkData: Blob       // 分片数据
}
```

**响应**:
```typescript
{
  code: 200,
  data: {
    message: "分片上传成功",
    chunkIndex: number,
    uploaded: true
  }
}
```

### 3. 查询状态

**请求**:
```
GET /api/v1/cloud/files/multipart/status?sessionId=123
```

**响应**:
```typescript
{
  sessionId: number
  fileId: string
  fileName: string
  fileSize: number
  totalChunks: number
  uploadedChunks: number[]
  status: string
  progress: number          // 0-1 之间
  expireTime: string
}
```

### 4. 完成上传

**请求**:
```typescript
{
  sessionId: number
}
```

**响应**:
```typescript
{
  code: 200,
  data: {
    id: number
    fileName: string
    fileSize: number
    md5: string
    accessUrl: string
    // ... 其他文件信息
  }
}
```

---

## 🔄 完整流程

### 正常上传流程

```
1. 前端计算文件MD5
   ↓
2. 调用 initMultipartUpload
   ↓
3. 后端创建会话，检查是否存在相同MD5的文件
   ↓
4. 如果存在且已完成 → 秒传（返回完整的uploadedChunks）
   ↓
5. 如果不存在 → 返回空的uploadedChunks
   ↓
6. 前端逐个上传分片 (uploadMultipartChunk)
   ↓
7. 后端保存分片到临时目录
   ↓
8. 所有分片上传完成后，调用 completeMultipartUpload
   ↓
9. 后端合并分片，创建文件记录
   ↓
10. 返回文件信息
```

### 断点续传流程

```
1. 前端计算文件MD5
   ↓
2. 调用 resumeMultipartUpload(fileMd5)
   ↓
3. 后端查找未完成的会话
   ↓
4. 如果找到 → 返回会话信息和已上传分片
   ↓
5. 前端跳过已上传的分片，继续上传剩余分片
   ↓
6. 所有分片上传完成后，调用 completeMultipartUpload
   ↓
7. 后端合并分片，完成上传
```

### 秒传流程

```
1. 前端计算文件MD5
   ↓
2. 调用 initMultipartUpload
   ↓
3. 后端检查是否存在相同MD5的完整文件
   ↓
4. 如果存在 → 直接复制文件记录
   ↓
5. 返回 uploadedChunks = [0, 1, 2, ..., totalChunks-1]
   ↓
6. 前端检测到所有分片已上传，直接调用 complete
   ↓
7. 后端直接返回文件信息（无需合并）
```

---

## ⚙️ 配置

### 前端配置

```typescript
// src/modules/cloud/constants/config.ts
export const CLOUD_CONFIG = {
  CHUNK_SIZE: 5 * 1024 * 1024,  // 5MB分片
  MAX_RETRIES: 3,                // 最大重试次数
  TIMEOUT: 120000,               // 超时时间：2分钟
}
```

### 后端配置

```yaml
# config.yaml
multipart_upload:
  chunk_size: 5242880              # 5MB
  session_expire_hours: 24         # 会话过期时间
  temp_dir: "./temp/uploads"       # 临时目录
  storage_type: "local"            # 存储类型
```

---

## 🎯 最佳实践

### 1. 分片大小选择

| 网络环境 | 推荐分片大小 | 说明 |
|---------|-------------|------|
| 稳定高速 | 10-20MB | 减少请求次数 |
| 一般网络 | 5-10MB | 平衡性能和可靠性 |
| 不稳定网络 | 2-5MB | 提高重传成功率 |

### 2. 并发上传

```typescript
async function uploadChunksParallel(
  session: any,
  file: File,
  concurrency = 3
) {
  const tasks = []
  const chunkSize = session.chunkSize

  for (let i = 0; i < session.totalChunks; i++) {
    if (session.uploadedChunks.includes(i)) {
      continue
    }

    const uploadTask = async () => {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)
      const chunkMd5 = await calculateChunkMD5(chunk)

      await uploadMultipartChunk(
        session.sessionId,
        i,
        chunkMd5,
        chunk
      )
    }

    tasks.push(uploadTask)

    // 控制并发数
    if (tasks.length >= concurrency) {
      await Promise.all(tasks.splice(0, concurrency).map(t => t()))
    }
  }

  // 上传剩余任务
  if (tasks.length > 0) {
    await Promise.all(tasks.map(t => t()))
  }
}
```

### 3. 错误处理和重试

```typescript
async function uploadChunkWithRetry(
  sessionId: number,
  chunkIndex: number,
  chunk: Blob,
  maxRetries = 3
) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const chunkMd5 = await calculateChunkMD5(chunk)
      await uploadMultipartChunk(sessionId, chunkIndex, chunkMd5, chunk)
      return // 成功
    } catch (error) {
      lastError = error as Error
      console.warn(`分片${chunkIndex}上传失败，重试${attempt + 1}/${maxRetries}`)

      // 指数退避
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      )
    }
  }

  throw new Error(`分片${chunkIndex}上传失败: ${lastError?.message}`)
}
```

### 4. 进度追踪

```typescript
class UploadProgressTracker {
  private uploadedSize = 0
  private totalSize: number
  private startTime = Date.now()

  constructor(totalSize: number) {
    this.totalSize = totalSize
  }

  updateProgress(chunkSize: number) {
    this.uploadedSize += chunkSize

    const elapsed = (Date.now() - this.startTime) / 1000 // 秒
    const speed = this.uploadedSize / elapsed // 字节/秒
    const remaining = this.totalSize - this.uploadedSize
    const remainingTime = remaining / speed // 秒

    return {
      progress: (this.uploadedSize / this.totalSize) * 100,
      uploadedSize: this.uploadedSize,
      totalSize: this.totalSize,
      speed,
      remainingTime,
    }
  }
}
```

---

## 🐛 常见问题

### 1. 分片MD5计算失败

**问题**: SparkMD5 库未正确导入

**解决**:
```typescript
// 动态导入
const SparkMD5 = (await import('spark-md5')).default

// 或静态导入
import SparkMD5 from 'spark-md5'
```

### 2. 跨域问题

**问题**: 上传请求被CORS策略阻止

**解决**: 后端配置CORS
```go
// Gin框架
router.Use(cors.New(cors.Config{
    AllowOrigins: []string{"http://localhost:3000"},
    AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
    ExposeHeaders: []string{"Content-Length"},
    AllowCredentials: true,
}))
```

### 3. 会话过期

**问题**: 上传过程中会话过期

**解决**:
- 增加会话过期时间（后端配置）
- 上传前检查会话状态
- 支持会话续期

```typescript
async function checkAndRenewSession(sessionId: number) {
  const status = await getMultipartUploadStatus(sessionId)

  const expireTime = new Date(status.expireTime).getTime()
  const now = Date.now()
  const remaining = expireTime - now

  // 如果剩余时间少于1小时，续期
  if (remaining < 3600000) {
    // 调用续期接口（需要后端支持）
    await renewSession(sessionId)
  }
}
```

### 4. 内存占用过高

**问题**: 大文件上传时浏览器内存占用过高

**解决**:
- 使用流式读取文件
- 及时释放Blob对象
- 控制并发上传数量

```typescript
// 使用 slice 而不是一次性读取整个文件
const chunk = file.slice(start, end)

// 上传完后释放引用
URL.revokeObjectURL(url)
```

---

## 📊 性能监控

```typescript
class UploadMetrics {
  private startTime: number
  private endTime: number = 0
  private totalChunks: number
  private uploadedChunks = 0
  private failedChunks = 0
  private retriedChunks = 0

  constructor(totalChunks: number) {
    this.startTime = Date.now()
    this.totalChunks = totalChunks
  }

  onChunkSuccess() {
    this.uploadedChunks++
  }

  onChunkFailed() {
    this.failedChunks++
  }

  onChunkRetry() {
    this.retriedChunks++
  }

  complete() {
    this.endTime = Date.now()
  }

  getReport() {
    const duration = (this.endTime - this.startTime) / 1000
    const successRate = (this.uploadedChunks / this.totalChunks) * 100

    return {
      duration: `${duration.toFixed(2)}秒`,
      totalChunks: this.totalChunks,
      uploadedChunks: this.uploadedChunks,
      failedChunks: this.failedChunks,
      retriedChunks: this.retriedChunks,
      successRate: `${successRate.toFixed(2)}%`,
      avgChunkTime: `${(duration / this.totalChunks).toFixed(3)}秒/分片`,
    }
  }
}
```

---

## 📚 参考文档

- [后端实现总结](./implementation-summary.md)
- [后端API文档](./multipart-upload-api.md)
- [断点续传文档](./RESUMABLE_UPLOAD.md)
- [性能优化指南](./PERFORMANCE_OPTIMIZATION.md)

---

**最后更新**: 2026-01-15
**维护者**: Cloud Team
