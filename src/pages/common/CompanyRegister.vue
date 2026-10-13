<template>
  <div class="auth-wrap">
    <div class="back-button" @click="goBack">
      <icon-left />
      <span>{{ t('register.back') }}</span>
    </div>

    <div class="card auth-card card-pad register-card">
      <div class="welcome-hero">
        <div class="hero-logo">
          <icon-common />
        </div>
        <div class="register-title">{{ t('register.title') }}</div>
        <div class="register-subtitle">{{ t('register.subtitle') }}</div>
      </div>

      <a-steps :current="step" size="small" class="step-bar">
        <a-step :title="t('register.steps.company')" />
        <a-step :title="t('register.steps.admin')" />
        <a-step :title="t('register.steps.done')" />
      </a-steps>

      <!-- Step 1: Company Info -->
      <a-form v-if="step === 0" :model="companyForm" layout="vertical" @submit="handleNext">
        <a-form-item field="name" :label="t('register.company.name')" required>
          <a-input v-model="companyForm.name" :placeholder="t('register.company.namePlaceholder')" class="v2-form-input" />
        </a-form-item>
        <a-form-item field="code" :label="t('register.company.code')" required>
          <a-input v-model="companyForm.code" :placeholder="t('register.company.codePlaceholder')" :max-length="20" class="v2-form-input" />
        </a-form-item>
        <a-form-item field="phone" :label="t('register.company.phone')" required
          :validate-status="phoneError ? 'error' : undefined" :help="phoneError || undefined">
          <div class="email-row">
            <a-input v-model="companyForm.phone" :placeholder="t('register.company.phonePlaceholder')" :max-length="11" class="v2-form-input"
              @input="phoneError = ''" @blur="checkPhone" />
            <V2Button type="primary" size="sm" @click="sendSmsCode" :disabled="smsCountdown > 0">
              {{ smsCountdown > 0 ? t('register.company.codeRetry', {n: smsCountdown}) : t('register.company.getSmsCode') }}
            </V2Button>
          </div>
        </a-form-item>
        <a-form-item field="smsVerifyCode" :label="t('register.company.smsVerifyCode')">
          <a-input v-model="companyForm.smsVerifyCode" :placeholder="t('register.company.verifyCodePlaceholder')" :max-length="6" class="v2-form-input" />
        </a-form-item>
        <a-form-item field="contactName" :label="t('register.company.contact')">
          <a-input v-model="companyForm.contactName" :placeholder="t('register.company.contactPlaceholder')" class="v2-form-input" />
        </a-form-item>
        <a-form-item field="contactPhone" :label="t('register.company.phone')">
          <a-input v-model="companyForm.contactPhone" :placeholder="t('register.company.phonePlaceholder')" class="v2-form-input" />
        </a-form-item>
        <a-form-item>
          <V2Button type="gradient" class="full-width" :loading="submitting" @click="handleNext">
            {{ t('register.company.next') }}
          </V2Button>
        </a-form-item>
      </a-form>

      <!-- Step 2: Admin Account -->
      <a-form v-if="step === 1" :model="adminForm" layout="vertical" @submit="handleSubmit">
        <div class="step-desc">{{ t('register.admin.desc', {name: companyForm.name}) }}</div>
        <a-form-item field="username" :label="t('register.admin.username')" required
          :validate-status="usernameError ? 'error' : undefined" :help="usernameError || undefined">
          <a-input v-model="adminForm.username" :placeholder="t('register.admin.usernamePlaceholder')" class="v2-form-input"
            @input="usernameError = ''" @blur="checkUsername" />
        </a-form-item>
        <a-form-item field="password" :label="t('register.admin.password')" required>
          <a-input-password v-model="adminForm.password" :placeholder="t('register.admin.passwordPlaceholder')" class="v2-form-input" />
        </a-form-item>
        <a-form-item field="confirmPassword" :label="t('register.admin.confirmPassword')" required>
          <a-input-password v-model="adminForm.confirmPassword" :placeholder="t('register.admin.confirmPlaceholder')" class="v2-form-input" />
        </a-form-item>
        <a-form-item field="adminName" :label="t('register.admin.adminName')">
          <a-input v-model="adminForm.adminName" :placeholder="t('register.admin.adminNamePlaceholder')" class="v2-form-input" />
        </a-form-item>
        <div class="btn-row">
          <V2Button type="secondary" @click="step = 0">{{ t('register.admin.prev') }}</V2Button>
          <V2Button type="gradient" :loading="submitting" @click="handleSubmit">{{ t('register.admin.submit') }}</V2Button>
        </div>
      </a-form>

      <!-- Step 3: Complete -->
      <div v-if="step === 2" class="complete-section">
        <icon-check-circle :size="64" style="color: var(--success)" />
        <h2>{{ t('register.complete.title') }}</h2>
        <p>{{ t('register.complete.desc') }}</p>
        <V2Button type="gradient" @click="goLogin">{{ t('register.complete.goLogin') }}</V2Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { IconLeft, IconCommon, IconCheckCircle } from '@arco-design/web-vue/es/icon'
import { V2Button } from '@/components/ui'
import api from '@/api/http'

const router = useRouter()
const { t } = useI18n()
const step = ref(0)
const submitting = ref(false)
const smsCountdown = ref(0)
const phoneError = ref('')
const usernameError = ref('')

/** 中国大陆手机号：1 开头、第二位 3～9、共 11 位（与后端一致） */
const PHONE_PATTERN = /^1[3-9]\d{9}$/

interface RegisterAvailability { usernameTaken: boolean; phoneValid: boolean; phoneTaken: boolean }

/** 查询用户名 / 手机号是否已被使用；接口失败时不拦截，由注册接口兜底校验 */
async function fetchAvailability(params: { username?: string; phone?: string }): Promise<RegisterAvailability | null> {
  try {
    const res: any = await api.get('/company/register/check', { params })
    return (res?.data?.data ?? null) as RegisterAvailability | null
  } catch {
    return null
  }
}

/** 校验手机号格式与是否已注册，不通过时在输入框下方提示 */
async function checkPhone(): Promise<boolean> {
  const phone = companyForm.phone.trim()
  companyForm.phone = phone
  if (!phone) {
    phoneError.value = t('register.company.phoneRequired')
    return false
  }
  if (!PHONE_PATTERN.test(phone)) {
    phoneError.value = t('register.company.phoneInvalid')
    return false
  }
  const res = await fetchAvailability({ phone })
  if (res?.phoneTaken) {
    phoneError.value = t('register.company.phoneTaken')
    return false
  }
  phoneError.value = ''
  return true
}

/** 校验用户名是否已被使用（用户名全局唯一） */
async function checkUsername(): Promise<boolean> {
  const username = adminForm.username.trim()
  adminForm.username = username
  if (!username) {
    usernameError.value = t('register.admin.usernameRequired')
    return false
  }
  const res = await fetchAvailability({ username })
  if (res?.usernameTaken) {
    usernameError.value = t('register.admin.usernameTaken')
    return false
  }
  usernameError.value = ''
  return true
}

const companyForm = reactive({
  name: '', code: '',
  phone: '', smsVerifyCode: '',
  contactName: '', contactPhone: ''
})

const adminForm = reactive({
  username: '', password: '', confirmPassword: '', adminName: ''
})

function goBack() { router.push('/') }
function goLogin() { router.push({ name: 'login' }) }

function startCountdown(target: { value: number }) {
  target.value = 60
  const timer = setInterval(() => {
    target.value--
    if (target.value <= 0) clearInterval(timer)
  }, 1000)
}

async function sendSmsCode() {
  if (!(await checkPhone())) return
  try {
    await api.post('/sms/send-code', { phone: companyForm.phone })
    Message.success(t('register.company.codeSent'))
    startCountdown(smsCountdown)
  } catch (e: any) {
    Message.error(e?.response?.data?.message || t('register.company.codeSendFailed'))
  }
}

async function handleNext() {
  if (!(await checkPhone())) return
  if (companyForm.smsVerifyCode.length !== 6) {
    Message.warning(t('register.company.codeInvalid'))
    return
  }
  step.value = 1
}

async function handleSubmit() {
  if (!(await checkUsername())) return
  if (adminForm.password !== adminForm.confirmPassword) {
    Message.warning(t('register.admin.passwordMismatch'))
    return
  }
  submitting.value = true
  try {
    // 手机号注册：phone + smsVerifyCode -> 后端校验（verifyCode 为短信验证码）
    const payload: any = { ...companyForm, ...adminForm }
    payload.verifyCode = payload.smsVerifyCode
    await api.post('/company/register', payload)
    Message.success(t('register.success'))
    step.value = 2
  } catch (e: any) {
    const message = e?.response?.data?.message || t('register.error')
    // 409：提交前被他人抢先使用，回到对应输入框提示
    if (e?.response?.status === 409) {
      if (String(message).includes('手机号')) {
        phoneError.value = t('register.company.phoneTaken')
        step.value = 0
      } else {
        usernameError.value = t('register.admin.usernameTaken')
      }
    }
    Message.error(message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  background: linear-gradient(135deg, var(--info-bg), var(--bg-page));
}

.register-card {
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-sm);
  z-index: 10;
  transition: all 0.3s ease;
}

.back-button:hover {
  color: var(--brand-blue);
}

.welcome-hero {
  text-align: center;
  margin-bottom: 20px;
}

.hero-logo {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-xl);
  background: var(--brand-gradient);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 12px;
}

.register-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.register-subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
}

.step-bar {
  margin-bottom: 20px;
}

.email-row {
  display: flex;
  gap: 10px;
}

.email-row .v2-form-input {
  flex: 1;
}

.v2-form-input {
  width: 100%;
}

.full-width {
  width: 100%;
  justify-content: center;
}

.step-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.btn-row {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.btn-row .v2-button {
  flex: 1;
  justify-content: center;
}

.complete-section {
  text-align: center;
  padding: 40px 0;
}

.complete-section h2 {
  font-size: 20px;
  margin: 12px 0 8px;
  color: var(--text-primary);
}

.complete-section p {
  color: var(--text-secondary);
  margin-bottom: 20px;
}
</style>