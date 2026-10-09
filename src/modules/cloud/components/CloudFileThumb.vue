<template>
  <!-- 图片 / 视频：进入可视区域后加载缩略图，加载前或无缩略图时显示类型图标 -->
  <div ref="rootRef" class="cloud-file-thumb" :class="{ 'is-loaded': !!src }">
    <img v-if="src" :src="src" :alt="name" class="cloud-file-thumb__img" draggable="false" @error="src = null" />
    <CloudFileIcon v-else :folder="folder" :name="ext || name" :mime="mime" :size="iconSize" />
    <span v-if="src && isVideo && !compact" class="cloud-file-thumb__play" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="12" height="12"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CloudFileIcon from './CloudFileIcon.vue'
import { fileKindOf } from '@/modules/cloud/utils/file-kind'
import { hasThumbnail, loadThumbnail } from '@/modules/cloud/utils/thumbnail'

interface Props {
  /** 文件 ID（文件夹不加载缩略图） */
  fileId?: number
  name?: string
  ext?: string
  mime?: string
  folder?: boolean
  /** 无缩略图时类型图标的尺寸 */
  iconSize?: number
  /** 紧凑模式（列表小图）：不显示视频播放标记 */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fileId: 0,
  name: '',
  ext: '',
  mime: '',
  folder: false,
  iconSize: 24,
  compact: false,
})

const rootRef = ref<HTMLElement>()
const src = ref<string | null>(null)
const isVideo = computed(() => fileKindOf(props.ext || props.name, props.mime) === 'video')
const wanted = computed(() => !props.folder && props.fileId > 0 && hasThumbnail(props.ext || props.name, props.mime))

let observer: IntersectionObserver | undefined

async function load() {
  const id = props.fileId
  const url = await loadThumbnail(id)
  if (id === props.fileId) src.value = url
}

function observe() {
  observer?.disconnect()
  src.value = null
  if (!wanted.value || !rootRef.value) return
  if (typeof IntersectionObserver === 'undefined') {
    void load()
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer?.disconnect()
        void load()
      }
    },
    { rootMargin: '200px' },
  )
  observer.observe(rootRef.value)
}

onMounted(observe)
watch(() => props.fileId, observe)
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.cloud-file-thumb {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.cloud-file-thumb__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cloud-file-thumb__play {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.55);
  color: #fff;
}
</style>
