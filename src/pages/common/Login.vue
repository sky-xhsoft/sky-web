<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconVideoCamera, IconCloud, IconSettings, IconUser, IconLock } from '@arco-design/web-vue/es/icon'
import { useAuthStore } from '../../stores/auth'
import { getLoginType } from '../../utils/token'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../../components/LanguageSwitcher.vue'
import { SUBSYSTEMS, canUseSubsystem, isSubSystem, subsystemHomePath, type SubSystem } from '../../constants/subsystems'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

type LoginType = SubSystem | null

const loginType = ref<LoginType>(null)

const SUBSYSTEM_ICONS = { live: IconVideoCamera, cloud: IconCloud, system: IconSettings } as const

// 子系统切换：选择后写入地址参数（刷新、分享登录链接时保持所选系统）。
// 系统中心仅公司 1 可用，登录前不知道用户公司，默认不显示；地址明确带 type=system 时（公司 1 管理员的书签）才显示
const showSystemCenter = computed(() => route.query.type === 'system')
const subsystemOptions = computed(() =>
  SUBSYSTEMS.filter((s) => s.key !== 'system' || showSystemCenter.value).map((s) => ({
    value: s.key,
    label: t(s.labelKey),
    icon: SUBSYSTEM_ICONS[s.key],
  })),
)
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

    // 非公司 1 的用户不能进入系统中心：改为进入视频系统
    if (loginType.value && !canUseSubsystem(loginType.value, authStore.currentCompanyId())) {
      loginType.value = 'live'
      authStore.switchSystem('live')
    }
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

const goWelcome = () => {
  router.push({ name: 'welcome' })
}

onMounted(() => {
  const typeParam = route.query.type as string
  if (isSubSystem(typeParam)) {
    loginType.value = typeParam
  } else {
    // 未指定系统时沿用上次登录的系统（登录过期被带回登录页时不丢失所在系统），首次登录默认视频系统；
    // 上次是系统中心时不在选项中，按视频系统显示
    const last = getLoginType()
    loginType.value = last && last !== 'system' ? last : 'live'
  }
})
</script>

<template>
  <div class="login-page">
    <!-- 背景：网格 + 光斑（与欢迎页一致） -->
    <div class="lg-bg" aria-hidden="true">
      <div class="lg-bg__grid" />
      <div class="lg-bg__orb lg-bg__orb--a" />
      <div class="lg-bg__orb lg-bg__orb--b" />
    </div>

    <!-- 顶部：标志（回首页）+ 语言 -->
    <header class="lg-top">
      <a href="/welcome" class="lg-logo" :aria-label="t('login.backHome')" @click.prevent="goWelcome">
        <span class="lg-logo__mark"><IconVideoCamera /></span>
        <span>
          <span class="lg-logo__title">Zigebo</span>
          <span class="lg-logo__subtitle">{{ t('welcome.brandSubtitle') }}</span>
        </span>
      </a>
      <span class="lg-lang"><LanguageSwitcher /></span>
    </header>

    <main class="lg-main">
      <div class="login-card">
        <!-- 左：品牌区 -->
        <section class="login-brand">
          <div class="login-brand__glow" aria-hidden="true" />
          <div class="login-brand__intro">
            <span class="lg-badge"><i />{{ t('login.brand.badge') }}</span>
            <h1>
              {{ t('login.brand.welcome') }}
              <span class="lg-gradient-text">{{ t('login.brand.title') }}</span>
            </h1>
            <p>{{ t('login.brand.description') }}</p>
          </div>
          <div class="login-brand__systems">
            <div class="sys-card sys-card--cyan">
              <span class="sys-card__icon"><IconVideoCamera /></span>
              <span>
                <strong>{{ t('login.platforms.live') }}</strong>
                <small>{{ t('login.brand.liveDesc') }}</small>
              </span>
            </div>
            <div class="sys-card sys-card--violet">
              <span class="sys-card__icon"><IconCloud /></span>
              <span>
                <strong>{{ t('login.platforms.cloud') }}</strong>
                <small>{{ t('login.brand.cloudDesc') }}</small>
              </span>
            </div>
          </div>
        </section>

        <!-- 右：登录表单 -->
        <section class="login-form">
          <h2>{{ t('login.formTitle') }}</h2>
          <p class="login-form__subtitle">{{ t('login.formSubtitle') }}</p>

          <!-- 子系统切换 -->
          <div
            class="subsystem-switch"
            role="radiogroup"
            :aria-label="t('login.switchSystem')"
            :style="{ gridTemplateColumns: `repeat(${subsystemOptions.length}, minmax(0, 1fr))` }"
          >
            <button
              v-for="opt in subsystemOptions"
              :key="opt.value"
              type="button"
              role="radio"
              :aria-checked="(loginType || 'live') === opt.value"
              :class="['subsystem-switch__item', { 'is-active': (loginType || 'live') === opt.value }]"
              @click="selectSubsystem(opt.value)"
            >
              <component :is="opt.icon" />
              {{ opt.label }}
            </button>
          </div>

          <a-form :model="form" :rules="rules" layout="vertical" class="lg-form" @submit="handleSubmit">
            <a-form-item field="username" :label="t('login.fields.username')">
              <a-input v-model="form.username" :placeholder="t('login.fields.placeholder.username')">
                <template #prefix><IconUser /></template>
              </a-input>
            </a-form-item>
            <a-form-item field="password" :label="t('login.fields.password')">
              <a-input-password v-model="form.password" :placeholder="t('login.fields.placeholder.password')" allow-clear>
                <template #prefix><IconLock /></template>
              </a-input-password>
            </a-form-item>
            <button type="submit" class="lg-submit" :disabled="submitting">
              <span v-if="submitting" class="lg-submit__spinner" aria-hidden="true" />
              {{ t('login.button') }}
            </button>
          </a-form>

          <div class="register-link">
            <span>{{ t('login.noAccount') }}</span>
            <a href="/company-register" @click.prevent="goRegister">{{ t('login.register') }}</a>
          </div>
        </section>
      </div>
    </main>

    <footer class="lg-footer">{{ t('welcome.footer.copyright') }}</footer>
  </div>
</template>

<style scoped>
.login-page {
  --lg-bg: #05070f;
  --lg-border: rgba(148, 163, 255, 0.18);
  --lg-text: #e8ecf8;
  --lg-text-2: #a3acc6;
  --lg-text-3: #6b7592;
  --lg-cyan: #22d3ee;
  --lg-violet: #a78bfa;
  --lg-gradient: linear-gradient(120deg, #22d3ee 0%, #3b82f6 45%, #a78bfa 100%);
  --lg-font: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif;
  --lg-font-mono: 'Bahnschrift', 'DIN Alternate', 'Segoe UI', system-ui, sans-serif;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
  background: var(--lg-bg);
  color: var(--lg-text);
  font-family: var(--lg-font);
  font-size: 15px;
}

/* 背景 */
.lg-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.lg-bg__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(120, 140, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 140, 255, 0.07) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 45%, #000 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 45%, #000 30%, transparent 80%);
}
.lg-bg__orb { position: absolute; border-radius: 50%; filter: blur(110px); }
.lg-bg__orb--a { width: 520px; height: 520px; top: -140px; left: -120px; background: #1d4ed8; opacity: 0.5; animation: lg-float 14s ease-in-out infinite; }
.lg-bg__orb--b { width: 480px; height: 480px; bottom: -160px; right: -120px; background: #7c3aed; opacity: 0.45; animation: lg-float 18s ease-in-out infinite reverse; }
@keyframes lg-float { 50% { transform: translate(40px, 30px); } }
@keyframes lg-pulse { 50% { opacity: 0.35; } }
@keyframes lg-spin { to { transform: rotate(360deg); } }

/* 顶部 */
.lg-top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; padding: 20px 32px; }
.lg-logo { display: flex; align-items: center; gap: 10px; color: var(--lg-text); text-decoration: none; }
.lg-logo__mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--lg-gradient);
  color: #fff;
  font-size: 18px;
  box-shadow: 0 0 22px rgba(59, 130, 246, 0.5);
}
.lg-logo__title { display: block; font-family: var(--lg-font-mono); font-size: 18px; font-weight: 700; line-height: 1.1; }
.lg-logo__subtitle { display: block; color: var(--lg-text-3); font-size: 12px; }
.lg-logo:focus-visible { outline: 2px solid var(--lg-cyan); outline-offset: 4px; border-radius: 8px; }
.lg-lang :deep(.arco-btn) {
  height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 255, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--lg-text-2);
}
.lg-lang :deep(.arco-btn:hover) { border-color: rgba(34, 211, 238, 0.5); background: rgba(34, 211, 238, 0.08); color: #fff; }

/* 卡片 */
.lg-main { position: relative; z-index: 1; flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px 24px 56px; }
.login-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  width: 100%;
  max-width: 960px;
  overflow: hidden;
  border: 1px solid var(--lg-border);
  border-radius: 24px;
  background: rgba(12, 16, 34, 0.72);
  backdrop-filter: blur(18px);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6), 0 0 80px rgba(59, 130, 246, 0.18);
}

/* 品牌区 */
.login-brand {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 44px 40px;
  overflow: hidden;
  border-right: 1px solid rgba(148, 163, 255, 0.14);
  background: linear-gradient(160deg, rgba(29, 78, 216, 0.32), rgba(124, 58, 237, 0.26));
}
.login-brand__glow { position: absolute; top: -120px; right: -120px; width: 300px; height: 300px; border-radius: 50%; background: var(--lg-cyan); filter: blur(90px); opacity: 0.28; }
.login-brand__intro { position: relative; }
.lg-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border: 1px solid rgba(34, 211, 238, 0.35);
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.08);
  color: #a5f3fc;
  font-size: 12px;
  font-weight: 600;
}
.lg-badge i { width: 6px; height: 6px; border-radius: 50%; background: var(--lg-cyan); box-shadow: 0 0 8px var(--lg-cyan); animation: lg-pulse 1.6s infinite; }
.login-brand h1 { margin: 18px 0 10px; font-size: 34px; line-height: 1.2; font-weight: 900; }
.lg-gradient-text { display: block; background: var(--lg-gradient); -webkit-background-clip: text; background-clip: text; color: transparent; }
.login-brand p { margin: 0; color: var(--lg-text-2); line-height: 1.75; }
.login-brand__systems { position: relative; display: flex; flex-direction: column; gap: 12px; }
.sys-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid; border-radius: 14px; background: rgba(5, 7, 15, 0.4); }
.sys-card--cyan { border-color: rgba(34, 211, 238, 0.28); }
.sys-card--violet { border-color: rgba(167, 139, 250, 0.3); }
.sys-card__icon { display: grid; place-items: center; flex-shrink: 0; width: 40px; height: 40px; border-radius: 11px; color: #fff; font-size: 20px; }
.sys-card--cyan .sys-card__icon { background: linear-gradient(135deg, #0891b2, #22d3ee); box-shadow: 0 0 20px rgba(34, 211, 238, 0.4); }
.sys-card--violet .sys-card__icon { background: linear-gradient(135deg, #6d28d9, #a78bfa); box-shadow: 0 0 20px rgba(167, 139, 250, 0.4); }
.sys-card strong { display: block; font-weight: 700; }
.sys-card small { display: block; color: var(--lg-text-2); font-size: 13px; }

/* 表单 */
.login-form { display: flex; flex-direction: column; padding: 44px 44px 36px; }
.login-form h2 { margin: 0 0 6px; font-size: 24px; font-weight: 900; }
.login-form__subtitle { margin: 0 0 24px; color: #8a93ad; font-size: 14px; }

.subsystem-switch {
  display: grid;
  gap: 6px;
  margin-bottom: 24px;
  padding: 5px;
  border: 1px solid rgba(148, 163, 255, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}
.subsystem-switch__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--lg-text-2);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s, box-shadow 0.2s;
}
.subsystem-switch__item:hover { color: #fff; }
.subsystem-switch__item.is-active {
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.22), rgba(59, 130, 246, 0.22));
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.45) inset, 0 0 18px rgba(34, 211, 238, 0.18);
  color: #fff;
  font-weight: 700;
}
.subsystem-switch__item.is-active svg { color: #67e8f9; }
.subsystem-switch__item:focus-visible { outline: 2px solid var(--lg-cyan); outline-offset: 2px; }

/* Arco 表单深色化 */
.lg-form :deep(.arco-form-item) { margin-bottom: 18px; }
.lg-form :deep(.arco-form-item-label-col > label),
.lg-form :deep(.arco-form-item-label) { color: #c7cfe6; font-size: 13px; font-weight: 600; }
.lg-form :deep(.arco-form-item-label-required-symbol) { color: #f87171; }
.lg-form :deep(.arco-input-wrapper) {
  height: 46px;
  padding: 0 14px;
  border: 1px solid rgba(148, 163, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.lg-form :deep(.arco-input-wrapper:hover) { border-color: rgba(148, 163, 255, 0.35); background: rgba(255, 255, 255, 0.05); }
.lg-form :deep(.arco-input-wrapper.arco-input-focus) {
  border-color: rgba(34, 211, 238, 0.7);
  background: rgba(34, 211, 238, 0.06);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.15);
}
.lg-form :deep(.arco-input-wrapper.arco-input-error) { border-color: rgba(248, 113, 113, 0.7); background: rgba(248, 113, 113, 0.06); }
.lg-form :deep(.arco-input) { color: var(--lg-text); font-size: 14px; }
.lg-form :deep(.arco-input::placeholder) { color: #5b6580; }
.lg-form :deep(.arco-input-prefix),
.lg-form :deep(.arco-input-suffix) { color: var(--lg-text-3); }
.lg-form :deep(.arco-form-item-message) { color: #fca5a5; }

.lg-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 50px;
  margin-top: 8px;
  border: 0;
  border-radius: 12px;
  background: var(--lg-gradient);
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  box-shadow: 0 10px 32px rgba(59, 130, 246, 0.5);
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}
.lg-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 36px rgba(167, 139, 250, 0.55); }
.lg-submit:disabled { opacity: 0.7; cursor: wait; }
.lg-submit:focus-visible { outline: 2px solid var(--lg-cyan); outline-offset: 2px; }
.lg-submit__spinner { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.4); border-top-color: #fff; border-radius: 50%; animation: lg-spin 0.8s linear infinite; }

.register-link { display: flex; justify-content: center; gap: 4px; margin-top: 20px; color: var(--lg-text-3); font-size: 13px; }
.register-link a { color: #67e8f9; text-decoration: none; }
.register-link a:hover { color: #fff; }

.lg-footer { position: relative; z-index: 1; padding: 0 24px 22px; color: #4b5470; font-size: 12px; text-align: center; }

@media (prefers-reduced-motion: reduce) {
  .lg-bg__orb, .lg-badge i, .lg-submit__spinner { animation: none; }
}

/* 窄屏：只保留登录表单 */
@media (max-width: 860px) {
  .login-brand { display: none; }
  .login-card { grid-template-columns: minmax(0, 1fr); max-width: 440px; }
}
@media (max-width: 480px) {
  .lg-top { padding: 16px; }
  .lg-main { padding: 8px 16px 40px; }
  .login-form { padding: 32px 24px 28px; }
}
</style>
