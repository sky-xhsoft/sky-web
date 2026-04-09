<template>
  <div class="cloud-share-manager">
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconRefresh,
  IconLink,
  IconLock,
  IconClockCircle,
  IconCopy,
  IconEdit,
  IconEye,
  IconDelete,
  IconShareAlt,
  IconCheckCircle,
  IconCloseCircle,
  IconFile,
  IconFolder,
  IconMore,
  IconApps,
  IconEmpty,
} from '@arco-design/web-vue/es/icon'
import type { ShareListItem } from '@/modules/cloud/types'
import { formatDate } from '@/modules/cloud/utils/format'

interface Props {
  shares?: ShareListItem[]
  loading?: boolean
}

interface Emits {
  (e: 'refresh'): void
  (e: 'copy', share: ShareListItem): void
  (e: 'edit', share: ShareListItem): void
  (e: 'viewStats', share: ShareListItem): void
  (e: 'delete', share: ShareListItem): void
  (e: 'batchDelete', ids: number[]): void
}

const props = withDefaults(defineProps<Props>(), {
  shares: () => [],
  loading: false,
})

const emit = defineEmits<Emits>()

// 筛选状态
const filterStatus = ref<'all' | 'active' | 'expired'>('all')
const searchKeyword = ref('')
const selectedShares = ref<number[]>([])

function isExpired(share: ShareListItem): boolean {
  if (!share.expireTime) return false
  return new Date(share.expireTime) < new Date()
}

function getRemainingDays(share: ShareListItem): number {
  if (!share.expireTime) return 999
  const expTime = new Date(share.expireTime).getTime()
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

function getProgressPercent(share: ShareListItem): number {
  if (!share.expireTime) return 100
  if (!share.createTime) return 100

  const createTime = new Date(share.createTime).getTime()
  const expireTime = new Date(share.expireTime).getTime()
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
  let result = props.shares

  // 状态筛选
  if (filterStatus.value === 'active') {
    result = result.filter((share) => !isExpired(share))
  } else if (filterStatus.value === 'expired') {
    result = result.filter((share) => isExpired(share))
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter((share) =>
      (share.fileName || '').toLowerCase().includes(keyword) ||
      share.shareCode.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 统计数据
const activeShareCount = computed(() => {
  return props.shares.filter((share) => !isExpired(share)).length
})

const expiredShareCount = computed(() => {
  return props.shares.filter((share) => isExpired(share)).length
})

function handleRefresh() {
  emit('refresh')
}

function handleSearch() {
  // 搜索自动通过 computed 完成
}

function handleCopy(share: ShareListItem) {
  emit('copy', share)
}

function handleCopyShareCode(share: ShareListItem) {
  navigator.clipboard.writeText(share.shareCode).then(() => {
    Message.success('分享码已复制')
  }).catch(() => {
    Message.error('复制失败，请手动复制')
  })
}

function handleCopyPassword(share: ShareListItem) {
  if (!share.password) return
  navigator.clipboard.writeText(share.password).then(() => {
    Message.success('访问密码已复制')
  }).catch(() => {
    Message.error('复制失败，请手动复制')
  })
}

function handleEdit(share: ShareListItem) {
  emit('edit', share)
}

function handleViewStats(share: ShareListItem) {
  emit('viewStats', share)
}

function handleDelete(share: ShareListItem) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分享"${share.fileName || '未知文件'}"吗？`,
    okText: '删除',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger',
    },
    onOk: () => {
      emit('delete', share)
    },
  })
}

function handleBatchDelete() {
  if (selectedShares.value.length === 0) return
  Modal.confirm({
    title: '批量删除',
    content: `确定要删除选中的 ${selectedShares.value.length} 个分享吗？`,
    okText: '删除',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger',
    },
    onOk: () => {
      emit('batchDelete', selectedShares.value)
      clearSelection()
    },
  })
}

function clearSelection() {
  selectedShares.value = []
}
</script>

<style scoped lang="scss">
.cloud-share-manager {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

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
  display: grid;
  grid-template-columns: 48px 1fr auto auto;
  align-items: start;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }
}

.share-item.is-expired {
  opacity: 0.6;
  background: #f9fafb;
  border-style: dashed;

  &:hover {
    border-color: #d1d5db;
    box-shadow: none;
  }
}

.share-item__icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 24px;
  color: #3b82f6;
}

.share-item__info {
  flex: 1;
  min-width: 0;
}

.share-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.share-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.meta-label {
  color: #9ca3af;
}

.meta-value {
  color: #374151;
  font-weight: 500;

  &.code {
    color: #3b82f6;
    font-family: monospace;
  }

  &.password {
    color: #10b981;
  }
}

.share-quick-copy {
  display: flex;
  gap: 8px;
}

.share-item__status {
  flex: 0 0 auto;
  align-self: center;
}

.share-item__progress {
  grid-column: 2 / 3;
  margin-top: 4px;

  .progress-bar {
    width: 100%;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 2px;
      transition: width 0.3s;

      &.is-warning {
        background: #f59e0b;
      }
    }
  }
}

.share-item__actions {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
  align-self: center;
}

.cloud-share-manager__batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  margin-top: 16px;

  .batch-info {
    flex: 1;
    font-size: 14px;
    color: #c2410c;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .cloud-share-manager__header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    width: 100%;

    .arco-input-search,
    .arco-select {
      flex: 1;
    }
  }

  .cloud-share-manager__stats {
    flex-direction: column;
  }

  .share-item {
    grid-template-columns: 40px 1fr;
    gap: 12px;
  }

  .share-item__status,
  .share-item__actions {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .share-item__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .share-meta {
    gap: 8px 16px;
  }
}
</style>
