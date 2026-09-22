<template>
  <div class="image-preview">
    <div class="image-container" :style="containerStyle">
      <img
        :src="url"
        :alt="fileName"
        :style="imageStyle"
        @load="handleImageLoad"
        @error="handleImageError"
      />
    </div>

    <!-- 缩放控制 -->
    <div class="zoom-controls">
      <div class="zoom-btn-group">
        <V2Button size="sm" type="secondary" @click="zoomOut" :disabled="scale <= minScale">
          <template #icon>
            <icon-minus />
          </template>
        </V2Button>
        <V2Button size="sm" type="secondary" disabled>
          {{ Math.round(scale * 100) }}%
        </V2Button>
        <V2Button size="sm" type="secondary" @click="zoomIn" :disabled="scale >= maxScale">
          <template #icon>
            <icon-plus />
          </template>
        </V2Button>
        <V2Button size="sm" type="secondary" @click="resetZoom">
          <template #icon>
            <icon-refresh />
          </template>
        </V2Button>
        <V2Button size="sm" type="secondary" @click="rotateLeft">
          <template #icon>
            <icon-rotate-left />
          </template>
        </V2Button>
        <V2Button size="sm" type="secondary" @click="rotateRight">
          <template #icon>
            <icon-rotate-right />
          </template>
        </V2Button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <a-spin />
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <icon-image />
      <p>图片加载失败</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { V2Button } from '@/components/ui'
import {
  IconMinus,
  IconPlus,
  IconRefresh,
  IconRotateLeft,
  IconRotateRight,
  IconImage,
} from '@arco-design/web-vue/es/icon'

interface Props {
  url: string
  fileName: string
}

defineProps<Props>()

// ==================== 状态 ====================
const loading = ref(true)
const error = ref(false)
const scale = ref(1)
const rotation = ref(0)

const minScale = 0.1
const maxScale = 5
const scaleStep = 0.2

// ==================== 计算属性 ====================
const imageStyle = computed(() => {
  return {
    transform: `scale(${scale.value}) rotate(${rotation.value}deg)`,
    transition: 'transform 0.3s ease',
  }
})

const containerStyle = computed(() => {
  return {
    cursor: scale.value > 1 ? 'move' : 'default',
  }
})

// ==================== 方法 ====================
function handleImageLoad() {
  loading.value = false
  error.value = false
}

function handleImageError() {
  loading.value = false
  error.value = true
}

function zoomIn() {
  scale.value = Math.min(maxScale, scale.value + scaleStep)
}

function zoomOut() {
  scale.value = Math.max(minScale, scale.value - scaleStep)
}

function resetZoom() {
  scale.value = 1
  rotation.value = 0
}

function rotateLeft() {
  rotation.value -= 90
}

function rotateRight() {
  rotation.value += 90
}
</script>

<style scoped>
.image-preview {
  position: relative;
  width: 100%;
  min-height: 400px;
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
}

.image-container img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.zoom-btn-group {
  display: flex;
  gap: 4px;
}

.zoom-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card);
  padding: 8px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--bg-hover);
}

.error-overlay :deep(.arco-icon) {
  font-size: 64px;
  color: var(--text-tertiary);
}

.error-overlay p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
