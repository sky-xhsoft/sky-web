<template>
  <div class="spv">
    <div class="spv-bar">
      <div class="spv-size"><SpeechSizePicker v-model="form.previewSize" /></div>
      <template v-if="controls">
        <a-button @click="bgInput?.click()"><template #icon><icon-upload /></template>上传背景图</a-button>
        <a-button v-if="form.bgImage" type="text" @click="form.bgImage = ''">移除</a-button>
        <input ref="bgInput" type="file" accept="image/*" class="spv-hidden" aria-label="上传背景图" @change="onBgUpload" />
      </template>
      <a-tooltip v-if="zoomable" content="放大预览">
        <a-button aria-label="放大预览" @click="zoomOpen = true"><template #icon><icon-fullscreen /></template></a-button>
      </a-tooltip>
    </div>
    <div v-if="!controls" class="spv-tip">请选择源流尺寸，转码字幕会按源流尺寸等比缩放</div>
    <div class="spv-stage" :style="stageStyle">
      <span class="spv-size-tag">{{ sizeLabel }}</span>
      <div v-if="form.subtitleOn" class="spv-subs" :style="subsStyle">
        <div v-for="line in lines" :key="line.key" class="spv-line" :style="line.style">{{ line.text }}</div>
      </div>
      <div v-else class="spv-off">未添加字幕</div>
    </div>
    <template v-if="controls">
      <label v-if="showBoth" class="spv-test">原文测试内容
        <a-input v-model="form.testOriginal" :max-length="200" placeholder="请输入原文字幕测试内容" />
      </label>
      <label class="spv-test">{{ form.mode === 'asr' ? '原文测试内容' : '译文测试内容' }}
        <a-input v-model="form.testMain" :max-length="200" :placeholder="form.mode === 'asr' ? '请输入原文字幕测试内容' : '请输入译文字幕测试内容'">
          <template #suffix><span class="spv-count">{{ (form.testMain || '').length }}/{{ form.rows || '自适应' }}</span></template>
        </a-input>
      </label>
      <div class="spv-tip">请选择源流尺寸，转码字幕会按源流尺寸等比缩放；超出显示范围时，内容将会被截断</div>
    </template>

    <a-modal v-if="zoomable" v-model:visible="zoomOpen" title="预览效果" :footer="false" :width="Math.max(zoom.width, 420) + 48" unmount-on-close>
      <SpeechPreview :width="zoom.width" :max-height="zoom.maxHeight" :zoomable="false" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { IconFullscreen, IconUpload } from '@arco-design/web-vue/es/icon'
import { SPEECH_FORM_KEY, parseSize, textStroke, type SpeechStyle } from './speechTask'
import SpeechSizePicker from './SpeechSizePicker.vue'

// controls：显示背景图与测试内容；zoomable：可放大预览；maxHeight：画面最大高度（默认宽度的 0.9 倍）
const props = withDefaults(defineProps<{ width?: number; maxHeight?: number; controls?: boolean; zoomable?: boolean }>(), { width: 300, controls: false, zoomable: true })
const form = inject(SPEECH_FORM_KEY)!

const zoomOpen = ref(false)
// 放大预览：按窗口可用宽高等比放大，竖屏尺寸按高度收窄
const zoom = computed(() => {
  const maxHeight = Math.max(240, window.innerHeight - 240)
  const { w, h } = parseSize(form.previewSize)
  return { width: Math.round(Math.min(960, window.innerWidth - 96, (maxHeight * w) / h)), maxHeight }
})

const bgInput = ref<HTMLInputElement | null>(null)
const onBgUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.bgImage = String(reader.result || '')
    input.value = ''
  }
  reader.readAsDataURL(file)
}

const src = computed(() => parseSize(form.previewSize))
const sizeLabel = computed(() => `${src.value.w} × ${src.value.h}`)
// 高度不超过 maxHeight（竖屏尺寸按高度收窄并居中）
const stageW = computed(() => Math.min(props.width, Math.round(((props.maxHeight ?? props.width * 0.9) * src.value.w) / src.value.h)))
const scale = computed(() => stageW.value / src.value.w)
const stageStyle = computed(() => ({
  width: `${stageW.value}px`,
  height: `${Math.round((stageW.value * src.value.h) / src.value.w)}px`,
  backgroundImage: form.bgImage ? `url(${form.bgImage})` : 'linear-gradient(180deg, #2a3a55 0%, #121c30 100%)',
}))
const subsStyle = computed(() => ({ left: `${form.marginLr}%`, right: `${form.marginLr}%`, bottom: `${form.marginTb}%` }))
// 默认测试内容足够长，能看出字幕行数与左右边距的效果
const DEFAULT_ORIGINAL = '这是一条默认字幕，用来预览较长的句子在字幕区域内换行和行数限制的效果'
const DEFAULT_TRANSLATION = 'This is a default subtitle, used to preview how a longer sentence wraps inside the subtitle area'

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
const lineStyle = (st: SpeechStyle) => {
  const px = Math.max(7, st.fontSize * scale.value)
  return {
    color: st.fontColor,
    fontFamily: 'Arial, sans-serif',
    fontSize: `${px}px`,
    lineHeight: 1.3,
    textShadow: textStroke(st.borderColor, Math.max(0.6, scale.value * 2)),
    background: hexToRgba(st.boxColor, st.opacity / 100),
    padding: `${Math.max(1, Math.round(st.boxW * scale.value * 4))}px ${Math.max(2, Math.round(st.boxW * scale.value * 8))}px`,
    maxWidth: `min(100%, ${st.maxChar * px * 0.6}px)`,
    WebkitLineClamp: form.rows || 'none',
  }
}

const showBoth = computed(() => form.mode !== 'asr' && form.subtitleFormat === 'both')
const lines = computed(() => {
  const main = { key: 'main', text: form.testMain || (form.mode === 'asr' ? DEFAULT_ORIGINAL : DEFAULT_TRANSLATION), style: lineStyle(form.transStyle) }
  if (!showBoth.value) return [main]
  const original = { key: 'orig', text: form.testOriginal || DEFAULT_ORIGINAL, style: lineStyle(form.shareStyle ? form.transStyle : form.origStyle) }
  return form.order === 'originalTop' ? [original, main] : [main, original]
})
</script>

<style scoped>
.spv { display: flex; flex-direction: column; gap: 10px; }
.spv-bar { display: flex; gap: 8px; flex-wrap: wrap; }
.spv-size { flex: 1 1 180px; min-width: 0; }
.spv-hidden { display: none; }
.spv-stage { position: relative; max-width: 100%; border-radius: 8px; overflow: hidden; background-size: cover; background-position: center; flex-shrink: 0; align-self: center; }
.spv-size-tag { position: absolute; top: 6px; left: 6px; font-size: 11px; color: #fff; background: rgba(255, 255, 255, 0.16); border-radius: 10px; padding: 1px 8px; }
/* 虚线框为字幕区域，显示左右、底部边距 */
.spv-subs { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 3px; outline: 1px dashed rgba(255, 255, 255, 0.35); outline-offset: 2px; }
.spv-line { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; text-align: center; border-radius: 2px; word-break: break-all; }
.spv-off { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.6); font-size: 12px; }
.spv-test { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--color-text-2); }
.spv-count { font-size: 12px; color: var(--color-text-3); }
.spv-tip { font-size: 12px; color: var(--color-text-3); }
</style>
