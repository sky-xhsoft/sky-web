<template>
  <div class="cloud-share-manager">
    <div class="cloud-share-manager__header">
      <h3>我的分享</h3>
      <a-space>
        <!-- 筛选器 -->
        <a-select v-model="filterStatus" placeholder="筛选状态" style="width: 120px">
          <a-option value="all">全部</a-option>
          <a-option value="active">有效</a-option>
          <a-option value="expired">已过期</a-option>
        </a-select>
        <a-button @click="handleRefresh" :loading="loading">
          <icon-refresh />
          刷新
        </a-button>
      </a-space>
    </div>

    <!-- 统计信息 -->
    <div v-if="shares.length > 0 && !loading" class="cloud-share-manager__stats">
      <a-statistic title="总分享" :value="shares.length" />
      <a-statistic title="有效分享" :value="activeShareCount" :value-style="{ color: '#00b42a' }" />
      <a-statistic title="已过期" :value="expiredShareCount" :value-style="{ color: '#f53f3f' }" />
    </div>

    <!-- 空状态 -->
    <a-empty
      v-if="shares.length === 0 && !loading"
      description="暂无分享"
      class="cloud-share-manager__empty"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="cloud-share-manager__loading">
      <a-spin />
    </div>

    <!-- 分享列表 -->
    <div v-else-if="shares.length > 0" class="cloud-share-manager__list">
      <div
        v-for="share in filteredShares"
        :key="share.ID"
        class="share-item"
        :class="{ 'is-expired': isExpired(share) }"
      >
        <div class="share-item__info">
          <div class="share-name">
            {{ share.FileName || '未知文件' }}
          </div>
          <div class="share-meta">
            <span class="share-code">
              <icon-link />
              {{ share.ShareCode }}
            </span>
            <span v-if="share.Password" class="share-password">
              <icon-lock />
              {{ share.Password }}
            </span>
            <span class="share-time">
              <icon-clock-circle />
              {{ formatDate(share.CreateTime) }}
            </span>
          </div>
        </div>

        <div class="share-item__status">
          <a-tag v-if="isExpired(share)" color="red">已过期</a-tag>
          <a-tag v-else color="green">
            剩余 {{ getRemainingDays(share) }} 天
          </a-tag>
        </div>

        <div class="share-item__actions">
          <a-button
            size="small"
            type="text"
            @click="handleCopy(share)"
            :disabled="isExpired(share)"
          >
            <icon-copy />
            复制链接
          </a-button>
          <a-button
            size="small"
            type="text"
            @click="handleEdit(share)"
            :disabled="isExpired(share)"
          >
            <icon-edit />
            编辑
          </a-button>
          <a-button
            size="small"
            type="text"
            @click="handleViewStats(share)"
          >
            <icon-eye />
            访问统计
          </a-button>
          <a-button
            size="small"
            type="text"
            status="danger"
            @click="handleDelete(share)"
          >
            <icon-delete />
            删除
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  IconRefresh,
  IconLink,
  IconLock,
  IconClockCircle,
  IconCopy,
  IconEdit,
  IconEye,
  IconDelete,
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
}

const props = withDefaults(defineProps<Props>(), {
  shares: () => [],
  loading: false,
})

const emit = defineEmits<Emits>()

// 筛选状态
const filterStatus = ref<'all' | 'active' | 'expired'>('all')

function isExpired(share: ShareListItem): boolean {
  if (!share.ExpireTime) return false
  return new Date(share.ExpireTime) < new Date()
}

function getRemainingDays(share: ShareListItem): number {
  if (!share.ExpireTime) return 999
  const expTime = new Date(share.ExpireTime).getTime()
  const now = Date.now()
  const diff = expTime - now
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// 筛选后的分享列表
const filteredShares = computed(() => {
  if (filterStatus.value === 'all') {
    return props.shares
  } else if (filterStatus.value === 'active') {
    return props.shares.filter((share) => !isExpired(share))
  } else {
    return props.shares.filter((share) => isExpired(share))
  }
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

function handleCopy(share: ShareListItem) {
  emit('copy', share)
}

function handleEdit(share: ShareListItem) {
  emit('edit', share)
}

function handleViewStats(share: ShareListItem) {
  emit('viewStats', share)
}

function handleDelete(share: ShareListItem) {
  emit('delete', share)
}
</script>

<style scoped>
.cloud-share-manager {
  width: 100%;
}

.cloud-share-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cloud-share-manager__header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.cloud-share-manager__stats {
  display: flex;
  gap: 32px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.cloud-share-manager__empty {
  padding: 60px 0;
}

.cloud-share-manager__loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.cloud-share-manager__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.share-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.share-item.is-expired {
  opacity: 0.6;
  background: #f9fafb;
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
}

.share-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.share-code {
  color: #3b82f6;
  font-family: monospace;
}

.share-password {
  color: #10b981;
}

.share-item__status {
  flex: 0 0 auto;
}

.share-item__actions {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .share-item {
    flex-direction: column;
    align-items: stretch;
  }

  .share-item__actions {
    justify-content: flex-end;
  }
}
</style>
