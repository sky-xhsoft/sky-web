<template>
  <div>
    <section class="ss-card" aria-label="从整篇文章提取词库">
      <div class="ss-card-title">
        <span>从整篇文章提取词库 <span class="ss-card-sub">贴入演讲稿{{ asr ? '原文' : '原文与对应译文' }}，由服务端智能切词对齐</span></span>
        <a-button type="primary" :loading="extracting" :disabled="!canExtract" @click="extract">
          <template #icon><icon-robot /></template>
          {{ result ? '重新提取' : '智能提取' }}
        </a-button>
      </div>
      <div class="ss-grid" :style="asr ? { gridTemplateColumns: 'minmax(0, 1fr)' } : undefined">
        <label class="ss-field">
          <span class="ss-label">原文全文（{{ langLabel(form.inputLang) }}）</span>
          <a-textarea v-model="sourceText" :max-length="MAX_GLOSSARY" show-word-limit :auto-size="{ minRows: 5, maxRows: 9 }" placeholder="粘贴演讲稿、发布会稿件等原文" />
        </label>
        <label v-if="!asr" class="ss-field">
          <span class="ss-label">译文全文（{{ langLabel(form.outputLang) }}）</span>
          <a-textarea v-model="targetText" :max-length="MAX_GLOSSARY" show-word-limit :auto-size="{ minRows: 5, maxRows: 9 }" placeholder="粘贴与原文对应的译文" />
        </label>
      </div>
      <div class="ss-tip" style="margin-top: 6px">文章只用于本次提取，不会保存；长文会自动分段处理，约需 10-60 秒。</div>
    </section>

    <section v-if="result" class="ss-card" aria-label="提取结果">
      <div class="ss-card-title">
        <span>提取结果 <span class="ss-card-sub">用时 {{ Math.round(result.elapsedMs / 1000) }} 秒{{ result.chunks > 1 ? ` · 分 ${result.chunks} 段` : '' }}{{ result.failed ? ` · ${result.failed} 段失败` : '' }} · 可编辑后勾选加入</span></span>
      </div>
      <div class="sg-results">
        <div>
          <div class="sg-head">
            <b>{{ asr ? '热词' : '关键词' }} <span class="ss-card-sub">{{ asr ? '原文专有名词' : '原文 → 译文' }} · {{ keywords.length }} 条</span></b>
            <a-button type="primary" size="small" :disabled="!checkedKeywords" @click="addKeywords">{{ asr ? '加入热词库' : '加入关键词库' }}（{{ checkedKeywords }}）</a-button>
          </div>
          <div v-if="!keywords.length" class="ss-tip">未提取到{{ asr ? '热词' : '关键词' }}</div>
          <div v-else class="sg-scroll">
            <table class="ss-table">
              <thead>
                <tr>
                  <th style="width: 28px"><a-checkbox :model-value="allKeywords" aria-label="全选" @change="(v: any) => keywords.forEach((k) => (k.checked = !!v))" /></th>
                  <th>原文</th>
                  <th v-if="!asr">译文</th>
                  <th style="width: 64px">类型</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(k, i) in keywords" :key="i">
                  <td><a-checkbox v-model="k.checked" :aria-label="`选择 ${k.source}`" /></td>
                  <td><a-input v-model="k.source" size="small" :max-length="50" aria-label="原文" /></td>
                  <td v-if="!asr"><a-input v-model="k.target" size="small" :max-length="50" aria-label="译文" /></td>
                  <td><span class="ss-tag" :class="{ 'ss-tag-brand': k.type === '品牌' || k.type === '产品' }" :title="`原文中出现 ${k.count} 次`">{{ k.type }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div class="sg-head">
            <b>易错词 <span class="ss-card-sub">易错写法 → 纠正 · {{ typos.length }} 条</span></b>
            <a-button size="small" :disabled="!checkedTypos" @click="addTypos">加入易错词（{{ checkedTypos }}）</a-button>
          </div>
          <div v-if="!typos.length" class="ss-tip">未提取到易错词</div>
          <div v-else class="sg-scroll">
            <table class="ss-table">
              <thead>
                <tr>
                  <th style="width: 28px"><a-checkbox :model-value="allTypos" aria-label="全选" @change="(v: any) => typos.forEach((t) => (t.checked = !!v))" /></th>
                  <th>易错</th>
                  <th>纠正</th>
                  <th style="width: 52px">原因</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(t, i) in typos" :key="i">
                  <td><a-checkbox v-model="t.checked" :aria-label="`选择 ${t.wrong}`" /></td>
                  <td><a-input v-model="t.wrong" size="small" :max-length="50" aria-label="易错写法" /></td>
                  <td><a-input v-model="t.correct" size="small" :max-length="50" aria-label="纠正" /></td>
                  <td><span class="ss-tag ss-tag-typo">{{ t.reason }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRobot } from '@arco-design/web-vue/es/icon'
import { extractSpeechGlossary, type GlossaryExtractResult } from '@/api/live'
import { MAX_GLOSSARY, MAX_REPLACE, SPEECH_FORM_KEY, langLabel, mergePairs } from './speechTask'

const form = inject(SPEECH_FORM_KEY)!
const asr = computed(() => form.mode === 'asr')

const sourceText = ref('')
const targetText = ref('')
const extracting = ref(false)
const result = ref<GlossaryExtractResult | null>(null)
const keywords = ref<{ checked: boolean; source: string; target: string; type: string; count: number }[]>([])
const typos = ref<{ checked: boolean; wrong: string; correct: string; reason: string }[]>([])

const canExtract = computed(() => !!sourceText.value.trim() && (asr.value || !!targetText.value.trim()))

const extract = async () => {
  extracting.value = true
  try {
    const res = await extractSpeechGlossary({
      sourceText: sourceText.value,
      targetText: asr.value ? '' : targetText.value,
      sourceLang: form.inputLang,
      targetLang: form.outputLang,
      typoSide: asr.value ? 'source' : 'target',
    })
    result.value = res
    // 通用词默认不勾选，其余默认勾选
    keywords.value = res.keywords.map((k) => ({ ...k, checked: k.type !== '通用词' }))
    typos.value = res.typos.map((t) => ({ ...t, checked: true }))
    if (res.failed) Message.warning(`有 ${res.failed} 段提取失败，结果可能不完整`)
    else Message.success(`提取到 ${res.keywords.length} 个${asr.value ? '热词' : '关键词'}、${res.typos.length} 个易错词`)
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '提取失败')
  } finally {
    extracting.value = false
  }
}

const checkedKeywords = computed(() => keywords.value.filter((k) => k.checked).length)
const checkedTypos = computed(() => typos.value.filter((t) => t.checked).length)
const allKeywords = computed(() => !!keywords.value.length && keywords.value.every((k) => k.checked))
const allTypos = computed(() => !!typos.value.length && typos.value.every((t) => t.checked))

const addKeywords = () => {
  const picked = keywords.value.filter((k) => k.checked)
  let added = 0
  if (asr.value) {
    const seen = new Set(form.hotWords.map((w) => w.toLowerCase()))
    for (const k of picked) {
      const w = k.source.trim()
      if (w && !seen.has(w.toLowerCase())) {
        form.hotWords.push(w)
        seen.add(w.toLowerCase())
        added++
      }
    }
  } else {
    added = mergePairs(form.glossaryPairs, picked.map((k) => ({ from: k.source, to: k.target })))
  }
  keywords.value = keywords.value.filter((k) => !k.checked)
  Message.success(`已加入 ${added} 条${picked.length > added ? `，${picked.length - added} 条已存在` : ''}`)
}

const addTypos = () => {
  const picked = typos.value.filter((t) => t.checked)
  const added = mergePairs(form.replacePairs, picked.map((t) => ({ from: t.wrong, to: t.correct })), MAX_REPLACE)
  typos.value = typos.value.filter((t) => !t.checked)
  Message.success(`已加入 ${added} 条${picked.length > added ? `，${picked.length - added} 条已存在或超出上限` : ''}`)
}
</script>

<style scoped src="./speechStep.css"></style>
<style scoped>
.sg-results { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 16px; }
.sg-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.sg-scroll { max-height: 320px; overflow: auto; border: 1px solid var(--color-border-1); border-radius: 6px; }
@media (max-width: 900px) {
  .sg-results { grid-template-columns: minmax(0, 1fr); }
}
</style>
