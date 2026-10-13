<template>
  <!-- 个人信息与账号：头像、基本信息、界面语言、账号安全 -->
  <div class="user-profile">
    <div class="up-avatar" :style="{ background: avatarColor }">{{ avatarText }}</div>
    <div class="up-name">{{ displayName }}</div>
    <span :class="['up-role', { 'is-admin': isAdmin }]">
      {{ isAdmin ? t('userCenter.admin') : t('userCenter.member') }}
    </span>

    <div class="up-kv">
      <span class="up-key">{{ t('userCenter.account') }}</span>
      <span class="up-val">{{ user?.username || '--' }}</span>
      <span class="up-key">{{ t('userCenter.company') }}</span>
      <span class="up-val">{{ companyName }}</span>
      <span class="up-key">{{ t('userCenter.phone') }}</span>
      <span class="up-val">{{ user?.phone || '--' }}</span>
      <span class="up-key">{{ t('userCenter.email') }}</span>
      <span class="up-val">{{ user?.email || '--' }}</span>
    </div>

    <div class="up-section">
      <div class="up-section-title">{{ t('userProfile.language') }}</div>
      <a-radio-group v-model="language" type="button" size="small" @change="handleLanguageChange">
        <a-radio value="zh-CN">{{ t('language.zhCN') }}</a-radio>
        <a-radio value="en-US">{{ t('language.enUS') }}</a-radio>
      </a-radio-group>
    </div>

    <div class="up-section">
      <div class="up-section-title">{{ t('userProfile.accountSecurity') }}</div>
      <div class="up-actions">
        <a-button size="small" long @click="changePasswordVisible = true">{{ t('userProfile.changePassword') }}</a-button>
        <a-button size="small" long status="danger" @click="handleLogout">{{ t('userProfile.logout') }}</a-button>
      </div>
    </div>

    <a-modal
      v-model:visible="changePasswordVisible"
      :title="t('userProfile.changePasswordModal.title')"
      :on-before-ok="handleConfirmChangePassword"
      @cancel="handleCancelChangePassword"
    >
      <a-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" layout="vertical">
        <a-form-item :label="t('userProfile.changePasswordModal.oldPassword')" field="oldPassword">
          <a-input-password v-model="passwordForm.oldPassword" :placeholder="t('userProfile.changePasswordModal.oldPasswordPlaceholder')" />
        </a-form-item>
        <a-form-item :label="t('userProfile.changePasswordModal.newPassword')" field="newPassword">
          <a-input-password v-model="passwordForm.newPassword" :placeholder="t('userProfile.changePasswordModal.newPasswordPlaceholder')" />
        </a-form-item>
        <a-form-item :label="t('userProfile.changePasswordModal.confirmPassword')" field="confirmPassword">
          <a-input-password v-model="passwordForm.confirmPassword" :placeholder="t('userProfile.changePasswordModal.confirmPasswordPlaceholder')" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useAuthStore } from '../../stores/auth'
import { changePassword } from '../../api/auth'
import { changeLanguage } from '../../locales'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.user)
const companyName = computed(() => authStore.company?.name || '--')
// 后端 IS_ADMIN 为 Y / N
const isAdmin = computed(() => user.value?.isAdmin === 'Y')
const displayName = computed(() => user.value?.trueName || user.value?.username || '--')
const avatarText = computed(() => (displayName.value.charAt(0) || 'U').toUpperCase())
const avatarColor = computed(() => {
  const palettes = ['#165DFF', '#0FC6C2', '#FF7D00', '#2F7D6D', '#722ED1']
  return palettes[(user.value?.id || 0) % palettes.length]
})

// 界面语言
const language = ref('zh-CN')
const handleLanguageChange = (value: string | number | boolean) => {
  changeLanguage(String(value), router)
  Message.success(t('userProfile.messages.languageChanged'))
}

// 修改密码
const changePasswordVisible = ref(false)
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordFormRef = ref()

const passwordRules = computed(() => ({
  oldPassword: [
    { required: true, message: t('userProfile.changePasswordModal.validation.oldPasswordRequired'), trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: t('userProfile.changePasswordModal.validation.newPasswordRequired'), trigger: 'blur' },
    // 与后端 validatePasswordStrength 一致：至少 8 位，含大写、小写字母和数字
    { match: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, message: t('userProfile.changePasswordModal.validation.newPasswordMinLength'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('userProfile.changePasswordModal.validation.confirmPasswordRequired'), trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}))

// Arco 自定义校验的参数是 (value, callback)，必须调用 callback，否则 validate() 不会返回
function validateConfirmPassword(value: string, callback: (error?: string) => void) {
  if (passwordForm.newPassword !== value) {
    callback(t('userProfile.changePasswordModal.validation.confirmPasswordMatch'))
  } else {
    callback()
  }
}

// 作为弹窗的 on-before-ok：返回 false 时弹窗保持打开（校验不通过或修改失败）
const handleConfirmChangePassword = async (): Promise<boolean> => {
  if (!passwordFormRef.value) return false
  try {
    // Arco 的 validate() 校验失败时返回错误对象而不是抛异常
    if (await passwordFormRef.value.validate()) return false
    await changePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
    Message.success(t('userProfile.changePasswordModal.messages.success'))
    changePasswordVisible.value = false
    await authStore.logout()
    router.push('/login')
    return true
  } catch (error: any) {
    console.error('Failed to change password:', error)
    Message.error(error.message || t('userProfile.changePasswordModal.messages.error'))
    return false
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

// 语言代码大小写不统一（如用户资料中的 zh-cn），规范为界面使用的 zh-CN / en-US
const normalizeLanguage = (value?: string | null) => {
  const v = (value || '').toLowerCase()
  if (v.startsWith('en')) return 'en-US'
  if (v.startsWith('zh')) return 'zh-CN'
  return ''
}

onMounted(() => {
  // 以当前界面语言为准，其次是本地保存的、用户资料中的语言
  language.value =
    normalizeLanguage(String(locale.value)) ||
    normalizeLanguage(localStorage.getItem('language')) ||
    normalizeLanguage(user.value?.language) ||
    'zh-CN'
})
</script>

<style scoped>
.user-profile {
  padding: 18px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  text-align: center;
}

.up-avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 32px;
  font-size: 26px;
  font-weight: 600;
  color: #fff;
}

.up-name {
  margin-top: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.up-role {
  display: inline-block;
  margin-top: 4px;
  padding: 0 8px;
  border-radius: 10px;
  background: var(--bg-page);
  font-size: 12px;
  color: var(--text-tertiary);
}

.up-role.is-admin {
  background: var(--info-bg);
  color: var(--brand-blue);
}

.up-kv {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border-light);
  text-align: left;
  font-size: 13px;
}

.up-key {
  color: var(--text-tertiary);
}

.up-val {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.up-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-light);
  text-align: left;
}

.up-section-title {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.up-actions {
  display: flex;
  gap: 8px;
}
</style>
