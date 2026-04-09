<template>
  <div class="cloud-share-manager-page">
    <div class="page-header">
      <h2>
        <icon-share-alt />
        我的分享
      </h2>
      <a-button @click="handleBack">
        <icon-arrow-left />
        返回云盘
      </a-button>
    </div>
    <div class="page-content">
      <!-- 头部操作栏 -->
      <div class="cloud-share-manager__header">
        <div class="header-left">
          <h3>
            <icon-share-alt />
            我的分享
          </h3>
        </div>
        <div class="header-right">
          <a-space size="small">
            <a-input-search
              v-model="searchKeyword"
              placeholder="搜索文件名称"
              style="width: 200px"
              clearable
              @search="handleSearch"
            />
            <a-select v-model="filterStatus" placeholder="筛选状态" style="width: 120px">
              <a-option value="all">
                <template #icon><icon-apps /></template>
                全部
              </a-option>
              <a-option value="active">
                <template #icon><icon-check-circle /></template>
                有效
              </a-option>
              <a-option value="expired">
                <template #icon><icon-close-circle /></template>
                已过期
              </a-option>
            </a-select>
            <a-button @click="handleRefresh" :loading="loading">
              <icon-refresh />
              刷新
            </a-button>
          </a-space>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div v-if="shares.length > 0 && !loading" class="cloud-share-manager__stats">
        <div class="stat-card stat-card--total">
          <div class="stat-icon">
            <icon-share-alt />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ shares.length }}</div>
            <div class="stat-label">总分享</div>
          </div>
        </div>
        <div class="stat-card stat-card--active">
          <div class="stat-icon">
            <icon-check-circle />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ activeShareCount }}</div>
            <div class="stat-label">有效分享</div>
          </div>
        </div>
        <div class="stat-card stat-card--expired">
          <div class="stat-icon">
            <icon-close-circle />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ expiredShareCount }}</div>
            <div class="stat-label">已过期</div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <a-empty
        v-if="filteredShares.length === 0 && shares.length === 0 && !loading"
        description="暂无分享"
        class="cloud-share-manager__empty"
      >
        <template #image>
          <icon-empty />
        </template>
      </a-empty>

      <!-- 搜索无结果 -->
      <a-empty
        v-else-if="filteredShares.length === 0 && searchKeyword && !loading"
        description="未找到匹配的分享"
        class="cloud-share-manager__empty"
      />

      <!-- 加载状态 -->
      <div v-else-if="loading" class="cloud-share-manager__loading">
        <a-spin size="large" />
        <span>加载中...</span>
      </div>

      <!-- 分享列表 -->
      <div v-else class="cloud-share-manager__list">
        <div
          v-for="share in filteredShares"
          :key="share.id"
          class="share-item"
          :class="{ 'is-expired': isExpired(share) }"
        >
          <!-- 文件图标 -->
          <div class="share-item__icon">
            <component :is="getFileIcon(share.resourceType)" />
          </div>

          <!-- 文件信息 -->
          <div class="share-item__info">
            <div class="share-name">
              {{ share.fileName || '未知文件' }}
            </div>
            <div class="share-meta">
              <span class="meta-item">
                <icon-link />
                <span class="meta-label">分享码:</span>
                <span class="meta-value code">{{ share.shareCode }}</span>
              </span>
              <span v-if="share.password" class="meta-item">
                <icon-lock />
                <span class="meta-label">访问密码:</span>
                <span class="meta-value password">{{ share.password }}</span>
              </span>
              <span class="meta-item">
                <icon-clock-circle />
                <span class="meta-label">创建时间:</span>
                <span class="meta-value">{{ formatDate(share.createTime) }}</span>
              </span>
            </div>
            <div class="share-quick-copy">
              <a-tag size="mini" @click.stop="handleCopyShareCode(share)" :bordered="false" color="arcoblue">
                <icon-copy />
                复制链接
              </a-tag>
              <a-tag v-if="share.password" size="mini" @click.stop="handleCopyPassword(share)" :bordered="false" color="green">
                <icon-lock />
                复制密码
              </a-tag>
            </div>
          </div>

          <!-- 状态标签 -->
          <div class="share-item__status">
            <a-tag v-if="isExpired(share)" color="red" size="small">
              <icon-close-circle />
              已过期
            </a-tag>
            <a-tag v-else :color="getDaysColor(getRemainingDays(share))" size="small">
              <icon-clock-circle />
              剩余 {{ getRemainingDays(share) === 999 ? '永久' : getRemainingDays(share) + ' 天' }}
            </a-tag>
          </div>

          <!-- 进度条（仅有效分享显示） -->
          <div v-if="!isExpired(share) && share.expireTime" class="share-item__progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getProgressPercent(share) + '%' }" :class="{ 'is-warning': getRemainingDays(share) <= 3 }" />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="share-item__actions">
            <a-dropdown trigger="click">
              <template #content>
                <a-doption @click="handleCopy(share)" :disabled="isExpired(share)">
                  <icon-copy />
                  复制链接
                </a-doption>
                <a-doption @click="handleCopyShareCode(share)" :disabled="isExpired(share)">
                  <icon-link />
                  复制分享码
                </a-doption>
                <a-doption v-if="share.password" @click="handleCopyPassword(share)">
                  <icon-lock />
                  复制访问密码
                </a-doption>
                <a-doption @click="handleEdit(share)" :disabled="isExpired(share)">
                  <icon-edit />
                  编辑
                </a-doption>
                <a-doption @click="handleViewStats(share)">
                  <icon-eye />
                  访问统计
                </a-doption>
              </template>
              <a-button size="small" type="text">
                <icon-more />
              </a-button>
            </a-dropdown>
            <a-button
              size="small"
              type="text"
              status="danger"
              @click="handleDelete(share)">
              <icon-delete />
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <EditShareDialog
      v-model:visible="dialogs.editShare"
      :share="currentShare"
      :loading="loading.editShare"
      @confirm="handleEditShare"
    />
    <ShareStatsDialog
      v-model:visible="dialogs.shareStats"
      :share="currentShare"
      :loading="loading.shareStats"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useNavigationStore } from '@/stores/navigation'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconShareAlt,
  IconArrowLeft,
  IconRefresh,
  IconLink,
  IconLock,
  IconClockCircle,
  IconCopy,
  IconEdit,
  IconEye,
  IconDelete,
  IconCheckCircle,
  IconCloseCircle,
  IconFile,
  IconFolder,
  IconMore,
  IconApps,
  IconEmpty,
} from '@arco-design/web-vue/es/icon'
import { EditShareDialog, ShareStatsDialog } from '@/modules/cloud/components'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import useCloudShare from '@/modules/cloud/composables/useCloudShare'
import type { ShareListItem } from '@/modules/cloud/types'
import { formatDate } from '@/modules/cloud/utils/format'

const navigationStore = useNavigationStore()
const store = useCloudStore()
const share = useCloudShare()

// 分享相关对话框
const currentShare = ref<ShareListItem | null>(null)
const dialogs = ref({
  editShare: false,
  shareStats: false,
})
const loadingLocal = ref({
  editShare: false,
  shareStats: false,
})

// 筛选状态
const filterStatus = ref<'all' | 'active' | 'expired'>('all')
const searchKeyword = ref('')
const selectedShares = ref<number[]>([])

// 数据相关
const shares = computed(() => store.myShares)
const loading = computed(() => store.loading.shares)

function isExpired(shareItem: ShareListItem): boolean {
  if (!shareItem.expireTime) return false
  return new Date(shareItem.expireTime) < new Date()
}

function getRemainingDays(shareItem: ShareListItem): number {
  if (!shareItem.expireTime) return 999
  const expTime = new Date(shareItem.expireTime).getTime()
  const now = Date.now()
  const diff = expTime - now
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getDaysColor(days: number): string {
  if (days === 999) return 'green'
  if (days <= 1) return 'red'
  if (days <= 3) return 'orange'
  if (days <= 7) return 'gold'
  return 'green'
}

function getProgressPercent(shareItem: ShareListItem): number {
  if (!shareItem.expireTime) return 100
  if (!shareItem.createTime) return 100

  const createTime = new Date(shareItem.createTime).getTime()
  const expireTime = new Date(shareItem.expireTime).getTime()
  const now = Date.now()
  const total = expireTime - createTime
  const passed = now - createTime
  if (total <= 0) return 100
  const remaining = Math.max(0, Math.min(100, 100 - (passed / total) * 100))
  return remaining
}

function getFileIcon(resourceType: string) {
  return resourceType === 'folder' ? IconFolder : IconFile
}

// 筛选后的分享列表
const filteredShares = computed(() => {
  let result = shares.value

  // 状态筛选
  if (filterStatus.value === 'active') {
    result = result.filter((shareItem) => !isExpired(shareItem))
  } else if (filterStatus.value === 'expired') {
    result = result.filter((shareItem) => isExpired(shareItem))
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter((shareItem) =>
      (shareItem.fileName || '').toLowerCase().includes(keyword) ||
      shareItem.shareCode.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 统计数据
const activeShareCount = computed(() => {
  return shares.value.filter((shareItem) => !isExpired(shareItem)).length
})

const expiredShareCount = computed(() => {
  return shares.value.filter((shareItem) => isExpired(shareItem)).length
})

onMounted(async () => {
  // 确保加载分享数据
  await store.loadShares()
})

function handleBack() {
  navigationStore.navigateTo('Cloud', '云盘', {}, false)
}

function handleRefresh() {
  store.loadShares()
}

function handleSearch() {
  // 搜索自动通过 computed 完成
}

function handleCopy(shareItem: ShareListItem) {
  share.copyShareLink(shareItem)
}

function handleCopyShareCode(shareItem: ShareListItem) {
  navigator.clipboard.writeText(shareItem.shareCode).then(() => {
    Message.success('分享码已复制')
  }).catch(() => {
    Message.error('复制失败，请手动复制')
  })
}

function handleCopyPassword(shareItem: ShareListItem) {
  if (!shareItem.password) return
  navigator.clipboard.writeText(shareItem.password).then(() => {
    Message.success('访问密码已复制')
  }).catch(() => {
    Message.error('复制失败，请手动复制')
  })
}

function handleEdit(shareItem: ShareListItem) {
  currentShare.value = shareItem
  dialogs.value.editShare = true
}

function handleViewStats(shareItem: ShareListItem) {
  currentShare.value = shareItem
  dialogs.value.shareStats = true
}

function handleDelete(shareItem: ShareListItem) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分享"${shareItem.fileName || '未知文件'}"吗？`,
    okText: '删除',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger',
    },
    onOk: () => {
      share.removeShareWithConfirm(shareItem)
    },
  })
}

async function handleEditShare(params: { expirationDays: number; password?: string }) {
  if (!currentShare.value) return
  loadingLocal.value.editShare = true
  try {
    const success = await share.modifyShare(currentShare.value.id, params)
    if (success) {
      dialogs.value.editShare = false
      currentShare.value = null
      await store.loadShares()
    }
  } finally {
    loadingLocal.value.editShare = false
  }
}
</script>

<style scoped lang="scss">
.cloud-share-manager-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .page-content {
    flex: 1;
    overflow: hidden;
    background: #f9fafb;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
}

// 复制 CloudShareManager 组件的样式
.cloud-share-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.cloud-share-manager__stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;

  .stat-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &--total {
      border-left: 3px solid #3b82f6;
    }

    &--active {
      border-left: 3px solid #10b981;
    }

    &--expired {
      border-left: 3px solid #ef4444;
    }
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;

    .stat-card--total & {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .stat-card--active & {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .stat-card--expired & {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: #6b7280;
    margin-top: 2px;
  }
}

.cloud-share-manager__empty {
  padding: 60px 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cloud-share-manager__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
  flex: 1;

  span {
    color: #6b7280;
    font-size: 14px;
  }
}

.cloud-share-manager__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
}

.share-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.is-expired {
    opacity: 0.6;
    background: #fef2f2;
  }
}

.share-item__icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #4b5563;
  flex-shrink: 0;
}

.share-item__info {
  flex: 1;
  min-width: 0;
}

.share-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;

  .meta-label {
    font-weight: 500;
  }

  .meta-value {
    font-family: monospace;
    font-weight: 500;

    &.code {
      color: #3b82f6;
    }

    &.password {
      color: #059669;
    }
  }
}

.share-quick-copy {
  display: flex;
  gap: 8px;
}

.share-item__status {
  flex-shrink: 0;
}

.share-item__progress {
  width: 100px;
  flex-shrink: 0;

  .progress-bar {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.3s;

    &.is-warning {
      background: #f59e0b;
    }
  }
}

.share-item__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
</style>
