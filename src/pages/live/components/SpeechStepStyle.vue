<template>
  <div>
    <section class="ss-card" aria-label="字幕布局">
      <div class="ss-card-title">
        字幕布局
        <span class="ss-colors">添加字幕 <a-switch v-model="form.subtitleOn" aria-label="添加字幕" /></span>
      </div>
      <template v-if="form.subtitleOn">
        <div v-if="form.mode === 'asr'" class="ss-row">
          <span class="ss-row-label">出字方式</span>
          <a-radio-group v-model="form.outWordMode" type="button" class="ss-seg" @change="onOutWordChange">
            <a-radio value="sentence">整句</a-radio>
            <a-radio value="stream">实时流式</a-radio>
          </a-radio-group>
        </div>
        <div class="ss-row">
          <span class="ss-row-label">字幕格式</span>
          <a-radio-group v-if="form.mode !== 'asr'" v-model="form.subtitleFormat" type="button" class="ss-seg">
            <a-radio value="both">原文+译文</a-radio>
            <a-radio value="translation">译文</a-radio>
          </a-radio-group>
          <span v-else class="ss-tip">原文</span>
        </div>
        <div class="ss-row">
          <span class="ss-row-label">字幕行数</span>
          <a-radio-group v-model="form.rows" type="button" class="ss-seg">
            <a-radio :value="1">1 行</a-radio>
            <a-radio :value="2">2 行</a-radio>
            <a-radio :value="0">自适应</a-radio>
          </a-radio-group>
        </div>
        <div v-if="showBoth" class="ss-row">
          <span class="ss-row-label">字幕排序</span>
          <a-radio-group v-model="form.order" type="button" class="ss-seg">
            <a-radio value="originalTop">原文在上</a-radio>
            <a-radio value="originalBottom">原文在下</a-radio>
          </a-radio-group>
        </div>
        <div class="ss-row">
          <span class="ss-row-label">左右边距</span>
          <div class="ss-slider">
            <a-slider v-model="form.marginLr" :min="1" :max="30" />
            <a-input-number v-model="form.marginLr" :min="1" :max="30" :precision="0" class="ss-num" aria-label="左右边距"><template #suffix>%</template></a-input-number>
          </div>
        </div>
        <div class="ss-row">
          <span class="ss-row-label">底部边距</span>
          <div class="ss-slider">
            <a-slider v-model="form.marginTb" :min="1" :max="50" />
            <a-input-number v-model="form.marginTb" :min="1" :max="50" :precision="0" class="ss-num" aria-label="底部边距"><template #suffix>%</template></a-input-number>
          </div>
        </div>
      </template>
      <div v-else class="ss-tip">关闭后不在转推画面中显示字幕（仍可输出同传声音）</div>
    </section>

    <section v-if="form.subtitleOn" class="ss-card" aria-label="文字样式">
      <div class="ss-card-title">
        文字样式
        <a-checkbox v-if="showBoth" v-model="form.shareStyle">原文与译文样式共享</a-checkbox>
      </div>
      <div v-if="tabs.length > 1" class="ss-tabs" role="tablist">
        <button v-for="t in tabs" :key="t.key" type="button" role="tab" :aria-selected="activeTab === t.key" class="ss-tab" :class="{ 'is-active': activeTab === t.key }" @click="activeTab = t.key">{{ t.title }}</button>
      </div>
      <div v-else class="ss-tip" style="margin-bottom: 8px">{{ tabs[0].title }}</div>
      <div class="ss-row">
        <span class="ss-row-label">预设</span>
        <div class="ss-presets">
          <button
            v-for="(p, i) in PRESETS"
            :key="i"
            type="button"
            class="ss-preset"
            :class="{ 'is-active': style.preset === i }"
            :aria-label="p.label"
            :title="p.label"
            :style="{ color: p.font, textShadow: textStroke(p.border, 1) }"
            @click="applyPreset(style, i)"
          >T</button>
        </div>
      </div>
      <div class="ss-row">
        <span class="ss-row-label">字号</span>
        <div class="ss-slider">
          <a-slider v-model="style.fontSize" :min="1" :max="100" />
          <a-input-number v-model="style.fontSize" :min="1" :max="100" :precision="0" class="ss-num" aria-label="字号" />
        </div>
      </div>
      <div class="ss-row">
        <span class="ss-row-label">每行字数</span>
        <div class="ss-slider">
          <a-slider v-model="style.maxChar" :min="1" :max="200" />
          <a-input-number v-model="style.maxChar" :min="1" :max="200" :precision="0" class="ss-num" aria-label="每行字数" />
        </div>
      </div>
      <div class="ss-row">
        <span class="ss-row-label">字体</span>
        <a-select v-model="style.font" :style="{ width: '160px' }" aria-label="字体">
          <a-option value="arial">Arial</a-option>
        </a-select>
      </div>
      <div class="ss-row">
        <span class="ss-row-label">颜色</span>
        <div class="ss-colors">
          <label class="ss-colors">文字 <input v-model="style.fontColor" type="color" class="ss-color" aria-label="文字颜色" @input="style.preset = -1" /></label>
          <label class="ss-colors">描边 <input v-model="style.borderColor" type="color" class="ss-color" aria-label="描边颜色" @input="style.preset = -1" /></label>
          <label class="ss-colors">底色 <input v-model="style.boxColor" type="color" class="ss-color" aria-label="底色" /></label>
          <span>透明度</span>
          <a-input-number v-model="style.opacity" :min="0" :max="100" :precision="0" size="small" class="ss-small-num" aria-label="底色透明度"><template #suffix>%</template></a-input-number>
          <span>边距</span>
          <a-input-number v-model="style.boxW" :min="0" :max="20" :precision="0" size="small" class="ss-small-num" aria-label="底色边距" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { PRESETS, SPEECH_FORM_KEY, applyPreset, delayRangeOf, suggestedDelay, textStroke } from './speechTask'

const form = inject(SPEECH_FORM_KEY)!

const showBoth = computed(() => form.mode !== 'asr' && form.subtitleFormat === 'both')
const tabs = computed(() => {
  if (form.mode === 'asr') return [{ key: 'trans', title: '原文字幕样式' }]
  if (!showBoth.value) return [{ key: 'trans', title: '译文字幕样式' }]
  if (form.shareStyle) return [{ key: 'trans', title: '原文 + 译文字幕样式' }]
  return [{ key: 'orig', title: '原文样式' }, { key: 'trans', title: '译文样式' }]
})
const activeTab = ref('trans')
watch(tabs, (t) => {
  if (!t.some((x) => x.key === activeTab.value)) activeTab.value = t[t.length - 1].key
})
const style = computed(() => (activeTab.value === 'orig' && tabs.value.length > 1 ? form.origStyle : form.transStyle))

// 原文 ASR 切换出字方式时，播出延迟按建议值更新（实时流式固定为 0）
const onOutWordChange = () => {
  if (delayRangeOf(form).fixed || !form.delayTouched) form.delay = suggestedDelay(form)
}
</script>

<style scoped src="./speechStep.css"></style>
