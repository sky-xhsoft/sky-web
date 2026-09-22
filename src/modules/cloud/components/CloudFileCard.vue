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

    <!-- 图标 -->
    <div class="cloud-file-card__icon" :style="{ color: item.color, background: item.bg }">
      <span class="icon-emoji">{{ item.icon }}</span>
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
/* 对齐原型 cloud-card：白卡圆角 + hover 上浮 */
.cloud-file-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: box-shadow var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
  user-select: none;
}

.cloud-file-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border);
}

.cloud-file-card.is-selected {
  background: var(--info-bg);
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 3px var(--info-bg);
}

.cloud-file-card__checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}

.cloud-file-card__icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  font-size: 24px;
  line-height: 1;
  transition: transform var(--duration-base) var(--ease-out);
}

.cloud-file-card:hover .cloud-file-card__icon {
  transform: scale(1.06);
}

.icon-emoji {
  line-height: 1;
}

.cloud-file-card__info {
  min-width: 0;
  flex: 1;
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
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-file-card__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.cloud-file-card:hover .cloud-file-card__actions {
  opacity: 1;
}

.danger-option {
  color: var(--error);
}
</style>