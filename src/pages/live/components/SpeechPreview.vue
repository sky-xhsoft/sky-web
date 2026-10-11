<template>
  <div class="spv">
    <template v-if="controls">
      <div class="spv-bar">
        <a-select v-model="form.previewSize" class="spv-size" aria-label="源流尺寸">
          <template #prefix><icon-desktop /></template>
          <a-option v-for="s in SIZES" :key="s.value" :value="s.value">{{ s.label }}</a-option>
        </a-select>
        <a-button @click="bgInput?.click()"><template #icon><icon-upload /></template>上传背景图</a-button>
        <a-button v-if="form.bgImage" type="text" @click="form.bgImage = ''">移除</a-button>
        <input ref="bgInput" type="file" accept="image/*" class="spv-hidden" aria-label="上传背景图" @change="onBgUpload" />
      </div>
    </template>
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
      <div class="spv-tip">按源流尺寸等比缩放；超出显示范围时，内容将会被截断</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { IconDesktop, IconUpload } from '@arco-design/web-vue/es/icon'
import { SIZES, SPEECH_FORM_KEY, textStroke, type SpeechStyle } from './speechTask'

const props = withDefaults(defineProps<{ width?: number; controls?: boolean }>(), { width: 300, controls: false })
const form = inject(SPEECH_FORM_KEY)!

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

const src = computed(() => {
  const [w, h] = form.previewSize.split('x').map(Number)
  return { w: w || 1920, h: h || 1080 }
})
const sizeLabel = computed(() => `${src.value.w} × ${src.value.h}`)
const scale = computed(() => props.width / src.value.w)
const stageStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${Math.round((props.width * src.value.h) / src.value.w)}px`,
  backgroundImage: form.bgImage ? `url(${form.bgImage})` : 'linear-gradient(180deg, #2a3a55 0%, #121c30 100%)',
}))
const subsStyle = computed(() => ({ left: `${form.marginLr}%`, right: `${form.marginLr}%`, bottom: `${form.marginTb}%` }))

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
    maxWidth: `${st.maxChar * px * 0.6}px`,
    WebkitLineClamp: form.rows || 'none',
  }
}

const showBoth = computed(() => form.mode !== 'asr' && form.subtitleFormat === 'both')
const lines = computed(() => {
  const main = { key: 'main', text: form.testMain || (form.mode === 'asr' ? '这是一条默认字幕' : 'This is a default subtitle'), style: lineStyle(form.transStyle) }
  if (!showBoth.value) return [main]
  const original = { key: 'orig', text: form.testOriginal || '这是一条默认字幕', style: lineStyle(form.shareStyle ? form.transStyle : form.origStyle) }
  return form.order === 'originalTop' ? [original, main] : [main, original]
})
</script>

<style scoped>
.spv { display: flex; flex-direction: column; gap: 10px; }
.spv-bar { display: flex; gap: 8px; flex-wrap: wrap; }
.spv-size { flex: 1; min-width: 180px; }
.spv-hidden { display: none; }
.spv-stage { position: relative; max-width: 100%; border-radius: 8px; overflow: hidden; background-size: cover; background-position: center; flex-shrink: 0; }
.spv-size-tag { position: absolute; top: 6px; left: 6px; font-size: 11px; color: #fff; background: rgba(255, 255, 255, 0.16); border-radius: 10px; padding: 1px 8px; }
.spv-subs { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.spv-line { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; text-align: center; border-radius: 2px; word-break: break-all; }
.spv-off { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.6); font-size: 12px; }
.spv-test { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--color-text-2); }
.spv-count { font-size: 12px; color: var(--color-text-3); }
.spv-tip { font-size: 12px; color: var(--color-text-3); }
</style>
