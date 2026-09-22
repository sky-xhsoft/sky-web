<template>
  <div class="user-profile">
    <div class="page-header">
      <h1>{{ t('userProfile.title') }}</h1>
    </div>

    <div class="page-content">
      <a-card class="profile-card">
        <div class="profile-section">
          <h2>{{ t('userProfile.personalInfo') }}</h2>
          <a-form layout="inline">
            <a-form-item :label="t('userProfile.username')">
              <a-input v-model="userInfo.username" disabled style="width: 200px" />
            </a-form-item>
            <a-form-item :label="t('userProfile.email')">
              <a-input v-model="userInfo.email" disabled style="width: 200px" />
            </a-form-item>
            <a-form-item :label="t('userProfile.phone')">
              <a-input v-model="userInfo.phone" disabled style="width: 200px" />
            </a-form-item>
          </a-form>
        </div>

        <div class="profile-section">
          <h2>{{ t('userProfile.languageSettings') }}</h2>
          <a-form layout="inline">
            <a-form-item :label="t('userProfile.language')">
              <a-radio-group v-model="userInfo.language" @change="handleLanguageChange">
                <a-radio value="zh-CN">{{ t('language.zhCN') }}</a-radio>
                <a-radio value="en-US">{{ t('language.enUS') }}</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-form>
        </div>

        <div class="profile-section">
          <h2>{{ t('userProfile.timezoneCurrency') }}</h2>
          <a-form layout="inline">
            <a-form-item :label="t('userProfile.timezone')">
              <a-select v-model="userInfo.timezone" :placeholder="t('userProfile.timezone')" style="width: 180px">
                <a-option value="Asia/Shanghai">{{ t('userProfile.timezoneOptions.asiaShanghai') }}</a-option>
                <a-option value="America/New_York">{{ t('userProfile.timezoneOptions.americaNewYork') }}</a-option>
                <a-option value="Europe/London">{{ t('userProfile.timezoneOptions.europeLondon') }}</a-option>
                <a-option value="Asia/Tokyo">{{ t('userProfile.timezoneOptions.asiaTokyo') }}</a-option>
                <a-option value="Asia/Seoul">{{ t('userProfile.timezoneOptions.asiaSeoul') }}</a-option>
              </a-select>
            </a-form-item>
            <a-form-item :label="t('userProfile.currency')">
              <a-select v-model="userInfo.currency" :placeholder="t('userProfile.currency')" style="width: 160px">
                <a-option value="CNY">{{ t('userProfile.currencyOptions.cny') }}</a-option>
                <a-option value="USD">{{ t('userProfile.currencyOptions.usd') }}</a-option>
                <a-option value="JPY">{{ t('userProfile.currencyOptions.jpy') }}</a-option>
                <a-option value="KRW">{{ t('userProfile.currencyOptions.krw') }}</a-option>
              </a-select>
            </a-form-item>
          </a-form>
        </div>

        <div class="profile-section">
          <h2>{{ t('userProfile.accountSecurity') }}</h2>
          <a-button type="primary" @click="handleChangePassword" size="small">
            {{ t('userProfile.changePassword') }}
          </a-button>
          <a-button type="text" @click="handleLogout" size="small">
            {{ t('userProfile.logout') }}
          </a-button>
        </div>
      </a-card>
    </div>

    <a-modal
      v-model:visible="changePasswordVisible"
      :title="t('userProfile.changePasswordModal.title')"
      @ok="handleConfirmChangePassword"
      @cancel="handleCancelChangePassword"
      :ok-button-props="{ type: 'primary' }"
    >
      <a-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        layout="vertical"
      >
        <a-form-item :label="t('userProfile.changePasswordModal.oldPassword')" field="oldPassword">
          <a-input-password
            v-model="passwordForm.oldPassword"
            :placeholder="t('userProfile.changePasswordModal.oldPasswordPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="t('userProfile.changePasswordModal.newPassword')" field="newPassword">
          <a-input-password
            v-model="passwordForm.newPassword"
            :placeholder="t('userProfile.changePasswordModal.newPasswordPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="t('userProfile.changePasswordModal.confirmPassword')" field="confirmPassword">
          <a-input-password
            v-model="passwordForm.confirmPassword"
            :placeholder="t('userProfile.changePasswordModal.confirmPasswordPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { Message } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
import { changePassword } from '../../api/auth'
import { changeLanguage } from '../../locales'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

const userInfo = reactive({
  username: '',
  email: '',
  phone: '',
  department: '',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  currency: 'CNY'
})

// 从登录信息填充真实用户资料
function syncUserInfo() {
  const u = authStore.user
  if (!u) return
  userInfo.username = u.trueName || u.username || ''
  userInfo.email = u.email || ''
  userInfo.phone = u.phone || ''
  userInfo.department = u.trueName || ''
  if (u.language) userInfo.language = u.language
  if (u.timezone) userInfo.timezone = u.timezone
  if (u.currency) userInfo.currency = u.currency
}

const changePasswordVisible = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordFormRef = ref()

const passwordRules = computed(() => ({
  oldPassword: [
    { required: true, message: t('userProfile.changePasswordModal.validation.oldPasswordRequired'), trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: t('userProfile.changePasswordModal.validation.newPasswordRequired'), trigger: 'blur' },
    { min: 6, message: t('userProfile.changePasswordModal.validation.newPasswordMinLength'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('userProfile.changePasswordModal.validation.confirmPasswordRequired'), trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}))

function validateConfirmPassword(rule: any, value: string) {
  if (passwordForm.newPassword !== value) {
    return Promise.reject(t('userProfile.changePasswordModal.validation.confirmPasswordMatch'))
  }
  return Promise.resolve()
}

const handleLanguageChange = (value: string) => {
  changeLanguage(value, router)
  Message.success(t('userProfile.messages.languageChanged'))
}

const handleChangePassword = () => {
  changePasswordVisible.value = true
}

const handleConfirmChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })

    Message.success(t('userProfile.changePasswordModal.messages.success'))
    changePasswordVisible.value = false
    await authStore.logout()
    router.push('/login')
  } catch (error: any) {
    console.error('Failed to change password:', error)
    Message.error(error.message || t('userProfile.changePasswordModal.messages.error'))
  }
}

const handleCancelChangePassword = () => {
  changePasswordVisible.value = false
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.resetFields()
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Failed to logout:', error)
    Message.error(t('userProfile.messages.logoutError'))
  }
}

onMounted(() => {
  syncUserInfo()
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage && ['zh-CN', 'en-US'].includes(savedLanguage)) {
    userInfo.language = savedLanguage
    locale.value = savedLanguage
  }
})
</script>

<style scoped>
.user-profile {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 16px;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
}

.page-content {
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.profile-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e6eb;
}

.profile-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.profile-section h2 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

:deep(.arco-form-item) {
  margin-bottom: 12px;
}

:deep(.arco-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

:deep(.arco-form-inline .arco-form-item-label) {
  font-size: 14px;
  color: #86909c;
}

:deep(.arco-form-inline .arco-form-item-control) {
  font-size: 14px;
}
</style>
