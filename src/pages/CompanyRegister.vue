<template>
  <div class="register-page">
    <div class="back-button" @click="goBack">
      <icon-left />
      <span>{{ t('register.back') }}</span>
    </div>

    <a-card class="register-card" :bordered="false">
      <div class="logo-section">
        <div class="logo-mark">
          <icon-common />
        </div>
        <div class="title">{{ t('register.title') }}</div>
        <div class="subtitle">{{ t('register.subtitle') }}</div>
      </div>

      <a-steps :current="step" size="small" class="mb-6">
        <a-step :title="t('register.steps.company')" />
        <a-step :title="t('register.steps.admin')" />
        <a-step :title="t('register.steps.done')" />
      </a-steps>

      <!-- Step 1: Company Info -->
      <a-form v-if="step === 0" :model="companyForm" layout="vertical" @submit="handleNext">
        <a-form-item field="name" :label="t('register.company.name')" required>
          <a-input v-model="companyForm.name" :placeholder="t('register.company.namePlaceholder')" />
        </a-form-item>
        <a-form-item field="code" :label="t('register.company.code')" required>
          <a-input v-model="companyForm.code" :placeholder="t('register.company.codePlaceholder')" :max-length="20" />
        </a-form-item>
        <a-form-item field="email" :label="t('register.company.email')" required>
          <a-space>
            <a-input v-model="companyForm.email" :placeholder="t('register.company.emailPlaceholder')" style="width:240px" />
            <a-button type="primary" size="small" @click="sendCode" :disabled="countdown > 0">
              {{ countdown > 0 ? t('register.company.codeRetry', {n: countdown}) : t('register.company.getCode') }}
            </a-button>
          </a-space>
        </a-form-item>
        <a-form-item field="verifyCode" :label="t('register.company.verifyCode')" required>
          <a-input v-model="companyForm.verifyCode" :placeholder="t('register.company.verifyCodePlaceholder')" :max-length="6" />
        </a-form-item>
        <a-form-item field="contactName" :label="t('register.company.contact')">
          <a-input v-model="companyForm.contactName" :placeholder="t('register.company.contactPlaceholder')" />
        </a-form-item>
        <a-form-item field="contactPhone" :label="t('register.company.phone')">
          <a-input v-model="companyForm.contactPhone" :placeholder="t('register.company.phonePlaceholder')" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" long html-type="submit" :loading="submitting">{{ t('register.company.next') }}</a-button>
        </a-form-item>
      </a-form>

      <!-- Step 2: Admin Account -->
      <a-form v-if="step === 1" :model="adminForm" layout="vertical" @submit="handleSubmit">
        <div class="step-desc">{{ t('register.admin.desc', {name: companyForm.name}) }}</div>
        <a-form-item field="username" :label="t('register.admin.username')" required>
          <a-input v-model="adminForm.username" :placeholder="t('register.admin.usernamePlaceholder')" />
        </a-form-item>
        <a-form-item field="password" :label="t('register.admin.password')" required>
          <a-input-password v-model="adminForm.password" :placeholder="t('register.admin.passwordPlaceholder')" />
        </a-form-item>
        <a-form-item field="confirmPassword" :label="t('register.admin.confirmPassword')" required>
          <a-input-password v-model="adminForm.confirmPassword" :placeholder="t('register.admin.confirmPlaceholder')" />
        </a-form-item>
        <a-form-item field="adminName" :label="t('register.admin.adminName')">
          <a-input v-model="adminForm.adminName" :placeholder="t('register.admin.adminNamePlaceholder')" />
        </a-form-item>
        <a-space>
          <a-button @click="step = 0">{{ t('register.admin.prev') }}</a-button>
          <a-button type="primary" html-type="submit" :loading="submitting">{{ t('register.admin.submit') }}</a-button>
        </a-space>
      </a-form>

      <!-- Step 3: Complete -->
      <div v-if="step === 2" class="complete-section">
        <icon-check-circle :size="64" style="color:#34c759" />
        <h2>{{ t('register.complete.title') }}</h2>
        <p>{{ t('register.complete.desc') }}</p>
        <a-button type="primary" @click="goLogin">{{ t('register.complete.goLogin') }}</a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { IconLeft, IconCommon, IconCheckCircle } from '@arco-design/web-vue/es/icon'
import api from '@/api/http'

const router = useRouter()
const { t } = useI18n()
const step = ref(0)
const submitting = ref(false)
const countdown = ref(0)

const companyForm = reactive({
  name: '', code: '', email: '', verifyCode: '',
  contactName: '', contactPhone: ''
})

const adminForm = reactive({
  username: '', password: '', confirmPassword: '', adminName: ''
})

function goBack() { router.push('/') }
function goLogin() { router.push({ name: 'login' }) }

async function sendCode() {
  if (!companyForm.email) {
    Message.warning(t('register.company.codeRequired'))
    return
  }
  try {
    await api.post('/email/verify-code', { email: companyForm.email })
    Message.success(t('register.company.codeSent'))
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch {
    Message.error(t('register.company.codeSent'))
  }
}

function handleNext() {
  if (companyForm.verifyCode.length !== 6) {
    Message.warning(t('register.company.codeInvalid'))
    return
  }
  step.value = 1
}

async function handleSubmit() {
  if (adminForm.password !== adminForm.confirmPassword) {
    Message.warning(t('register.admin.passwordMismatch'))
    return
  }
  submitting.value = true
  try {
    await api.post('/company/register', { ...companyForm, ...adminForm })
    Message.success(t('register.success'))
    step.value = 2
  } catch {
    Message.error(t('register.error'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.register-page {
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; background: #f5f7fb; position: relative;
}
.back-button {
  position: absolute; top: 20px; left: 20px;
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: #6b7280; cursor: pointer;
  padding: 8px 16px; border-radius: 8px;
  background: rgba(255,255,255,.8); backdrop-filter: blur(8px); z-index: 10;
}
.register-card { width: 480px; padding: 24px 24px 32px; box-shadow: 0 12px 36px rgba(0,0,0,.08); }
.logo-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
.logo-mark {
  width: 64px; height: 64px; border-radius: 14px;
  background: linear-gradient(135deg, #165dff, #34c759);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 32px; margin-bottom: 12px;
}
.title { font-size: 24px; font-weight: 800; color: #1f2937; margin-bottom: 4px; }
.subtitle { font-size: 14px; color: #6b7280; }
.step-desc { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
.complete-section { text-align: center; padding: 40px 0; }
.complete-section h2 { font-size: 20px; margin: 12px 0 8px; }
.complete-section p { color: #6b7280; margin-bottom: 20px; }
</style>
