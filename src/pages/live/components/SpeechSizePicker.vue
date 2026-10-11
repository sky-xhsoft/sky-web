<template>
  <a-trigger v-model:popup-visible="open" trigger="click" position="bl" :popup-offset="4" :unmount-on-close="false">
    <button type="button" class="ssp-trigger" :class="{ 'is-open': open }" aria-label="源流尺寸" :aria-expanded="open">
      <icon-desktop class="ssp-icon" />
      <span class="ssp-value">{{ sizeLabel(modelValue) }}</span>
      <icon-down class="ssp-arrow" />
    </button>
    <template #content>
      <div class="ssp-pop" role="listbox" aria-label="源流尺寸">
        <div class="ssp-custom">
          <a-input-number v-model="customW" :min="100" :max="7680" :precision="0" hide-button size="small" aria-label="自定义宽" class="ssp-num" @keydown.enter="applyCustom" />
          <span class="ssp-x">*</span>
          <a-input-number v-model="customH" :min="100" :max="7680" :precision="0" hide-button size="small" aria-label="自定义高" class="ssp-num" @keydown.enter="applyCustom" />
          <a-link class="ssp-ok" @click="applyCustom">确定</a-link>
        </div>
        <div v-if="customError" class="ssp-err">{{ customError }}</div>
        <div class="ssp-list">
          <button
            v-for="s in SIZES"
            :key="s.value"
            type="button"
            role="option"
            class="ssp-opt"
            :class="{ 'is-active': s.value === modelValue }"
            :aria-selected="s.value === modelValue"
            @click="pick(s.value)"
          >{{ s.label }}</button>
          <button v-if="isCustom" type="button" role="option" class="ssp-opt is-active" aria-selected="true">{{ sizeLabel(modelValue) }}</button>
        </div>
        <div class="ssp-screen">
          <span>{{ screen.w }} * {{ screen.h }}</span>
          <a-link @click="pick(`${screen.w}x${screen.h}`)">切换至屏幕大小</a-link>
        </div>
      </div>
    </template>
  </a-trigger>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconDesktop, IconDown } from '@arco-design/web-vue/es/icon'
import { SIZES, checkCustomSize, parseSize, sizeLabel } from './speechTask'

// 源流尺寸选择（参考火山控制台）：自定义宽高、常用尺寸、切换至屏幕大小
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open = ref(false)
const customW = ref<number>()
const customH = ref<number>()
const customError = ref('')
const isCustom = computed(() => !SIZES.some((s) => s.value === props.modelValue))
const screen = computed(() => ({ w: window.screen?.width || 1920, h: window.screen?.height || 1080 }))

watch(open, (v) => {
  if (!v) return
  const { w, h } = parseSize(props.modelValue)
  customW.value = w
  customH.value = h
  customError.value = ''
})

const pick = (v: string) => {
  emit('update:modelValue', v)
  open.value = false
}
const applyCustom = () => {
  customError.value = checkCustomSize(customW.value, customH.value)
  if (!customError.value) pick(`${customW.value}x${customH.value}`)
}
</script>

<style scoped>
.ssp-trigger { display: flex; align-items: center; gap: 6px; width: 100%; height: 32px; padding: 0 10px; border: 1px solid transparent; border-radius: var(--border-radius-small); background: var(--color-fill-2); color: var(--color-text-1); font-size: 13px; cursor: pointer; text-align: left; }
.ssp-trigger:hover { background: var(--color-fill-3); }
.ssp-trigger.is-open, .ssp-trigger:focus-visible { border-color: rgb(var(--primary-6)); background: var(--color-bg-2); outline: none; }
.ssp-icon { color: var(--color-text-3); flex-shrink: 0; }
.ssp-value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ssp-arrow { color: var(--color-text-3); font-size: 12px; transition: transform 0.15s; }
.is-open .ssp-arrow { transform: rotate(180deg); }
.ssp-pop { width: 236px; padding: 8px 0; background: var(--color-bg-popup); border: 1px solid var(--color-border-2); border-radius: 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.ssp-custom { display: flex; align-items: center; gap: 6px; padding: 2px 10px 8px; border-bottom: 1px solid var(--color-border-1); }
.ssp-num { width: 72px; }
.ssp-x { color: var(--color-text-3); }
.ssp-ok { margin-left: auto; }
.ssp-err { padding: 4px 10px 0; font-size: 12px; color: rgb(var(--red-6)); }
.ssp-list { display: flex; flex-direction: column; padding: 6px; border-bottom: 1px solid var(--color-border-1); }
.ssp-opt { padding: 7px 10px; border: 0; border-radius: 4px; background: none; color: var(--color-text-1); font-size: 13px; text-align: left; cursor: pointer; }
.ssp-opt:hover { background: var(--color-fill-2); }
.ssp-opt.is-active { color: rgb(var(--primary-6)); background: var(--color-fill-2); font-weight: 500; }
.ssp-screen { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px 2px; font-size: 13px; color: var(--color-text-2); }
</style>
