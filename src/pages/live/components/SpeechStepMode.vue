<template>
  <section class="ss-card" aria-label="同传模式与声音">
    <div class="ss-card-title">同传模式与声音</div>
    <div class="ss-modes" role="radiogroup" aria-label="选择模式">
      <button
        v-for="m in MODES"
        :key="m.value"
        type="button"
        role="radio"
        :aria-checked="form.mode === m.value"
        class="ss-mode"
        :class="{ 'is-active': form.mode === m.value }"
        @click="setMode(m.value)"
      >
        <span class="ss-mode-title">{{ m.title }}</span>
        <span class="ss-mode-desc">{{ m.desc }}</span>
      </button>
    </div>

    <div class="ss-grid">
      <div class="ss-field">
        <label class="ss-label ss-req" for="ss-delay">播出延迟</label>
        <a-input-number id="ss-delay" v-model="form.delay" :min="range.min" :max="range.max" :disabled="range.fixed" :precision="0" @change="form.delayTouched = true">
          <template #suffix>s</template>
        </a-input-number>
        <div v-if="form.mode === 'si'" class="ss-tip">支持 1-60s · 建议：口型、声音、字幕 20s / 声音、字幕 12s</div>
        <div v-else-if="form.mode === 'asr' && form.outWordMode === 'sentence'" class="ss-tip">支持 0-20s，建议 10s</div>
        <div v-else class="ss-tip">支持 0-60s，建议 2-3s · 字幕早于原声或画面时可适当调低，反之调高</div>
      </div>
      <div class="ss-field">
        <span class="ss-label ss-req">{{ form.mode === 'asr' ? '原文语言' : '翻译语言' }}</span>
        <div class="ss-langs">
          <a-select v-model="form.inputLang" class="ss-lang" aria-label="输入语言" @change="onInputLangChange">
            <template #prefix>输入</template>
            <a-option v-for="o in INPUT_LANGS" :key="o.value" :value="o.value">{{ o.label }}</a-option>
          </a-select>
          <template v-if="form.mode !== 'asr'">
            <a-tooltip content="交换输入、输出语言">
              <a-button shape="circle" class="ss-swap" :disabled="!canSwap" aria-label="交换输入、输出语言" @click="swapLangs"><icon-swap /></a-button>
            </a-tooltip>
            <a-select v-model="form.outputLang" class="ss-lang" aria-label="输出语言">
              <template #prefix>输出</template>
              <a-option v-for="o in outputLangOptions" :key="o.value" :value="o.value">{{ o.label }}</a-option>
            </a-select>
          </template>
        </div>
      </div>
    </div>

    <div v-if="form.mode !== 'asr'" class="ss-sub-grid">
      <div v-if="form.mode === 'si'" class="ss-box">
        <div class="ss-box-head">
          <b>数字人口型</b>
          <a-switch v-model="form.lipSync" aria-label="数字人口型" @change="applySuggestedDelay" />
        </div>
        <div class="ss-tip">开启后播出延迟建议改为 20s</div>
      </div>
      <div class="ss-box" :class="{ 'ss-box-wide': form.mode === 'realtime' }">
        <div class="ss-box-head">
          <b>同传声音</b>
          <span v-if="form.mode === 'si'" class="ss-tip">默认开启，替换原声和背景音</span>
          <a-switch v-else v-model="form.voiceOn" aria-label="同传声音" @change="applySuggestedDelay" />
        </div>
        <template v-if="form.mode === 'si' || form.voiceOn">
          <div class="ss-row">
            <span class="ss-row-label">音色</span>
            <div class="ss-row-ctl">
              <a-radio-group v-model="form.voiceMode">
                <a-radio value="auto">自动复制</a-radio>
                <a-radio v-if="form.mode === 'si'" value="fixed">固定音色</a-radio>
              </a-radio-group>
              <a-select
                v-if="form.mode === 'si' && form.voiceMode === 'fixed'"
                v-model="form.fixedVoice"
                placeholder="选择或输入 SpeakerID"
                allow-search
                allow-create
                allow-clear
                :filter-option="filterVoice"
                class="ss-voice"
                aria-label="固定音色 SpeakerID"
              >
                <a-optgroup v-for="g in voiceGroups" :key="g.lang" :label="g.lang">
                  <a-option v-for="v in g.voices" :key="v.id" :value="v.id" :label="`${v.name}（${v.id}）`">{{ v.name }}<span class="ss-voice-id">{{ v.id }}</span></a-option>
                </a-optgroup>
              </a-select>
            </div>
          </div>
          <template v-if="form.mode === 'realtime'">
            <div class="ss-row">
              <span class="ss-row-label">原声配置</span>
              <a-radio-group v-model="form.originalMode">
                <a-radio value="mix">原声自动叠加翻译（不支持降噪）</a-radio>
                <a-radio value="translationOnly">仅保留翻译音频</a-radio>
              </a-radio-group>
            </div>
            <div class="ss-row">
              <span class="ss-row-label">{{ form.originalMode === 'mix' ? '原声音量' : '背景音' }}</span>
              <div class="ss-slider">
                <a-slider v-model="form.bgVolume" :min="0" :max="100" />
                <a-input-number v-model="form.bgVolume" :min="0" :max="100" :precision="0" class="ss-num" :aria-label="form.originalMode === 'mix' ? '原声音量' : '背景音'"><template #suffix>%</template></a-input-number>
              </div>
            </div>
          </template>
          <div v-if="form.mode === 'si'" class="ss-tip">声影同传会替换原声和背景音，需要保留请选「实时同传」</div>
          <div v-if="form.mode === 'si' || form.originalMode === 'translationOnly'" class="ss-row">
            <span class="ss-row-label">降噪</span>
            <div class="ss-row-ctl">
              <a-switch v-model="form.denoise" aria-label="降噪" />
              <span v-if="form.denoise" class="ss-tip">可能导致背景音消失</span>
            </div>
          </div>
          <div class="ss-row">
            <span class="ss-row-label">音量均衡</span>
            <a-switch v-model="form.audioEnhance" aria-label="音量均衡" />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { IconSwap } from '@arco-design/web-vue/es/icon'
import { INPUT_LANGS, MODES, OUTPUT_LANGS, SPEECH_FORM_KEY, delayRangeOf, suggestedDelay, type SpeechMode } from './speechTask'
import { minimaxVoiceGroups } from './minimaxVoices'

const form = inject(SPEECH_FORM_KEY)!

const range = computed(() => delayRangeOf(form))

// 固定音色：MiniMax 系统音色按语言分组，当前输出语言排最前；可输入列表外的 SpeakerID
const voiceGroups = computed(() => minimaxVoiceGroups(form.outputLang))
const filterVoice = (input: string, option: any) => {
  const q = input.trim().toLowerCase()
  return !q || String(option.value).toLowerCase().includes(q) || String(option.label || '').toLowerCase().includes(q)
}
const applySuggestedDelay = () => {
  if (range.value.fixed || !form.delayTouched) form.delay = suggestedDelay(form)
}
const setMode = (m: SpeechMode) => {
  if (form.mode === m) return
  form.mode = m
  form.delayTouched = false
  if (m !== 'si' && form.voiceMode === 'fixed') form.voiceMode = 'auto'
  if (m === 'si') form.voiceOn = true
  applySuggestedDelay()
}
defineExpose({ applySuggestedDelay })

const outputLangOptions = computed(() => OUTPUT_LANGS.filter((o) => o.value !== form.inputLang))
const onInputLangChange = () => {
  if (form.outputLang === form.inputLang) form.outputLang = outputLangOptions.value[0]?.value || ''
}
const canSwap = computed(() => INPUT_LANGS.some((o) => o.value === form.outputLang))
const swapLangs = () => {
  const i = form.inputLang
  form.inputLang = form.outputLang
  form.outputLang = i
}
</script>

<style scoped src="./speechStep.css"></style>
