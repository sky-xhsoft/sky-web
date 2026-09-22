<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="not-found-code">404</div>
      <div class="not-found-title">{{ title }}</div>
      <div class="not-found-desc">{{ description }}</div>
      <div class="not-found-actions">
        <a-button type="primary" @click="goHome">
          <template #icon><icon-home /></template>
          返回首页
        </a-button>
        <a-button @click="goBack">
          <template #icon><icon-arrow-left /></template>
          返回上页
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IconHome, IconArrowLeft } from '@arco-design/web-vue/es/icon'
import { useAuthStore } from '../stores/auth'

interface Props {
  title?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  title: '页面不存在',
  description: '您访问的页面不存在或已被移除'
})

const router = useRouter()
const authStore = useAuthStore()

function goHome() {
  const loginType = authStore.loginType
  if (loginType === 'live') {
    router.push('/')
  } else if (loginType === 'cloud') {
    router.push('/cloud')
  } else {
    router.push('/')
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 48px 24px;
  background: #ffffff;
}

.not-found-content {
  text-align: center;
  max-width: 480px;
}

.not-found-code {
  font-size: 96px;
  font-weight: 700;
  color: #e5e6eb;
  line-height: 1;
  letter-spacing: 8px;
}

.not-found-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  margin-top: 16px;
}

.not-found-desc {
  font-size: 14px;
  color: #86909c;
  margin-top: 8px;
  line-height: 1.6;
}

.not-found-actions {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>