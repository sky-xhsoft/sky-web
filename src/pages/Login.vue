<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
  companyId: 1,
})

const submitting = ref(false)

const handleSubmit = async () => {
  submitting.value = true
  try {
    await authStore.login({
      username: form.username,
      password: form.password,
      companyId: form.companyId,
    })
    Message.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    const msg = err?.response?.data?.message || '登录失败，请检查账号信息'
    Message.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <a-card class="login-card" :bordered="false">
      <div class="title">Sky Web</div>
      <div class="subtitle">Vite + Vue3 + Arco Design 管理后台</div>
      <a-form :model="form" layout="vertical" @submit.prevent="handleSubmit">
        <a-form-item field="companyId" label="公司ID">
          <a-input-number v-model="form.companyId" placeholder="请输入公司ID" style="width: 100%" />
        </a-form-item>
        <a-form-item field="username" label="用户名">
          <a-input v-model="form.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item field="password" label="密码">
          <a-input-password v-model="form.password" placeholder="请输入密码" allow-clear />
        </a-form-item>
        <a-button type="primary" long :loading="submitting" html-type="submit" @click="handleSubmit">
          登录
        </a-button>
      </a-form>
    </a-card>
  </div>
  <div class="login-bg" />
</template>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #e8f2ff, transparent 40%),
    radial-gradient(circle at 80% 20%, #e6fff5, transparent 35%),
    #f5f7fb;
}
.login-card {
  width: 380px;
  padding: 12px 12px 20px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
  z-index: 2;
}
.title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}
.subtitle {
  color: var(--color-text-2);
  margin-bottom: 20px;
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
