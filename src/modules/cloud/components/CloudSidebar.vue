<template>
  <aside class="cloud-sidebar" :aria-label="t('cloud.categories')">
    <a-upload
      :custom-request="handleUpload"
      :show-file-list="false"
      multiple
      class="cloud-sidebar__upload"
    >
      <template #upload-button>
        <button type="button" class="cloud-sidebar__upload-btn">
          <icon-upload />
          {{ t('cloud.uploadFiles') }}
        </button>
      </template>
    </a-upload>

    <nav class="cloud-sidebar__nav">
      <button
        v-for="cat in categories"
        :key="cat.key"
        type="button"
        class="cloud-sidebar__item"
        :class="{ 'is-active': cat.key === active }"
        :aria-pressed="cat.key === active"
        @click="emit('change', cat.key)"
      >
        <component :is="cat.icon" class="cloud-sidebar__icon" />
        <span class="cloud-sidebar__label">{{ cat.label }}</span>
        <span class="cloud-sidebar__count">{{ counts[cat.key] ?? 0 }}</span>
      </button>

      <div class="cloud-sidebar__divider" />

      <button type="button" class="cloud-sidebar__item" @click="emit('open-shares')">
        <icon-share-alt class="cloud-sidebar__icon" />
        <span class="cloud-sidebar__label">{{ t('cloud.myShares') }}</span>
      </button>
    </nav>

    <div class="cloud-sidebar__quota">
      <div class="quota-head">
        <span>{{ t('cloud.storageSpace') }}</span>
        <span>{{ quotaPercent }}%</span>
      </div>
      <div class="quota-bar" role="progressbar" :aria-valuenow="quotaPercent" aria-valuemin="0" aria-valuemax="100">
        <i :style="{ width: quotaPercent + '%' }" :class="{ 'is-warn': quotaPercent >= 90 }" />
      </div>
      <div class="quota-text">{{ formatSize(used) }} / {{ total > 0 ? formatSize(total) : '—' }}</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RequestOption } from '@arco-design/web-vue'
import {
  IconUpload,
  IconShareAlt,
  IconApps,
  IconVideoCamera,
  IconImage,
  IconFile,
  IconMore,
} from '@arco-design/web-vue/es/icon'
import type { QuotaInfo } from '@/modules/cloud/types'
import { formatSize } from '@/modules/cloud/utils/format'

export type CloudCategory = 'all' | 'video' | 'image' | 'document' | 'other'

interface Props {
  active: CloudCategory
  counts: Partial<Record<CloudCategory, number>>
  quota?: QuotaInfo | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'change', category: CloudCategory): void
  (e: 'upload', files: File[]): void
  (e: 'open-shares'): void
}>()

const { t } = useI18n()

const categories = computed(() => [
  { key: 'all' as const, label: t('cloud.catAll'), icon: IconApps },
  { key: 'video' as const, label: t('cloud.catVideo'), icon: IconVideoCamera },
  { key: 'image' as const, label: t('cloud.catImage'), icon: IconImage },
  { key: 'document' as const, label: t('cloud.catDocument'), icon: IconFile },
  { key: 'other' as const, label: t('cloud.catOther'), icon: IconMore },
])

// 公司存储空间（同公司用户共享，未配置时默认 100GB）；旧接口没有 company 时退回个人配额
const used = computed(() => Number(props.quota?.company?.usedSpace ?? props.quota?.usedSpace ?? 0) || 0)
const total = computed(() => Number(props.quota?.company?.totalQuota ?? props.quota?.totalQuota ?? 0) || 0)
const quotaPercent = computed(() => (total.value > 0 ? Math.min(100, Math.round((used.value / total.value) * 100)) : 0))

function handleUpload(option: RequestOption) {
  if (option.fileItem.file) emit('upload', [option.fileItem.file])
  return Promise.resolve()
}
</script>

<style scoped>
.cloud-sidebar {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.cloud-sidebar__upload,
.cloud-sidebar__upload :deep(.arco-upload) {
  display: block;
  width: 100%;
}

.cloud-sidebar__upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 38px;
  margin-bottom: 10px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--brand-blue);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: filter var(--duration-fast) var(--ease-out);
}

.cloud-sidebar__upload-btn:hover {
  filter: brightness(1.08);
}

.cloud-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cloud-sidebar__item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.cloud-sidebar__item:hover {
  background: var(--bg-hover);
}

.cloud-sidebar__item.is-active {
  background: var(--info-bg);
  color: var(--brand-blue);
  font-weight: 600;
}

.cloud-sidebar__icon {
  flex: 0 0 auto;
  font-size: 15px;
}

.cloud-sidebar__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-sidebar__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.cloud-sidebar__item.is-active .cloud-sidebar__count {
  color: var(--brand-blue);
}

.cloud-sidebar__divider {
  height: 1px;
  margin: 8px 4px;
  background: var(--border);
}

.cloud-sidebar__quota {
  margin-top: auto;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--bg-hover);
}

.quota-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.quota-bar {
  height: 6px;
  margin: 8px 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--border);
}

.quota-bar > i {
  display: block;
  height: 100%;
  background: var(--brand-blue);
  border-radius: 999px;
}

.quota-bar > i.is-warn {
  background: var(--error);
}

.quota-text {
  font-size: 12px;
  color: var(--text-primary);
}
</style>
