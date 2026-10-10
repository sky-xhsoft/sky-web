<script setup lang="ts">
/**
 * 欢迎页（深色科技风）：介绍视频系统与云盘系统，统一从「登录」进入（登录页可切换系统，登录后右上角也可切换），
 * 不再让用户先选择平台；系统中心仅公司 1 使用，不在此展示
 */
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../../components/LanguageSwitcher.vue'
import {
  IconVideoCamera,
  IconCloud,
  IconArrowRight,
  IconCheckCircleFill,
  IconDashboard,
  IconPlayCircle,
  IconShareAlt,
  IconScissor,
  IconRecord,
  IconFolder,
  IconFile,
  IconFilePdf,
  IconUpload,
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const { t } = useI18n()

const goToLogin = () => router.push({ name: 'login' })
const goToRegister = () => router.push('/company-register')

const products = [
  { key: 'live', icon: IconVideoCamera, tone: 'cyan' },
  { key: 'cloud', icon: IconCloud, tone: 'violet' },
] as const

const features = [
  { key: 'liveStreamManagement', icon: IconPlayCircle },
  { key: 'liveRecording', icon: IconRecord },
  { key: 'liveClips', icon: IconScissor },
  { key: 'socialDistribution', icon: IconShareAlt },
  { key: 'domainManagement', icon: IconDashboard },
  { key: 'cloudStorage', icon: IconCloud },
] as const

/** 产品要点（语言包中为 3 项数组，按下标读取） */
const productFeatures = (key: string): string[] => [0, 1, 2].map((i) => t(`welcome.products.${key}.features.${i}`))

// 直播码率示意曲线（装饰）
const bitratePath = 'M0,34 L14,28 L28,31 L42,20 L56,24 L70,14 L84,18 L98,9 L112,15 L126,7 L140,12 L154,5 L168,10 L182,6 L196,11 L210,4'
</script>

<template>
  <div class="welcome-page">
    <!-- 背景：网格 + 发光光斑 -->
    <div class="tech-bg" aria-hidden="true">
      <div class="tech-bg__grid" />
      <div class="tech-bg__orb tech-bg__orb--a" />
      <div class="tech-bg__orb tech-bg__orb--b" />
      <div class="tech-bg__orb tech-bg__orb--c" />
    </div>

    <!-- 导航 -->
    <header class="wl-nav">
      <div class="wl-container wl-nav__inner">
        <div class="wl-brand">
          <div class="wl-brand__logo"><IconVideoCamera /></div>
          <div>
            <div class="wl-brand__title">{{ t('welcome.brandTitle') }}</div>
            <div class="wl-brand__subtitle">{{ t('welcome.brandSubtitle') }}</div>
          </div>
        </div>
        <nav class="wl-nav__links" :aria-label="t('welcome.brandTitle')">
          <a href="#products">{{ t('welcome.nav.products') }}</a>
          <a href="#features">{{ t('welcome.nav.features') }}</a>
        </nav>
        <div class="wl-nav__actions">
          <span class="wl-lang"><LanguageSwitcher /></span>
          <button type="button" class="wl-btn wl-btn--text wl-register" @click="goToRegister">{{ t('welcome.nav.register') }}</button>
          <button type="button" class="wl-btn wl-btn--glow" @click="goToLogin">{{ t('welcome.nav.login') }}</button>
        </div>
      </div>
    </header>

    <main class="wl-main">
      <!-- Hero -->
      <section class="hero-section">
        <div class="wl-container hero">
          <div class="hero__text">
            <span class="hero__badge"><i />{{ t('welcome.heroBadge') }}</span>
            <h1 class="hero__title">
              {{ t('welcome.heroTitle') }}
              <span class="hero__title-gradient">{{ t('welcome.heroTitleGradient') }}</span>
            </h1>
            <p class="hero__desc">{{ t('welcome.heroDescription') }}</p>
            <div class="hero__actions">
              <button type="button" class="wl-btn wl-btn--glow wl-btn--lg" @click="goToLogin">
                {{ t('welcome.heroButtons.login') }}
                <IconArrowRight />
              </button>
              <button type="button" class="wl-btn wl-btn--outline wl-btn--lg" @click="goToRegister">
                {{ t('welcome.heroButtons.register') }}
              </button>
            </div>
          </div>

          <!-- 产品界面示意（装饰） -->
          <div class="console-wrap" aria-hidden="true">
            <div class="console">
              <div class="console__bar">
                <span class="dot red" /><span class="dot yellow" /><span class="dot green" />
                <span class="console__url">zigebo · {{ t('welcome.products.live.title') }}</span>
              </div>
              <div class="console__body">
                <div class="stream">
                  <div class="stream__scan" />
                  <IconPlayCircle class="stream__play" />
                  <div class="stream__row">
                    <span class="chip chip--live"><i />{{ t('welcome.heroPreview.live') }}</span>
                    <span class="chip chip--mono">1080P · 60fps</span>
                  </div>
                  <div class="stream__row">
                    <span class="stream__title">{{ t('welcome.heroPreview.liveRoom') }}</span>
                    <span class="chip chip--rec"><i />{{ t('welcome.heroPreview.recording') }}</span>
                  </div>
                </div>
                <div class="side">
                  <div class="panel">
                    <div class="panel__label">BITRATE</div>
                    <svg viewBox="0 0 210 40" class="panel__chart" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="wl-line" x1="0" x2="1">
                          <stop offset="0" stop-color="#22d3ee" />
                          <stop offset="1" stop-color="#a78bfa" />
                        </linearGradient>
                        <linearGradient id="wl-fill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0" stop-color="#22d3ee" stop-opacity="0.35" />
                          <stop offset="1" stop-color="#22d3ee" stop-opacity="0" />
                        </linearGradient>
                      </defs>
                      <path :d="`${bitratePath} L210,40 L0,40 Z`" fill="url(#wl-fill)" />
                      <path :d="bitratePath" fill="none" stroke="url(#wl-line)" stroke-width="2" />
                    </svg>
                  </div>
                  <div class="panel">
                    <div class="panel__label">DISTRIBUTION</div>
                    <div class="targets"><span>Facebook</span><span>YouTube</span><span>Instagram</span></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 云盘浮层 -->
            <div class="drive">
              <div class="drive__head"><IconCloud /> {{ t('welcome.heroPreview.cloud') }}</div>
              <ul class="drive__files">
                <li><IconFolder class="ic folder" /><span>2026 新品发布会</span><em>—</em></li>
                <li><IconFile class="ic video" /><span>live_record_0918.mp4</span><em>4.8 GB</em></li>
                <li><IconFilePdf class="ic doc" /><span>活动方案.pdf</span><em>2.1 MB</em></li>
              </ul>
              <div class="drive__upload">
                <IconUpload />
                <div class="progress"><i /></div>
              </div>
              <div class="drive__note"><IconCheckCircleFill />{{ t('welcome.heroPreview.saved') }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 两大系统 -->
      <section id="products" class="wl-section wl-section--products">
        <div class="wl-container">
          <div class="wl-section__head">
            <span class="eyebrow">PRODUCTS</span>
            <h2>{{ t('welcome.products.title') }}</h2>
            <p>{{ t('welcome.products.subtitle') }}</p>
          </div>
          <div class="products">
            <article v-for="p in products" :key="p.key" :class="['product', `product--${p.tone}`]">
              <div class="product__glow" />
              <div :class="['product__icon', p.tone]"><component :is="p.icon" /></div>
              <h3>{{ t(`welcome.products.${p.key}.title`) }}</h3>
              <p>{{ t(`welcome.products.${p.key}.description`) }}</p>
              <ul>
                <li v-for="item in productFeatures(p.key)" :key="item"><IconCheckCircleFill />{{ item }}</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <!-- 核心功能 -->
      <section id="features" class="wl-section wl-section--features">
        <div class="wl-container">
          <div class="wl-section__head">
            <span class="eyebrow">FEATURES</span>
            <h2>{{ t('welcome.features.title') }}</h2>
            <p>{{ t('welcome.features.subtitle') }}</p>
          </div>
          <div class="features">
            <div v-for="f in features" :key="f.key" class="feature">
              <div class="feature__icon"><component :is="f.icon" /></div>
              <h3>{{ t(`welcome.features.${f.key}.title`) }}</h3>
              <p>{{ t(`welcome.features.${f.key}.description`) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 行动号召 -->
      <section class="wl-section wl-section--cta">
        <div class="wl-container">
          <div class="cta">
            <div class="cta__glow" aria-hidden="true" />
            <h2>{{ t('welcome.cta.title') }}</h2>
            <p>{{ t('welcome.cta.description') }}</p>
            <div class="cta__actions">
              <button type="button" class="wl-btn wl-btn--glow wl-btn--lg" @click="goToLogin">{{ t('welcome.cta.loginButton') }}</button>
              <button type="button" class="wl-btn wl-btn--outline wl-btn--lg" @click="goToRegister">{{ t('welcome.cta.registerButton') }}</button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="wl-footer">
      <div class="wl-container wl-footer__inner">
        <div class="wl-brand wl-brand--small">
          <div class="wl-brand__logo"><IconVideoCamera /></div>
          <span>{{ t('welcome.footer.brandText') }}</span>
        </div>
        <span>{{ t('welcome.footer.copyright') }}</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.welcome-page {
  --wl-bg: #05070f;
  --wl-surface: rgba(255, 255, 255, 0.04);
  --wl-surface-2: rgba(255, 255, 255, 0.07);
  --wl-border: rgba(148, 163, 255, 0.16);
  --wl-text: #e8ecf8;
  --wl-text-2: #a3acc6;
  --wl-text-3: #6b7592;
  --wl-cyan: #22d3ee;
  --wl-violet: #a78bfa;
  --wl-gradient: linear-gradient(120deg, #22d3ee 0%, #3b82f6 45%, #a78bfa 100%);
  /* 中文用系统字体；数字与英文用几何无衬线（不加载外部字体，国内网络下 Google Fonts 不稳定） */
  --wl-font: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif;
  --wl-font-mono: 'Bahnschrift', 'DIN Alternate', 'Segoe UI', system-ui, sans-serif;
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  background: var(--wl-bg);
  color: var(--wl-text);
  font-family: var(--wl-font);
  font-size: 15px;
}

.wl-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}

/* 背景 */
.tech-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.tech-bg__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(120, 140, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 140, 255, 0.07) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 80% 40% at 50% 0%, #000 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 40% at 50% 0%, #000 30%, transparent 75%);
}
.tech-bg__orb { position: absolute; border-radius: 50%; filter: blur(110px); }
.tech-bg__orb--a { width: 520px; height: 520px; top: -160px; left: -120px; background: #1d4ed8; opacity: 0.5; animation: wl-float 14s ease-in-out infinite; }
.tech-bg__orb--b { width: 460px; height: 460px; top: 40px; right: -140px; background: #7c3aed; opacity: 0.45; animation: wl-float 18s ease-in-out infinite reverse; }
.tech-bg__orb--c { width: 420px; height: 420px; top: 1300px; left: 35%; background: #0891b2; opacity: 0.25; filter: blur(120px); }
@keyframes wl-float { 50% { transform: translate(40px, 30px); } }
@keyframes wl-pulse { 50% { opacity: 0.35; } }
@keyframes wl-scan { from { top: -40%; } to { top: 100%; } }
@keyframes wl-progress { 0% { width: 18%; } 70%, 100% { width: 92%; } }

/* 按钮 */
.wl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: 10px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s, border-color 0.2s, color 0.2s;
}
.wl-btn--lg { height: 50px; padding: 0 28px; border-radius: 12px; font-size: 16px; }
.wl-btn--glow { background: var(--wl-gradient); color: #fff; box-shadow: 0 8px 28px rgba(59, 130, 246, 0.45); }
.wl-btn--glow:hover { transform: translateY(-1px); box-shadow: 0 12px 36px rgba(167, 139, 250, 0.55); }
.wl-btn--outline { border-color: rgba(148, 163, 255, 0.22); background: rgba(255, 255, 255, 0.04); color: var(--wl-text); font-weight: 600; }
.wl-btn--outline:hover { border-color: rgba(34, 211, 238, 0.6); background: rgba(34, 211, 238, 0.08); color: #fff; }
.wl-btn--text { height: 36px; padding: 0 14px; background: transparent; color: var(--wl-text-2); font-weight: 600; }
.wl-btn--text:hover { color: #fff; }
.wl-btn:focus-visible { outline: 2px solid var(--wl-cyan); outline-offset: 2px; }

/* 导航 */
.wl-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(5, 7, 15, 0.72);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(148, 163, 255, 0.1);
}
.wl-nav__inner { display: flex; align-items: center; gap: 24px; height: 68px; }
.wl-brand { display: flex; align-items: center; gap: 10px; }
.wl-brand__logo {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--wl-gradient);
  color: #fff;
  font-size: 18px;
  box-shadow: 0 0 22px rgba(59, 130, 246, 0.5);
  flex-shrink: 0;
}
.wl-brand__title { font-family: var(--wl-font-mono); font-size: 18px; font-weight: 700; line-height: 1.1; letter-spacing: 0.3px; }
.wl-brand__subtitle { font-size: 12px; color: var(--wl-text-3); }
.wl-nav__links { display: flex; gap: 28px; margin-left: 24px; }
.wl-nav__links a { color: var(--wl-text-2); text-decoration: none; font-size: 14px; transition: color 0.2s; }
.wl-nav__links a:hover { color: #fff; }
.wl-nav__actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.wl-lang :deep(.arco-btn) {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--wl-border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--wl-text-2);
}
.wl-lang :deep(.arco-btn:hover) { border-color: rgba(34, 211, 238, 0.5); background: rgba(34, 211, 238, 0.08); color: #fff; }

/* Hero */
.wl-main { position: relative; z-index: 1; }
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
  align-items: center;
  gap: 64px;
  padding-top: 56px;
  padding-bottom: 72px;
}
.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid rgba(34, 211, 238, 0.35);
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.08);
  color: #a5f3fc;
  font-size: 13px;
  font-weight: 600;
}
.hero__badge i { width: 7px; height: 7px; border-radius: 50%; background: var(--wl-cyan); box-shadow: 0 0 10px var(--wl-cyan); animation: wl-pulse 1.6s infinite; }
.hero__title { margin: 20px 0 16px; font-size: 56px; line-height: 1.14; font-weight: 900; letter-spacing: -0.5px; }
.hero__title-gradient {
  display: block;
  background: var(--wl-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero__desc { margin: 0 0 28px; max-width: 520px; color: var(--wl-text-2); font-size: 17px; line-height: 1.8; }
.hero__actions { display: flex; flex-wrap: wrap; gap: 14px; }

/* 产品界面示意 */
.console-wrap { position: relative; padding-bottom: 150px; }
.console {
  padding: 14px;
  border: 1px solid rgba(148, 163, 255, 0.18);
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(20, 28, 54, 0.95), rgba(10, 14, 30, 0.95));
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55), 0 0 70px rgba(59, 130, 246, 0.2);
}
.console__bar { display: flex; align-items: center; gap: 7px; padding: 2px 4px 12px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.red { background: #ff5f57; }
.dot.yellow { background: #febc2e; }
.dot.green { background: #28c840; }
.console__url { margin-left: 10px; padding: 3px 12px; border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--wl-text-3); font-size: 12px; }
.console__body { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 12px; }

.stream {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 220px;
  padding: 12px;
  overflow: hidden;
  border-radius: 12px;
  background:
    radial-gradient(circle at 30% 35%, rgba(34, 211, 238, 0.38), transparent 45%),
    radial-gradient(circle at 75% 70%, rgba(167, 139, 250, 0.42), transparent 50%),
    linear-gradient(135deg, #0b1734, #1b1244);
}
.stream__scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, transparent, rgba(34, 211, 238, 0.12), transparent);
  animation: wl-scan 4s linear infinite;
}
.stream__play { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 54px; color: rgba(255, 255, 255, 0.9); filter: drop-shadow(0 0 16px rgba(34, 211, 238, 0.7)); }
.stream__row { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.stream__title { font-size: 13px; font-weight: 700; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(5, 7, 15, 0.55);
  color: var(--wl-text-2);
  font-size: 11px;
  font-weight: 700;
}
.chip i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.chip--mono { font-family: var(--wl-font-mono); font-weight: 600; }
.chip--live { border-color: rgba(255, 107, 107, 0.45); color: #ff8a8a; }
.chip--live i { background: #ff6b6b; box-shadow: 0 0 8px #ff6b6b; animation: wl-pulse 1.4s infinite; }
.chip--rec { border-color: rgba(251, 191, 36, 0.45); color: #fcd34d; }
.chip--rec i { background: #fbbf24; }

.side { display: flex; flex-direction: column; gap: 12px; }
.panel { padding: 12px; border: 1px solid var(--wl-border); border-radius: 12px; background: var(--wl-surface); }
.panel__label { margin-bottom: 8px; color: var(--wl-text-3); font-family: var(--wl-font-mono); font-size: 11px; letter-spacing: 1px; }
.panel__chart { display: block; width: 100%; height: 60px; }
.targets { display: flex; flex-wrap: wrap; gap: 6px; }
.targets span {
  padding: 4px 9px;
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 6px;
  background: rgba(34, 211, 238, 0.07);
  color: #a5f3fc;
  font-size: 11px;
  font-weight: 600;
}

.drive {
  position: absolute;
  right: -36px;
  bottom: -8px;
  width: 300px;
  padding: 14px;
  border: 1px solid rgba(167, 139, 250, 0.4);
  border-radius: 14px;
  background: rgba(16, 18, 40, 0.94);
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.28);
  box-sizing: border-box;
}
.drive__head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #ddd6fe; font-size: 13px; font-weight: 700; }
.drive__files { display: flex; flex-direction: column; gap: 8px; margin: 0 0 12px; padding: 0; list-style: none; }
.drive__files li { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; align-items: center; gap: 8px; color: var(--wl-text-2); font-size: 12px; }
.drive__files span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drive__files em { color: var(--wl-text-3); font-size: 11px; font-style: normal; font-family: var(--wl-font-mono); }
.ic { font-size: 15px; }
.ic.folder { color: #fbbf24; }
.ic.video { color: var(--wl-violet); }
.ic.doc { color: #f87171; }
.drive__upload { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: var(--wl-cyan); font-size: 15px; }
.progress { flex: 1; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
.progress i { display: block; width: 68%; height: 100%; border-radius: 3px; background: var(--wl-gradient); box-shadow: 0 0 10px rgba(34, 211, 238, 0.7); animation: wl-progress 3.2s ease-in-out infinite; }
.drive__note { display: flex; align-items: center; gap: 6px; color: #6ee7b7; font-size: 11px; }

/* 区块 */
.wl-section--products { padding: 48px 0 40px; }
.wl-section--features { padding: 40px 0 48px; }
.wl-section--cta { padding: 8px 0 56px; }
.wl-section__head { max-width: 660px; margin: 0 auto 32px; text-align: center; }
.eyebrow { display: inline-block; margin-bottom: 12px; color: var(--wl-cyan); font-family: var(--wl-font-mono); font-size: 12px; font-weight: 700; letter-spacing: 3px; }
.wl-section__head h2 { margin: 0 0 12px; font-size: 36px; font-weight: 900; }
.wl-section__head p { margin: 0; color: var(--wl-text-2); font-size: 16px; }

/* 两大系统 */
.products { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.product {
  position: relative;
  overflow: hidden;
  padding: 28px 32px;
  border: 1px solid var(--wl-border);
  border-radius: 22px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015));
  transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.product:hover { transform: translateY(-4px); }
.product--cyan:hover { border-color: rgba(34, 211, 238, 0.45); box-shadow: 0 0 40px rgba(34, 211, 238, 0.12); }
.product--violet:hover { border-color: rgba(167, 139, 250, 0.45); box-shadow: 0 0 40px rgba(167, 139, 250, 0.12); }
.product__glow { position: absolute; top: -90px; right: -90px; width: 240px; height: 240px; border-radius: 50%; filter: blur(70px); opacity: 0.3; }
.product--cyan .product__glow { background: var(--wl-cyan); }
.product--violet .product__glow { background: var(--wl-violet); opacity: 0.32; }
.product__icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin-bottom: 16px;
  border-radius: 14px;
  color: #fff;
  font-size: 26px;
}
.product__icon.cyan { background: linear-gradient(135deg, #0891b2, #22d3ee); box-shadow: 0 0 26px rgba(34, 211, 238, 0.45); }
.product__icon.violet { background: linear-gradient(135deg, #6d28d9, #a78bfa); box-shadow: 0 0 26px rgba(167, 139, 250, 0.45); }
.product h3 { position: relative; margin: 0 0 10px; font-size: 24px; font-weight: 900; }
.product p { position: relative; margin: 0 0 22px; color: var(--wl-text-2); line-height: 1.75; }
.product ul { position: relative; display: flex; flex-direction: column; gap: 12px; margin: 0; padding: 0; list-style: none; }
.product li { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.product--cyan li svg { color: var(--wl-cyan); }
.product--violet li svg { color: var(--wl-violet); }

/* 核心功能 */
.features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.feature {
  padding: 20px 22px;
  border: 1px solid var(--wl-border);
  border-radius: 16px;
  background: var(--wl-surface);
  transition: border-color 0.25s, background-color 0.25s;
}
.feature:hover { border-color: rgba(59, 130, 246, 0.5); background: var(--wl-surface-2); }
.feature__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 12px;
  border: 1px solid rgba(59, 130, 246, 0.45);
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
  font-size: 20px;
  box-shadow: 0 0 18px rgba(59, 130, 246, 0.25);
}
.feature h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; }
.feature p { margin: 0; color: var(--wl-text-2); font-size: 13px; line-height: 1.7; }

/* 行动号召 */
.cta {
  position: relative;
  overflow: hidden;
  padding: 44px 32px;
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 26px;
  background: linear-gradient(140deg, rgba(29, 78, 216, 0.35), rgba(124, 58, 237, 0.3));
  text-align: center;
}
.cta__glow { position: absolute; left: -20%; right: -20%; bottom: -70%; height: 130%; background: radial-gradient(ellipse at center, rgba(34, 211, 238, 0.35), transparent 60%); }
.cta h2 { position: relative; margin: 0 0 12px; font-size: 34px; font-weight: 900; }
.cta p { position: relative; margin: 0 0 24px; color: #c7cfe6; font-size: 16px; }
.cta__actions { position: relative; display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; }
.cta .wl-btn--outline { border-color: rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.06); color: #fff; }

/* 页脚 */
.wl-footer { position: relative; z-index: 1; border-top: 1px solid rgba(148, 163, 255, 0.1); }
.wl-footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 26px;
  padding-bottom: 26px;
  color: var(--wl-text-3);
  font-size: 13px;
}
.wl-brand--small { gap: 8px; }
.wl-brand--small .wl-brand__logo { width: 26px; height: 26px; border-radius: 7px; font-size: 13px; box-shadow: none; }

@media (prefers-reduced-motion: reduce) {
  .tech-bg__orb, .stream__scan, .progress i, .chip--live i, .hero__badge i { animation: none; }
}

/* 窄屏 */
@media (max-width: 1000px) {
  .hero { grid-template-columns: minmax(0, 1fr); gap: 48px; }
  .hero__title { font-size: 42px; }
  .drive { position: relative; right: auto; bottom: auto; width: auto; margin-top: 12px; }
  .console-wrap { padding-bottom: 0; }
  .features { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .wl-container { padding: 0 16px; }
  .wl-nav__links, .wl-register { display: none; }
  .hero { padding-top: 36px; padding-bottom: 48px; }
  .hero__title { font-size: 34px; }
  .console__body, .products, .features { grid-template-columns: minmax(0, 1fr); }
  .cta { padding: 32px 20px; }
  .wl-footer__inner { flex-direction: column; align-items: flex-start; }
}
</style>
