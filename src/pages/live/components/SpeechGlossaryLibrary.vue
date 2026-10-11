<template>
  <div class="sgl">
    <!-- 关键词库 / 热词库 -->
    <div class="sgl-head">
      <b>{{ asr ? '热词库' : '关键词库' }}</b>
      <span class="sgl-muted">{{ asr ? `${form.hotWords.length} 条` : `${form.glossaryPairs.length} 条 · ${glossaryLength(form.glossaryPairs)}/${MAX_GLOSSARY} 字` }}</span>
    </div>
    <div class="sgl-chips">
      <template v-if="asr">
        <span v-for="(w, i) in form.hotWords" :key="`h${i}`" class="sgl-chip">{{ w }}<button type="button" :aria-label="`删除 ${w}`" @click="form.hotWords.splice(i, 1)">✕</button></span>
      </template>
      <template v-else>
        <span v-for="(p, i) in form.glossaryPairs" :key="`g${i}`" class="sgl-chip">{{ p.from }} → {{ p.to }}<button type="button" :aria-label="`删除 ${p.from}`" @click="form.glossaryPairs.splice(i, 1)">✕</button></span>
      </template>
      <span v-if="!(asr ? form.hotWords.length : form.glossaryPairs.length)" class="sgl-muted">暂无，可从左侧提取或手动添加</span>
    </div>
    <div class="sgl-add">
      <a-input v-model="kwFrom" size="small" :max-length="50" :placeholder="asr ? '热词' : '原文'" :aria-label="asr ? '热词' : '关键词原文'" @press-enter="addKeyword" />
      <a-input v-if="!asr" v-model="kwTo" size="small" :max-length="50" placeholder="译文" aria-label="关键词译文" @press-enter="addKeyword" />
      <a-button size="small" @click="addKeyword">添加</a-button>
    </div>

    <div class="sgl-divider" />

    <!-- 易错词 -->
    <div class="sgl-head">
      <b>易错词</b>
      <span class="sgl-muted">{{ form.replacePairs.length }} / {{ MAX_REPLACE }}</span>
    </div>
    <div class="sgl-chips">
      <span v-for="(p, i) in form.replacePairs" :key="`r${i}`" class="sgl-chip">{{ p.from }} → {{ p.to }}<button type="button" :aria-label="`删除 ${p.from}`" @click="form.replacePairs.splice(i, 1)">✕</button></span>
      <span v-if="!form.replacePairs.length" class="sgl-muted">暂无</span>
    </div>
    <div class="sgl-add">
      <a-input v-model="tyFrom" size="small" :max-length="50" placeholder="易错" aria-label="易错写法" @press-enter="addTypo" />
      <a-input v-model="tyTo" size="small" :max-length="50" placeholder="纠正" aria-label="纠正" @press-enter="addTypo" />
      <a-button size="small" :disabled="form.replacePairs.length >= MAX_REPLACE" @click="addTypo">添加</a-button>
    </div>
    <div class="sgl-muted sgl-foot">易错词根据{{ asr ? '原文' : '译文' }}进行强制纠错，单词不超过 50 个字。</div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { MAX_GLOSSARY, MAX_REPLACE, SPEECH_FORM_KEY, glossaryLength, mergePairs } from './speechTask'

const form = inject(SPEECH_FORM_KEY)!
const asr = computed(() => form.mode === 'asr')

const kwFrom = ref('')
const kwTo = ref('')
const tyFrom = ref('')
const tyTo = ref('')

const addKeyword = () => {
  const from = kwFrom.value.trim()
  if (asr.value) {
    if (!from) return
    if (form.hotWords.some((w) => w.toLowerCase() === from.toLowerCase())) return Message.warning('该热词已存在')
    form.hotWords.push(from)
  } else {
    if (!from || !kwTo.value.trim()) return Message.warning('请同时填写原文和译文')
    if (!mergePairs(form.glossaryPairs, [{ from, to: kwTo.value }])) return Message.warning('该关键词已存在')
  }
  kwFrom.value = ''
  kwTo.value = ''
}

const addTypo = () => {
  if (!tyFrom.value.trim() || !tyTo.value.trim()) return Message.warning('请同时填写易错写法和纠正')
  if (tyFrom.value.trim() === tyTo.value.trim()) return Message.warning('易错写法与纠正不能相同')
  if (!mergePairs(form.replacePairs, [{ from: tyFrom.value, to: tyTo.value }], MAX_REPLACE)) return Message.warning('该易错词已存在或已达上限')
  tyFrom.value = ''
  tyTo.value = ''
}
</script>

<style scoped>
.sgl { display: flex; flex-direction: column; gap: 10px; }
.sgl-head { display: flex; align-items: center; justify-content: space-between; }
.sgl-muted { font-size: 12px; color: var(--color-text-3); }
.sgl-chips { display: flex; flex-wrap: wrap; gap: 6px; max-height: 220px; overflow: auto; }
.sgl-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 4px 2px 8px; border-radius: 12px; background: var(--color-fill-2); font-size: 12px; max-width: 100%; word-break: break-all; }
.sgl-chip button { border: 0; background: none; color: var(--color-text-3); cursor: pointer; padding: 0 4px; font-size: 11px; }
.sgl-chip button:hover { color: rgb(var(--red-6)); }
.sgl-add { display: flex; gap: 6px; }
.sgl-divider { height: 1px; background: var(--color-border-2); margin: 4px 0; }
.sgl-foot { line-height: 1.6; }
</style>
