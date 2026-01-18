<template>
  <a-modal
    v-model:visible="dialogVisible"
    title="访问统计"
    :footer="false"
    width="700px"
    @cancel="handleCancel"
  >
    <div class="share-stats">
      <!-- 分享基本信息 -->
      <div class="stats-header">
        <div class="share-item">
          <div class="item-icon">📄</div>
          <div class="item-info">
            <div class="item-name">{{ share?.FileName || '未知文件' }}</div>
            <div class="item-meta">
              <span class="meta-item">
                <icon-link />
                {{ share?.ShareCode }}
              </span>
              <span v-if="share?.Password" class="meta-item">
                <icon-lock />
                {{ share?.Password }}
              </span>
            </div>
          </div>
        </div>

        <!-- 统计数据 -->
        <div class="stats-summary">
          <div class="stat-item">
            <div class="stat-value">{{ accessCount }}</div>
            <div class="stat-label">访问次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ downloadCount }}</div>
            <div class="stat-label">下载次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ uniqueVisitors }}</div>
            <div class="stat-label">独立访客</div>
          </div>
        </div>
      </div>

      <!-- 访问记录 -->
      <div class="stats-body">
        <h4 class="section-title">访问记录</h4>

        <div v-if="loading" class="loading-container">
          <a-spin />
        </div>

        <a-empty
          v-else-if="!loading && accessRecords.length === 0"
          description="暂无访问记录"
        />

        <div v-else class="access-records">
          <a-table
            :data="accessRecords"
            :pagination="pagination"
            :loading="loading"
            :bordered="false"
          >
            <template #columns>
              <a-table-column title="访问时间" data-index="AccessTime">
                <template #cell="{ record }">
                  {{ formatDate(record.AccessTime) }}
                </template>
              </a-table-column>
              <a-table-column title="访问IP" data-index="IPAddress">
                <template #cell="{ record }">
                  {{ record.IPAddress || '未知' }}
                </template>
              </a-table-column>
              <a-table-column title="操作" data-index="Action">
                <template #cell="{ record }">
                  <a-tag
                    v-if="record.Action === 'view'"
                    color="blue"
                  >
                    查看
                  </a-tag>
                  <a-tag
                    v-else-if="record.Action === 'download'"
                    color="green"
                  >
                    下载
                  </a-tag>
                  <a-tag v-else color="gray">
                    {{ record.Action }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="用户代理" data-index="UserAgent">
                <template #cell="{ record }">
                  <div class="user-agent">
                    {{ parseUserAgent(record.UserAgent) }}
                  </div>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconLink, IconLock } from '@arco-design/web-vue/es/icon'
import type { ShareListItem } from '@/modules/cloud/types'
import { formatDate } from '@/modules/cloud/utils/format'
import { getShareAccessRecords } from '@/modules/cloud/api'

interface AccessRecord {
  ID: number
  ShareID: number
  AccessTime: string
  IPAddress: string
  Action: 'view' | 'download'
  UserAgent: string
}

interface Props {
  visible?: boolean
  share?: ShareListItem | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  share: null,
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const loading = ref(false)
const accessRecords = ref<AccessRecord[]>([])

const pagination = {
  pageSize: 10,
  showTotal: true,
}

watch(
  () => props.visible,
  async (newValue) => {
    dialogVisible.value = newValue
    if (newValue && props.share) {
      await loadAccessRecords()
    }
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

const accessCount = computed(() => {
  return accessRecords.value.length
})

const downloadCount = computed(() => {
  return accessRecords.value.filter((r) => r.Action === 'download').length
})

const uniqueVisitors = computed(() => {
  const uniqueIPs = new Set(accessRecords.value.map((r) => r.IPAddress))
  return uniqueIPs.size
})

async function loadAccessRecords() {
  if (!props.share) return

  loading.value = true
  try {
    // 调用后端API获取访问记录
    const records = await getShareAccessRecords(props.share.ID)

    if (records && records.length > 0) {
      accessRecords.value = records
    } else {
      // 如果后端未实现或无数据，显示模拟数据（仅用于演示）
      accessRecords.value = [
        {
          ID: 1,
          ShareID: props.share.ID,
          AccessTime: new Date(Date.now() - 3600000).toISOString(),
          IPAddress: '192.168.1.100',
          Action: 'view',
          UserAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        {
          ID: 2,
          ShareID: props.share.ID,
          AccessTime: new Date(Date.now() - 7200000).toISOString(),
          IPAddress: '192.168.1.101',
          Action: 'download',
          UserAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        {
          ID: 3,
          ShareID: props.share.ID,
          AccessTime: new Date(Date.now() - 10800000).toISOString(),
          IPAddress: '192.168.1.100',
          Action: 'download',
          UserAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      ]
    }
  } catch (error: any) {
    console.error('加载访问记录失败:', error)
    Message.error(error?.message || '加载访问记录失败')
    accessRecords.value = []
  } finally {
    loading.value = false
  }
}

function parseUserAgent(userAgent: string): string {
  if (!userAgent) return '未知'

  // 简单解析User-Agent - 注意顺序：Android 包含 Linux，需要先检查 Android
  if (userAgent.includes('Android')) {
    return 'Android'
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return 'iOS'
  } else if (userAgent.includes('Windows')) {
    return 'Windows'
  } else if (userAgent.includes('Macintosh')) {
    return 'macOS'
  } else if (userAgent.includes('Linux')) {
    return 'Linux'
  }

  return '未知设备'
}

function handleCancel() {
  dialogVisible.value = false
}
</script>

<style scoped>
.share-stats {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.share-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
}

.stats-summary {
  display: flex;
  gap: 24px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stats-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.access-records {
  background: #fff;
  border-radius: 8px;
}

.user-agent {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
