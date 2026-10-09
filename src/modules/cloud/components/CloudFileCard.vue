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

    <!-- 图块：图片显示缩略图，视频显示第一帧，其他按类型显示图标 -->
    <div class="cloud-file-card__tile" :style="{ background: tileBg }">
      <CloudFileThumb
        :file-id="item.type === 'file' ? item.id : 0"
        :folder="item.type === 'folder'"
        :name="item.name"
        :ext="item.file?.FileExt"
        :mime="item.file?.FileType"
        :icon-size="52"
      />
      <span v-if="extLabel" class="ext-badge">{{ extLabel }}</span>
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
import CloudFileThumb from './CloudFileThumb.vue'
import { extOf, fileKindOf, FILE_KIND_COLORS } from '@/modules/cloud/utils/file-kind'
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

/** 图块背景：文件夹浅黄，文件按类型浅色 */
const tileBg = computed(() => {
  if (props.item.type === 'folder') return '#fff7e3'
  return FILE_KIND_COLORS[fileKindOf(props.item.file?.FileExt || props.item.name, props.item.file?.FileType)].bg
})

/** 右下角扩展名角标（文件夹不显示） */
const extLabel = computed(() => {
  if (props.item.type === 'folder') return ''
  const ext = extOf(props.item.file?.FileExt || (props.item.name.includes('.') ? props.item.name : ''))
  return ext && ext.length <= 5 ? ext.toUpperCase() : ''
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
  position: relative;
  height: 92px;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.ext-badge {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 0 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.85);
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
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