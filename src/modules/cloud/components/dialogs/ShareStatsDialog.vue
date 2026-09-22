<template>
  <V2Modal
    v-model:visible="dialogVisible"
    :title="t('cloud.shareStatsTitle')"
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
            <div class="item-name">{{ share?.fileName || t('cloud.unknownFile') }}</div>
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
            <div class="stat-label">{{ t('cloud.viewCount') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ downloadCount }}</div>
            <div class="stat-label">{{ t('cloud.downloadCount') }}</div>
          </div>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="stats-note">
        <icon-info-circle />
        <span>{{ t('cloud.statsNote') }}</span>
      </div>
    </div>
  </V2Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconLink, IconLock, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import type { ShareListItem } from '@/modules/cloud/types'
import { V2Modal } from '@/components/ui'

const { t } = useI18n()

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
  background: var(--bg-hover);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
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
  color: var(--text-primary);
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
  color: var(--text-secondary);
}

.stats-summary {
  display: flex;
  gap: 48px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  justify-content: center;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--brand-blue);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.stats-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--info-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--info);
}

.stats-note svg {
  flex-shrink: 0;
}
</style>
