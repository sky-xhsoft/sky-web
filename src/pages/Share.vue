<template>
  <div class="share-page">
    <div class="share-container">
      <!-- Logo和标题 -->
      <div class="share-header">
        <h1 class="share-title">文件分享</h1>
        <p class="share-subtitle">安全、便捷的文件分享服务</p>
      </div>

      <!-- 密码验证表单 -->
      <div v-if="!verified" class="password-form">
        <a-spin :loading="loading" tip="验证中...">
          <div class="form-content">
            <div class="share-info" v-if="shareInfo">
              <div class="file-icon">
                <icon-file v-if="shareInfo.resourceType === 'file'" :size="64" />
                <icon-folder v-else :size="64" />
              </div>
              <div class="file-name">{{ getResourceName() }}</div>
              <div class="file-meta">
                <span v-if="shareInfo.resourceType === 'file'">
                  {{ formatFileSize(getFileSize()) }}
                </span>
                <span class="sharer">分享者: {{ shareInfo.sharer }}</span>
              </div>
            </div>

            <a-form :model="form" layout="vertical" @submit="handleVerify">
              <a-form-item
                field="password"
                label="访问密码"
                :rules="[{ required: true, message: '请输入访问密码' }]"
                :validate-status="error ? 'error' : undefined"
                :help="error"
              >
                <a-input-password
                  v-model="form.password"
                  placeholder="请输入访问密码"
                  size="large"
                  allow-clear
                  @press-enter="handleVerify"
                >
                  <template #prefix>
                    <icon-lock />
                  </template>
                </a-input-password>
              </a-form-item>

              <a-button type="primary" html-type="submit" long size="large" :loading="loading">
                访问分享
              </a-button>
            </a-form>
          </div>
        </a-spin>
      </div>

      <!-- 分享内容展示 -->
      <div v-else class="share-content">
        <a-spin :loading="loading">
          <div class="content-header">
            <div class="file-info">
              <div class="file-icon-large">
                <icon-file v-if="shareInfo.resourceType === 'file'" :size="80" />
                <icon-folder v-else :size="80" />
              </div>
              <div class="file-details">
                <h2 class="file-name-large">{{ getResourceName() }}</h2>
                <div class="file-meta-large">
                  <span v-if="shareInfo.resourceType === 'file'">
                    大小: {{ formatFileSize(getFileSize()) }}
                  </span>
                  <span>分享者: {{ shareInfo.sharer }}</span>
                  <span v-if="shareInfo.share.ExpireTime">
                    过期时间: {{ formatDate(shareInfo.share.ExpireTime) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="actions">
              <a-button
                v-if="shareInfo.resourceType === 'file'"
                type="primary"
                size="large"
                :loading="downloading"
                @click="handleDownload"
              >
                <template #icon>
                  <icon-download />
                </template>
                下载文件
              </a-button>
              <a-button
                v-else
                type="primary"
                size="large"
                @click="handleViewFolder"
              >
                <template #icon>
                  <icon-eye />
                </template>
                查看文件夹
              </a-button>
            </div>
          </div>

          <!-- 文件夹内容列表 -->
          <div v-if="shareInfo.resourceType === 'folder' && showFolderContent" class="folder-content">
            <a-table
              :columns="columns"
              :data="folderFiles"
              :pagination="false"
              :loading="loadingFiles"
            >
              <template #name="{ record }">
                <div class="file-item">
                  <icon-file v-if="record.type === 'file'" />
                  <icon-folder v-else />
                  <span>{{ record.name }}</span>
                </div>
              </template>
              <template #size="{ record }">
                {{ record.type === 'file' ? formatFileSize(record.size) : '-' }}
              </template>
              <template #actions="{ record }">
                <a-button
                  v-if="record.type === 'file'"
                  type="text"
                  size="small"
                  @click="handleDownloadFile(record)"
                >
                  下载
                </a-button>
              </template>
            </a-table>
          </div>
        </a-spin>
      </div>

      <!-- 错误提示 -->
      <div v-if="notFound" class="error-message">
        <icon-exclamation-circle :size="64" />
        <h2>分享不存在或已失效</h2>
        <p>请检查分享链接是否正确，或联系分享者重新分享</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  IconFile,
  IconFolder,
  IconLock,
  IconDownload,
  IconEye,
  IconExclamationCircle,
} from '@arco-design/web-vue/es/icon'
import { getShareInfo, accessShare, downloadShareFile } from '@/modules/cloud/api/share'
import type { ShareInfo } from '@/modules/cloud/types'

const route = useRoute()
const shareCode = ref(route.params.code as string)

const loading = ref(false)
const downloading = ref(false)
const loadingFiles = ref(false)
const verified = ref(false)
const notFound = ref(false)
const error = ref('')
const showFolderContent = ref(false)

const form = ref({
  password: '',
})

const shareInfo = ref<ShareInfo | null>(null)
const folderFiles = ref<any[]>([])

const columns = [
  {
    title: '文件名',
    dataIndex: 'name',
    slotName: 'name',
  },
  {
    title: '大小',
    dataIndex: 'size',
    slotName: 'size',
    width: 120,
  },
  {
    title: '修改时间',
    dataIndex: 'updateTime',
    width: 180,
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 100,
  },
]

// 获取资源名称
function getResourceName(): string {
  if (!shareInfo.value) return ''
  if (shareInfo.value.resourceType === 'file') {
    return shareInfo.value.file?.name || ''
  }
  return shareInfo.value.folder?.name || ''
}

// 获取文件大小
function getFileSize(): number {
  if (!shareInfo.value || shareInfo.value.resourceType !== 'file') return 0
  return shareInfo.value.file?.fileSize || 0
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化日期
function formatDate(date: string): string {
  return new Date(date).toLocaleString('zh-CN')
}

// 加载分享信息
async function loadShareInfo() {
  loading.value = true
  error.value = ''
  try {
    const info = await getShareInfo(shareCode.value)
    shareInfo.value = info

    // 如果是公开分享，直接验证通过
    if (info.share.ShareType === 'public') {
      verified.value = true
    }
  } catch (e: any) {
    console.error('获取分享信息失败:', e)
    if (e?.response?.status === 404) {
      notFound.value = true
    } else {
      Message.error(e?.message || '获取分享信息失败')
    }
  } finally {
    loading.value = false
  }
}

// 验证密码
async function handleVerify() {
  if (!form.value.password.trim()) {
    error.value = '请输入访问密码'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const info = await accessShare(shareCode.value, form.value.password)
    shareInfo.value = info
    verified.value = true
    Message.success('验证成功')
  } catch (e: any) {
    console.error('访问分享失败:', e)
    error.value = e?.message || '密码错误，请重试'
  } finally {
    loading.value = false
  }
}

// 下载文件
async function handleDownload() {
  if (!shareInfo.value || shareInfo.value.resourceType !== 'file') return

  downloading.value = true
  try {
    await downloadShareFile(
      shareCode.value,
      shareInfo.value.file?.name || `file-${Date.now()}`
    )
    Message.success('开始下载')
  } catch (e: any) {
    console.error('下载失败:', e)
    Message.error(e?.message || '下载失败')
  } finally {
    downloading.value = false
  }
}

// 查看文件夹
function handleViewFolder() {
  showFolderContent.value = true
  // TODO: 加载文件夹内容
  Message.info('文件夹内容展示功能开发中')
}

// 下载文件夹中的文件
function handleDownloadFile(file: any) {
  Message.info('文件下载功能开发中')
}

onMounted(() => {
  if (!shareCode.value) {
    notFound.value = true
    return
  }
  loadShareInfo()
})
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.share-container {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.share-header {
  text-align: center;
  padding: 40px 20px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.share-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
}

.share-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.password-form {
  padding: 40px;
}

.form-content {
  max-width: 400px;
  margin: 0 auto;
}

.share-info {
  text-align: center;
  margin-bottom: 30px;
}

.file-icon {
  color: #667eea;
  margin-bottom: 16px;
}

.file-name {
  font-size: 18px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 8px;
  word-break: break-all;
}

.file-meta {
  font-size: 14px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sharer {
  color: #667eea;
}

.share-content {
  padding: 40px;
}

.content-header {
  margin-bottom: 30px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.file-icon-large {
  color: #667eea;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name-large {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px;
  word-break: break-all;
}

.file-meta-large {
  font-size: 14px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.actions {
  display: flex;
  gap: 12px;
}

.folder-content {
  margin-top: 30px;
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-message {
  text-align: center;
  padding: 60px 40px;
  color: #6b7280;
}

.error-message h2 {
  font-size: 20px;
  color: #1f2937;
  margin: 20px 0 12px;
}

.error-message p {
  font-size: 14px;
  margin: 0;
}
</style>
