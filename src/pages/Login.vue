<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconVideoCamera, IconCloud, IconHome, IconLeft } from '@arco-design/web-vue/es/icon'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

type LoginType = 'live' | 'cloud' | null

const loginType = ref<LoginType>(null)

const form = reactive({
  username: '',
  password: '',
  companyId: 1,
})

const submitting = ref(false)

// 根据登录类型配置页面样式
const pageConfig = computed(() => {
  if (loginType.value === 'live') {
    return {
      title: 'ZiGeBo',
      subtitle: '直播平台',
      brandColor: '#ff6b6b',
      gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
      bgGradient: 'radial-gradient(circle at 20% 20%, rgba(255, 107, 107, 0.15), transparent 40%), radial-gradient(circle at 80% 20%, rgba(238, 90, 36, 0.1), transparent 35%), #f5f7fb',
      decorationGradient: 'radial-gradient(circle at 30% 60%, rgba(255, 107, 107, 0.2), transparent 40%), radial-gradient(circle at 80% 60%, rgba(238, 90, 36, 0.15), transparent 35%)',
      icon: IconVideoCamera,
      defaultPath: '/LiveGuide'
    }
  } else if (loginType.value === 'cloud') {
    return {
      title: 'ZiGeBo',
      subtitle: '云盘系统',
      brandColor: '#165dff',
      gradient: 'linear-gradient(135deg, #165dff, #34c759)',
      bgGradient: 'radial-gradient(circle at 20% 20%, rgba(22, 93, 255, 0.15), transparent 40%), radial-gradient(circle at 80% 20%, rgba(0, 201, 255, 0.1), transparent 35%), #f5f7fb',
      decorationGradient: 'radial-gradient(circle at 30% 60%, rgba(22, 93, 255, 0.2), transparent 40%), radial-gradient(circle at 80% 60%, rgba(0, 168, 112, 0.15), transparent 35%)',
      icon: IconCloud,
      defaultPath: '/cloud'
    }
  }
  return {
    title: 'ZiGeBo',
    subtitle: '云数据平台',
    brandColor: '#165dff',
    gradient: 'linear-gradient(135deg, #165dff, #34c759)',
    bgGradient: 'radial-gradient(circle at 20% 20%, rgba(22, 93, 255, 0.15), transparent 40%), radial-gradient(circle at 80% 20%, rgba(0, 201, 255, 0.1), transparent 35%), #f5f7fb',
    decorationGradient: 'radial-gradient(circle at 30% 60%, rgba(22, 93, 255, 0.2), transparent 40%), radial-gradient(circle at 80% 60%, rgba(0, 168, 112, 0.15), transparent 35%)',
    icon: IconHome,
    defaultPath: '/'
  }
})

const handleSubmit = async (data: any) => {
  submitting.value = true
  try {
    await authStore.login({
      username: form.username,
      password: form.password,
      companyId: form.companyId,
      loginType: loginType.value || 'live',
    })
    Message.success('登录成功')

    // 确定登录后跳转的路径
    const redirect = (route.query.redirect as string) || pageConfig.value.defaultPath
    router.push(redirect)
  } catch (err: any) {
    const msg = err?.response?.data?.message || '登录失败，请检查账号信息'
    Message.error(msg)
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  // 从路由参数中获取登录类型
  const typeParam = route.query.type as string
  if (typeParam === 'live' || typeParam === 'cloud') {
    loginType.value = typeParam as 'live' | 'cloud'
  }
})
</script>

<template>
  <div class="login-page" :style="{ background: pageConfig.bgGradient }">
    <div class="back-button" @click="goBack">
      <IconLeft />
      <span>返回选择</span>
    </div>

    <a-card class="login-card" :bordered="false">
      <div class="logo-section">
        <div class="logo-mark" :style="{ background: pageConfig.gradient }">
          <component :is="pageConfig.icon" />
        </div>
        <div class="title">{{ pageConfig.title }}</div>
        <div class="subtitle">{{ pageConfig.subtitle }}</div>
      </div>

      <a-form :model="form" layout="vertical" @submit="handleSubmit">
        <a-form-item field="username" label="用户名">
          <a-input v-model="form.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item field="password" label="密码">
          <a-input-password v-model="form.password" placeholder="请输入密码" allow-clear />
        </a-form-item>
        <a-button type="primary" long :loading="submitting" html-type="submit" :style="{ background: pageConfig.gradient, borderColor: 'transparent' }">
          登录
        </a-button>
      </a-form>

      <div class="platform-indicator">
        <span :style="{ color: pageConfig.brandColor }">●</span>
        <span>{{ loginType === 'live' ? '直播中心' : loginType === 'cloud' ? '云盘中心' : '综合中心' }}</span>
      </div>
    </a-card>

    <div class="login-bg" :style="{ background: pageConfig.decorationGradient }" />
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f7fb;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  z-index: 10;
}

.back-button:hover {
  color: #165dff;
  background: rgba(255, 255, 255, 1);
  transform: translateX(-4px);
}

.login-card {
  width: 400px;
  padding: 24px 24px 32px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
  z-index: 2;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.logo-mark {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 12px;
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.25);
}

.title {
  font-size: 26px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.platform-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 12px;
  color: #9ca3af;
}

.platform-indicator span:first-child {
  font-size: 10px;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 60%, rgba(22, 93, 255, 0.12), transparent 40%),
    radial-gradient(circle at 80% 60%, rgba(0, 168, 112, 0.12), transparent 35%);
  z-index: 1;
  pointer-events: none;
}
</style>
