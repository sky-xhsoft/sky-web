<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconVideoCamera } from '@arco-design/web-vue/es/icon'
import { useAuthStore } from '../../stores/auth'
import { getLoginType } from '../../utils/token'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../../components/LanguageSwitcher.vue'
import { SUBSYSTEMS, isSubSystem, subsystemHomePath, type SubSystem } from '../../constants/subsystems'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

type LoginType = SubSystem | null

const loginType = ref<LoginType>(null)

// 子系统切换：选择后写入地址参数（刷新、分享登录链接时保持所选系统）
const subsystemOptions = computed(() => SUBSYSTEMS.map((s) => ({ value: s.key, label: t(s.labelKey) })))
const selectSubsystem = (value: string | number | boolean) => {
  if (!isSubSystem(value)) return
  loginType.value = value
  router.replace({ query: { ...route.query, type: value } })
}

const form = reactive({
  username: '',
  password: '',
  companyId: 1,
})

const submitting = ref(false)

const platformSubtitle = computed(() =>
  loginType.value === 'live' ? t('login.platforms.live')
    : loginType.value === 'cloud' ? t('login.platforms.cloud')
    : loginType.value === 'system' ? t('login.platforms.system')
    : t('welcome.brandSubtitle')
)

// 必填校验：用户名/密码为空时不发请求
const rules = computed(() => ({
  username: [{ required: true, message: t('login.fields.placeholder.username') }],
  password: [{ required: true, message: t('login.fields.placeholder.password') }],
}))

const handleSubmit = async ({ errors }: { errors?: Record<string, any> }) => {
  if (errors) return
  submitting.value = true
  try {
    await authStore.login({
      username: form.username,
      password: form.password,
      companyId: form.companyId,
      loginType: loginType.value || 'live',
    })
    Message.success(t('login.success'))

    const redirect = (route.query.redirect as string) || defaultPath(loginType.value)
    router.push(redirect)
  } catch (err: any) {
    const msg = err?.response?.data?.message || t('login.error')
    Message.error(msg)
  } finally {
    submitting.value = false
  }
}

// 各系统登录后的默认跳转路径
function defaultPath(type: LoginType): string {
  return subsystemHomePath(type)
}

const goRegister = () => {
  router.push({ name: 'company-register' })
}

onMounted(() => {
  const typeParam = route.query.type as string
  if (isSubSystem(typeParam)) {
    loginType.value = typeParam
  } else {
    // 未指定系统时沿用上次登录的系统（登录过期被带回登录页时不丢失所在系统），首次登录默认视频系统
    loginType.value = getLoginType() || 'live'
  }
})
</script>

<template>
  <div class="login-page">
    <div class="language-switcher">
      <LanguageSwitcher />
    </div>

    <!-- 组合体：左侧小装饰 + 右侧登录表单，整体居中 -->
    <div class="login-wrap">
      <!-- 左侧装饰区（小块，和登录框连在一起） -->
      <div class="deco-side">
        <div class="deco-circle deco-1"></div>
        <div class="deco-circle deco-2"></div>
        <div class="deco-logo">
          <IconVideoCamera class="deco-logo-icon" />
        </div>
        <div class="deco-brand">ZiGeBo</div>
        <div class="deco-tagline">{{ t('welcome.brandSubtitle') }}</div>
      </div>

      <!-- 右侧登录表单卡片 -->
      <div class="login-card">
        <div class="logo-section">
          <div class="logo-mark">
            <IconVideoCamera />
          </div>
          <div class="title">ZiGeBo Experience</div>
          <div class="subtitle">{{ platformSubtitle }}</div>
        </div>

        <!-- 子系统切换 -->
        <a-radio-group
          :model-value="loginType || 'live'"
          type="button"
          class="subsystem-switch"
          :aria-label="t('login.switchSystem')"
          @change="selectSubsystem"
        >
          <a-radio v-for="opt in subsystemOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-radio>
        </a-radio-group>

        <a-form :model="form" :rules="rules" layout="vertical" @submit="handleSubmit">
          <a-form-item field="username" :label="t('login.fields.username')">
            <a-input v-model="form.username" :placeholder="t('login.fields.placeholder.username')" />
          </a-form-item>
          <a-form-item field="password" :label="t('login.fields.password')">
            <a-input-password v-model="form.password" :placeholder="t('login.fields.placeholder.password')" allow-clear />
          </a-form-item>
          <a-button type="primary" long :loading="submitting" html-type="submit" class="login-btn">
            {{ t('login.button') }}
          </a-button>
        </a-form>

        <div class="register-link">
          <span>{{ t('login.noAccount') }}</span>
          <a @click="goRegister">{{ t('login.register') }}</a>
        </div>
      </div>
    </div>
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

.language-switcher {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

/* 组合体：整体居中，左右连在一起 */
.login-wrap {
  display: flex;
  width: 720px;
  max-width: 94vw;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.12);
  background: #fff;
  z-index: 2;
}

/* 左侧装饰区 */
.deco-side {
  position: relative;
  width: 260px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #165dff 0%, #2a7aef 55%, #34c759 120%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  color: #fff;
  overflow: hidden;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.10);
}
.deco-1 {
  width: 220px;
  height: 220px;
  top: -70px;
  left: -60px;
}
.deco-2 {
  width: 120px;
  height: 120px;
  bottom: -40px;
  right: -30px;
}

.deco-logo {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.20);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.deco-logo-icon {
  font-size: 30px;
}

.deco-brand {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.deco-tagline {
  font-size: 13px;
  text-align: center;
  opacity: 0.9;
  line-height: 1.6;
}

/* 右侧登录卡片 */
.login-card {
  flex: 1;
  padding: 44px 40px 36px;
  display: flex;
  flex-direction: column;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
}

.logo-mark {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #165dff, #34c759);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 14px;
}

.title {
  font-size: 21px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
}

.subsystem-switch {
  display: flex;
  width: 100%;
  margin-bottom: 22px;
}

.subsystem-switch :deep(.arco-radio-button) {
  flex: 1;
  text-align: center;
}

.login-btn {
  height: 44px;
  font-size: 15px;
  border-radius: 8px;
  background: linear-gradient(135deg, #165dff, #34c759);
  border-color: transparent;
}

.login-btn:hover {
  filter: brightness(1.05);
}

.register-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 13px;
  color: #9ca3af;
}

.register-link a {
  color: #165dff;
  cursor: pointer;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

/* 窄屏：隐藏左侧装饰，仅登陆卡 */
@media (max-width: 720px) {
  .deco-side {
    display: none;
  }
  .login-wrap {
    box-shadow: none;
  }
}
</style>