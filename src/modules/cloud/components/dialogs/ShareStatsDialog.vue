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
            <div class="item-name">{{ share?.fileName || '未知文件' }}</div>
            <div class="item-meta">
              <span class="meta-item">
                <icon-link />
                {{ share?.shareCode }}
              </span>
              <span v-if="share?.password" class="meta-item">
                <icon-lock />
                {{ share?.password }}
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
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="stats-note">
        <icon-info-circle />
        <span>统计数据来自分享创建以来的累计访问和下载次数</span>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { IconLink, IconLock, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import type { ShareListItem } from '@/modules/cloud/types'

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

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

const accessCount = computed(() => {
  return props.share?.viewCount || 0
})

const downloadCount = computed(() => {
  return props.share?.downloadCount || 0
})

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
  gap: 48px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  justify-content: center;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.stats-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 13px;
  color: #0369a1;
}

.stats-note svg {
  flex-shrink: 0;
}
</style>
