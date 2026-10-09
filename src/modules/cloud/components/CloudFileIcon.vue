<template>
  <!-- 文件夹 -->
  <svg
    v-if="folder"
    class="cloud-file-icon"
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    role="img"
    :aria-label="label"
  >
    <path d="M5 13a3 3 0 013-3h10.2l4 4H40a3 3 0 013 3v20a3 3 0 01-3 3H8a3 3 0 01-3-3z" fill="#f2b23a" />
    <path d="M5 19h38v18a3 3 0 01-3 3H8a3 3 0 01-3-3z" fill="#f8c95c" />
  </svg>

  <!-- 文件：带折角的纸张，类型色 + 白色类型符号 -->
  <svg
    v-else
    class="cloud-file-icon"
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    role="img"
    :aria-label="label"
  >
    <path d="M11 4h18l11 11v26a3 3 0 01-3 3H11a3 3 0 01-3-3V7a3 3 0 013-3z" :fill="color" />
    <path d="M29 4l11 11h-8a3 3 0 01-3-3z" fill="#ffffff" fill-opacity="0.45" />
    <g fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <!-- 视频：播放 -->
      <path v-if="kind === 'video'" d="M20 22.5v11l9-5.5z" fill="#ffffff" stroke-width="1.6" />
      <!-- 图片：山与太阳 -->
      <template v-else-if="kind === 'image'">
        <circle cx="19.5" cy="23" r="2.2" fill="#ffffff" stroke="none" />
        <path d="M14 35l6.5-7 4.5 4.5 3-3L34 35z" fill="#ffffff" stroke-width="1.4" />
      </template>
      <!-- 音频：音符 -->
      <template v-else-if="kind === 'audio'">
        <path d="M22 33V21.5l9-2v11" />
        <circle cx="19.5" cy="33" r="2.5" fill="#ffffff" stroke="none" />
        <circle cx="28.5" cy="30.5" r="2.5" fill="#ffffff" stroke="none" />
      </template>
      <!-- 压缩包：拉链 -->
      <template v-else-if="kind === 'archive'">
        <path d="M24 9v3M22 13.5h2M24 16v2M22 19.5h2M24 22v2" stroke-width="2" />
        <rect x="20.5" y="26" width="7" height="8" rx="1.5" />
      </template>
      <!-- 代码 -->
      <path v-else-if="kind === 'code'" d="M19.5 23.5L15 28l4.5 4.5M28.5 23.5L33 28l-4.5 4.5M25.5 21.5l-3 13" />
      <!-- 文本 -->
      <path v-else-if="kind === 'text' || kind === 'other'" d="M15 22h18M15 28h18M15 34h11" />
      <!-- 可执行：齿轮 -->
      <template v-else-if="kind === 'exe'">
        <circle cx="24" cy="28" r="3.2" />
        <path d="M24 20.5v2.3M24 33.2v2.3M16.5 28h2.3M29.2 28h2.3M18.7 22.7l1.6 1.6M27.7 31.7l1.6 1.6M18.7 33.3l1.6-1.6M27.7 24.3l1.6-1.6" />
      </template>
    </g>
    <!-- 文档类：字母标识 -->
    <text
      v-if="letters"
      x="24"
      y="32.5"
      text-anchor="middle"
      fill="#ffffff"
      :font-size="letters.length > 1 ? 9.5 : 13"
      font-weight="700"
      font-family="Arial, 'Helvetica Neue', sans-serif"
    >{{ letters }}</text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { fileKindOf, FILE_KIND_COLORS, type FileKind } from '@/modules/cloud/utils/file-kind'

interface Props {
  /** 文件名或扩展名 */
  name?: string
  /** MIME 类型（扩展名无法识别时使用） */
  mime?: string
  /** 是否文件夹 */
  folder?: boolean
  /** 图标尺寸（px） */
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  mime: '',
  folder: false,
  size: 24,
})

const kind = computed<FileKind>(() => fileKindOf(props.name, props.mime))
const color = computed(() => FILE_KIND_COLORS[kind.value].color)

const LETTERS: Partial<Record<FileKind, string>> = { pdf: 'PDF', word: 'W', excel: 'X', ppt: 'P' }
const letters = computed(() => LETTERS[kind.value] || '')

const LABELS: Record<FileKind, string> = {
  video: '视频',
  image: '图片',
  audio: '音频',
  pdf: 'PDF',
  word: 'Word 文档',
  excel: '表格',
  ppt: '演示文稿',
  archive: '压缩包',
  code: '代码',
  text: '文本',
  exe: '安装包',
  other: '文件',
}
const label = computed(() => (props.folder ? '文件夹' : LABELS[kind.value]))
</script>

<style scoped>
.cloud-file-icon {
  flex: 0 0 auto;
  display: block;
}
</style>
