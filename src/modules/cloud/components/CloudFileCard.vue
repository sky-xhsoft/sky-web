<template>
  <div
    class="cloud-file-card"
    :class="{
      'is-selected': selected,
      'is-folder': item.type === 'folder',
    }"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 选择框 -->
    <div v-if="selectable" class="cloud-file-card__checkbox" @click.stop>
      <a-checkbox :model-value="selected" @change="handleSelect" />
    </div>

    <!-- 类型图块：文件夹图标 / 文件扩展名 -->
    <div class="cloud-file-card__tile" :style="{ color: item.color, background: item.bg }">
      <svg v-if="item.type === 'folder'" class="folder-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6.5A1.5 1.5 0 014.5 5h4.6l2 2h8.4A1.5 1.5 0 0121 8.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5z" fill="#f4b740" />
        <path d="M3 9h18v8.5a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5z" fill="#f8c95c" />
      </svg>
      <span v-else class="ext-text">{{ extLabel }}</span>
    </div>

    <!-- 信息 -->
    <div class="cloud-file-card__info">
      <div class="cloud-file-card__name" :title="item.name">
        {{ item.name }}
      </div>
      <div class="cloud-file-card__meta">
        {{ item.meta }}
      </div>
    </div>

    <!-- 操作菜单 -->
    <div v-if="showActions" class="cloud-file-card__actions" @click.stop>
      <a-dropdown trigger="click" @select="handleAction">
        <V2Button size="sm" type="text">
          <icon-more />
        </V2Button>
        <template #content>
          <a-doption value="preview" v-if="item.type === 'file'">
            <icon-eye />
            {{ t('cloud.preview') }}
          </a-doption>
          <a-doption value="download" v-if="item.type === 'file'">
            <icon-download />
            {{ t('cloud.download') }}
          </a-doption>
          <a-doption value="rename">
            <icon-edit />
            {{ t('cloud.rename') }}
          </a-doption>
          <a-doption value="move">
            <icon-export />
            {{ t('cloud.move') }}
          </a-doption>
          <a-doption value="share">
            <icon-share-alt />
            {{ t('cloud.share') }}
          </a-doption>
          <a-doption value="permission">
            <icon-safe />
            {{ t('cloud.permission') }}
          </a-doption>
          <a-doption value="delete" class="danger-option">
            <icon-delete />
            {{ t('cloud.deleteItem') }}
          </a-doption>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconMore,
  IconEye,
  IconDownload,
  IconEdit,
  IconExport,
  IconShareAlt,
  IconSafe,
  IconDelete,
} from '@arco-design/web-vue/es/icon'
import { computed } from 'vue'
import type { GridItem } from '@/modules/cloud/types'
import { useI18n } from 'vue-i18n'
import { V2Button } from '@/components/ui'

const { t } = useI18n()

interface Props {
  item: GridItem
  selected?: boolean
  selectable?: boolean
  showActions?: boolean
}

interface Emits {
  (e: 'click', item: GridItem): void
  (e: 'dblclick', item: GridItem): void
  (e: 'select', item: GridItem, selected: boolean): void
  (e: 'action', action: string, item: GridItem): void
  (e: 'contextmenu', event: MouseEvent, item: GridItem): void
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectable: false,
  showActions: true,
})

const emit = defineEmits<Emits>()

/** 扩展名大写显示，无扩展名时显示 FILE */
const extLabel = computed(() => {
  const ext = (props.item.file?.FileExt || props.item.name.split('.').pop() || '').replace(/^\./, '')
  return ext && ext.length <= 5 && ext !== props.item.name ? ext.toUpperCase() : 'FILE'
})

function handleClick() {
  emit('click', props.item)
}

function handleDoubleClick() {
  emit('dblclick', props.item)
}

function handleSelect(value: boolean | (string | number | boolean)[]) {
  emit('select', props.item, value as boolean)
}

function handleAction(value: string | number | Record<string, any> | undefined) {
  if (typeof value === 'string') {
    emit('action', value, props.item)
  }
}

function handleContextMenu(event: MouseEvent) {
  emit('contextmenu', event, props.item)
}
</script>

<style scoped>
.cloud-file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  user-select: none;
  transition: box-shadow var(--duration-base) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.cloud-file-card:hover {
  border-color: var(--brand-blue-light, #b9cdf5);
  box-shadow: var(--shadow-md, 0 4px 14px rgba(16, 24, 40, 0.08));
}

.cloud-file-card.is-selected {
  background: var(--info-bg);
  border-color: var(--brand-blue);
}

.cloud-file-card__checkbox {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.cloud-file-card:hover .cloud-file-card__checkbox,
.cloud-file-card.is-selected .cloud-file-card__checkbox {
  opacity: 1;
}

.cloud-file-card__tile {
  display: grid;
  place-items: center;
  height: 92px;
  border-radius: var(--radius-md);
}

.cloud-file-card.is-folder .cloud-file-card__tile {
  background: #fff7e3 !important;
}

.folder-svg {
  width: 54px;
  height: 54px;
}

.ext-text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.cloud-file-card__info {
  min-width: 0;
}

.cloud-file-card__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-file-card__meta {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-file-card__actions {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  transition: opacity var(--duration-fast) var(--ease-out);
}

.cloud-file-card:hover .cloud-file-card__actions {
  opacity: 1;
}

.danger-option {
  color: var(--error);
}
</style>