<!-- 颜色选择器字段 -->
<template>
  <div class="color-field">
    <!-- 查看模式 -->
    <div v-if="mode === 'view'" class="color-field__view">
      <div class="color-field__preview" :style="{ background: modelValue || '#ffffff' }"></div>
      <span class="color-field__text">{{ modelValue || '-' }}</span>
    </div>

    <!-- 编辑模式 -->
    <div v-else class="color-field__edit">
      <a-trigger
        v-model:popup-visible="popupVisible"
        trigger="click"
        :disabled="disabled || readonly"
      >
        <div class="color-field__trigger">
          <div class="color-field__preview" :style="{ background: modelValue || '#ffffff' }"></div>
          <span class="color-field__text">{{ modelValue || '请选择颜色' }}</span>
          <icon-down class="color-field__icon" />
        </div>
        <template #content>
          <div class="color-field__picker">
            <a-color-picker
              :model-value="modelValue"
              :format="config.format || 'hex'"
              :show-text="true"
              :show-history="config.showHistory !== false"
              :history-colors="config.historyColors || []"
              :disabled-alpha="config.disabledAlpha !== false"
              @change="handleChange"
            />
            <div v-if="config.presetColors && config.presetColors.length > 0" class="color-field__presets">
              <div class="color-field__presets-title">预设颜色</div>
              <div class="color-field__presets-list">
                <div
                  v-for="(color, index) in config.presetColors"
                  :key="index"
                  class="color-field__preset-item"
                  :style="{ background: color }"
                  :title="color"
                  @click="handlePresetClick(color)"
                ></div>
              </div>
            </div>
          </div>
        </template>
      </a-trigger>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconDown } from '@arco-design/web-vue/es/icon'
import type { SysColumn, FormMode } from '../../types'

interface Props {
  column: SysColumn
  modelValue: any
  mode: FormMode
  disabled?: boolean
  readonly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
  'blur': []
}>()

const popupVisible = ref(false)

// 解析控件配置
const config = computed(() => {
  try {
    return JSON.parse(props.column.CONTROL_CONFIG || '{}')
  } catch {
    return {}
  }
})

/**
 * 值变化处理
 */
function handleChange(value: string) {
  emit('update:modelValue', value)
}

/**
 * 预设颜色点击
 */
function handlePresetClick(color: string) {
  emit('update:modelValue', color)
  popupVisible.value = false
}
</script>

<style scoped>
.color-field {
  display: inline-block;
}

.color-field__view {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-field__edit {
  display: inline-block;
}

.color-field__trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-field__trigger:hover {
  border-color: #3370ff;
}

.color-field__preview {
  width: 24px;
  height: 24px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  flex-shrink: 0;
}

.color-field__text {
  font-size: 14px;
  color: #1d2129;
}

.color-field__icon {
  margin-left: auto;
  color: #86909c;
  font-size: 12px;
}

.color-field__picker {
  padding: 12px;
}

.color-field__presets {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e6eb;
}

.color-field__presets-title {
  font-size: 12px;
  color: #86909c;
  margin-bottom: 8px;
}

.color-field__presets-list {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.color-field__preset-item {
  width: 24px;
  height: 24px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.color-field__preset-item:hover {
  transform: scale(1.1);
}
</style>
