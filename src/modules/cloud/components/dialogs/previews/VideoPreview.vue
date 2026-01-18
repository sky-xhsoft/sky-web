<template>
  <div class="video-preview">
    <video
      ref="videoRef"
      :src="url"
      controls
      controlsList="nodownload"
      preload="metadata"
      @loadedmetadata="handleVideoLoad"
      @error="handleVideoError"
    >
      您的浏览器不支持视频播放
    </video>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <icon-video-camera />
      <p>视频加载失败</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconVideoCamera } from '@arco-design/web-vue/es/icon'

interface Props {
  url: string
  fileName: string
}

const props = defineProps<Props>()

// ==================== 状态 ====================
const videoRef = ref<HTMLVideoElement | null>(null)
const error = ref(false)

// ==================== 方法 ====================
function handleVideoLoad() {
  error.value = false
}

function handleVideoError() {
  error.value = true
}
</script>

<style scoped>
.video-preview {
  position: relative;
  width: 100%;
  min-height: 400px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-preview video {
  width: 100%;
  max-height: 70vh;
  outline: none;
}

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
  background: #1f2937;
}

.error-overlay :deep(.arco-icon) {
  font-size: 64px;
  color: #9ca3af;
}

.error-overlay p {
  margin: 0;
  color: #e5e7eb;
  font-size: 14px;
}
</style>
