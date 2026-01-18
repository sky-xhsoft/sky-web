<template>
  <div class="audio-preview">
    <div class="audio-container">
      <div class="audio-icon">
        <icon-music />
      </div>
      <div class="audio-info">
        <h3>{{ fileName }}</h3>
        <p>音频文件</p>
      </div>
      <audio
        ref="audioRef"
        :src="url"
        controls
        controlsList="nodownload"
        preload="metadata"
        @loadedmetadata="handleAudioLoad"
        @error="handleAudioError"
      >
        您的浏览器不支持音频播放
      </audio>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-message">
      <icon-exclamation-circle />
      <span>音频加载失败</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconMusic, IconExclamationCircle } from '@arco-design/web-vue/es/icon'

interface Props {
  url: string
  fileName: string
}

const props = defineProps<Props>()

// ==================== 状态 ====================
const audioRef = ref<HTMLAudioElement | null>(null)
const error = ref(false)

// ==================== 方法 ====================
function handleAudioLoad() {
  error.value = false
}

function handleAudioError() {
  error.value = true
}
</script>

<style scoped>
.audio-preview {
  padding: 40px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.audio-container {
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.audio-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.audio-icon :deep(.arco-icon) {
  font-size: 48px;
  color: white;
}

.audio-info {
  text-align: center;
}

.audio-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  word-break: break-word;
}

.audio-info p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.audio-container audio {
  width: 100%;
  outline: none;
}

.error-message {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
}

.error-message :deep(.arco-icon) {
  font-size: 18px;
}
</style>
