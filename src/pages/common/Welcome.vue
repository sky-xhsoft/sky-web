<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../../components/LanguageSwitcher.vue'
import {
  IconVideoCamera,
  IconCloud,
  IconApps,
  IconStorage,
  IconArrowRight,
  IconPlayCircle,
  IconCheck,
  IconDashboard,
  IconShareAlt,
  IconScissor,
  IconRecord,
  IconGithub,
  IconTwitter,
  IconWechat,
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const { t } = useI18n()
let selectedPlatform = ''

const goToLogin = (p:string) => {
  router.push(`/login?type=${p}`)
}

const goToRegister = () => {
  router.push('/company-register')
}

</script>

<template>
  <div class="welcome-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-gradient"></div>
      <div class="floating-shapes">
        <div class="floating-shape"></div>
        <div class="floating-shape"></div>
        <div class="floating-shape"></div>
      </div>
    </div>

    <!-- 导航栏 -->
    <nav class="nav-bar">
      <div class="nav-container">
        <div class="nav-content">
          <div class="nav-brand">
            <div class="nav-logo">
              <icon-storage class="nav-logo-icon" />
            </div>
            <div class="nav-brand-text">
              <h1 class="nav-title">{{ t('welcome.brandTitle') }}</h1>
              <p class="nav-subtitle">{{ t('welcome.brandSubtitle') }}</p>
            </div>
          </div>
          <div class="nav-links">
            <a href="#features" class="nav-link">{{ t('welcome.navLinks.features') }}</a>
            <a href="#platforms" class="nav-link">{{ t('welcome.navLinks.platforms') }}</a>
            <a href="#stats" class="nav-link">{{ t('welcome.navLinks.stats') }}</a>
          </div>
          <div class="nav-actions">
            <a @click="goToRegister" class="register-btn">{{ t('login.register') }}</a>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- Hero 区域 -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-left">
            <div class="hero-badge">
              <span class="hero-badge-dot"></span>
              <span class="hero-badge-text">{{ t('welcome.heroBadge') }}</span>
            </div>
            <h2 class="hero-title">
              {{ t('welcome.heroTitle') }}
              <span class="hero-title-gradient">{{ t('welcome.heroTitleGradient') }}</span>
            </h2>
            <p class="hero-description">{{ t('welcome.heroDescription') }}</p>
            <div class="hero-buttons">
              <button @click="goToLogin('live')" class="btn btn-primary btn-lg">
                <span>{{ t('welcome.heroButtons.start') }}</span>
                <icon-arrow-right class="btn-icon" />
              </button>
              <button class="btn btn-secondary btn-lg">
                <icon-play-circle class="btn-icon" />
                <span>{{ t('welcome.heroButtons.demo') }}</span>
              </button>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-card-glow"></div>
            <div class="hero-card">
              <div class="hero-card-header">
                <div class="hero-card-dot red"></div>
                <div class="hero-card-dot yellow"></div>
                <div class="hero-card-dot green"></div>
              </div>
              <div class="hero-card-body">
                <div class="hero-card-item gray">
                  <div class="hero-card-item-icon gradient">
                    <IconVideoCamera class="icon-lg" />
                  </div>
                  <div class="hero-card-item-content">
                    <div class="hero-card-item-line w-32 mb-2"></div>
                    <div class="hero-card-item-line w-48"></div>
                  </div>
                  <div class="hero-card-item-status">
                    <span class="status-dot"></span>
                  </div>
                </div>
                <div class="hero-card-item blue">
                  <div class="hero-card-item-icon blue-gradient">
                    <IconCloud class="icon-lg" />
                  </div>
                  <div class="hero-card-item-content">
                    <div class="hero-card-item-line blue w-40 mb-2"></div>
                    <div class="hero-card-item-line blue w-56"></div>
                  </div>
                  <div class="hero-card-item-label">128GB</div>
                </div>
                <div class="hero-card-item purple">
                  <div class="hero-card-item-icon purple-gradient">
                    <IconApps class="icon-lg" />
                  </div>
                  <div class="hero-card-item-content">
                    <div class="hero-card-item-line purple w-36 mb-2"></div>
                    <div class="hero-card-item-line purple w-44"></div>
                  </div>
                  <div class="hero-card-item-avatars">
                    <div class="avatar red"></div>
                    <div class="avatar blue"></div>
                    <div class="avatar pink"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 产品平台选择 -->
      <section id="platforms" class="platforms-section">
        <div class="platforms-header">
          <h3 class="section-title">{{ t('welcome.platforms.title') }}</h3>
          <p class="section-description">{{ t('welcome.platforms.subtitle') }}</p>
        </div>
        <div class="platforms-grid">
          <div
            class="platform-card"
            :class="{ active: selectedPlatform === 'live' }"
          >
            <div class="platform-icon red-gradient">
              <IconVideoCamera class="icon-xl" />
            </div>
            <h4 class="platform-title">{{ t('welcome.platforms.liveCenter.title') }}</h4>
            <p class="platform-description">{{ t('welcome.platforms.liveCenter.description') }}</p>
            <ul class="platform-features">
              <li class="platform-feature">
                <icon-check class="check-icon" />
                {{ t('welcome.platforms.liveCenter.features.0') }}
              </li>
              <li class="platform-feature">
                <icon-check class="check-icon" />
                {{ t('welcome.platforms.liveCenter.features.1') }}
              </li>
              <li class="platform-feature">
                <icon-check class="check-icon" />
                {{ t('welcome.platforms.liveCenter.features.2') }}
              </li>
            </ul>
            <button
              @click="goToLogin('live')"
              class="platform-btn"
              :class="{ primary: selectedPlatform === 'live' }"
            >
              {{ t('welcome.platforms.liveCenter.button') }}
            </button>
          </div>

          <div
            class="platform-card"
            :class="{ active: selectedPlatform === 'cloud' }"
          >
            <div class="platform-icon green-blue-gradient">
              <IconCloud class="icon-xl" />
            </div>
            <h4 class="platform-title">{{ t('welcome.platforms.cloudCenter.title') }}</h4>
            <p class="platform-description">{{ t('welcome.platforms.cloudCenter.description') }}</p>
            <ul class="platform-features">
              <li class="platform-feature">
                <icon-check class="check-icon" />
                {{ t('welcome.platforms.cloudCenter.features.0') }}
              </li>
              <li class="platform-feature">
                <icon-check class="check-icon" />
                {{ t('welcome.platforms.cloudCenter.features.1') }}
              </li>
              <li class="platform-feature">
                <icon-check class="check-icon" />
                {{ t('welcome.platforms.cloudCenter.features.2') }}
              </li>
            </ul>
            <button
              @click="goToLogin('cloud')"
              class="platform-btn"
              :class="{ primary: selectedPlatform === 'cloud' }"
            >
              {{ t('welcome.platforms.cloudCenter.button') }}
            </button>
          </div>

          <div
            class="platform-card"
            :class="{ active: selectedPlatform === 'system' }"
          >
            <div class="platform-icon purple-pink-gradient">
              <IconApps class="icon-xl" />
            </div>
            <h4 class="platform-title">{{ t('welcome.platforms.systemCenter.title') }}</h4>
            <p class="platform-description">{{ t('welcome.platforms.systemCenter.description') }}</p>
            <ul class="platform-features">
              <li class="platform-feature">
                <icon-check class="check-icon" />
                {{ t('welcome.platforms.systemCenter.features.0') }}
              </li>
              <li class="platform-feature">
                <icon-check class="check-icon" />
                {{ t('welcome.platforms.systemCenter.features.1') }}
              </li>
              <li class="platform-feature">
                <icon-check class="check-icon" />
                {{ t('welcome.platforms.systemCenter.features.2') }}
              </li>
            </ul>
            <button
              @click="goToLogin('system')"
              class="platform-btn"
              :class="{ primary: selectedPlatform === 'system' }"
            >
              {{ t('welcome.platforms.systemCenter.button') }}
            </button>
          </div>
        </div>
      </section>

      <!-- 功能特性 -->
      <section id="features" class="features-section">
        <div class="features-header">
          <h3 class="section-title">{{ t('welcome.features.title') }}</h3>
          <p class="section-description">{{ t('welcome.features.subtitle') }}</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon blue-gradient">
              <icon-dashboard class="icon-lg" />
            </div>
            <h4 class="feature-title">{{ t('welcome.features.domainManagement.title') }}</h4>
            <p class="feature-description">{{ t('welcome.features.domainManagement.description') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon pink-gradient">
              <icon-play-circle class="icon-lg" />
            </div>
            <h4 class="feature-title">{{ t('welcome.features.liveStreamManagement.title') }}</h4>
            <p class="feature-description">{{ t('welcome.features.liveStreamManagement.description') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon cyan-gradient">
              <icon-share-alt class="icon-lg" />
            </div>
            <h4 class="feature-title">{{ t('welcome.features.socialDistribution.title') }}</h4>
            <p class="feature-description">{{ t('welcome.features.socialDistribution.description') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon orange-gradient">
              <icon-scissor class="icon-lg" />
            </div>
            <h4 class="feature-title">{{ t('welcome.features.liveClips.title') }}</h4>
            <p class="feature-description">{{ t('welcome.features.liveClips.description') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon green-gradient">
              <icon-record class="icon-lg" />
            </div>
            <h4 class="feature-title">{{ t('welcome.features.liveRecording.title') }}</h4>
            <p class="feature-description">{{ t('welcome.features.liveRecording.description') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon purple-indigo-gradient">
              <IconCloud class="icon-lg" />
            </div>
            <h4 class="feature-title">{{ t('welcome.features.cloudStorage.title') }}</h4>
            <p class="feature-description">{{ t('welcome.features.cloudStorage.description') }}</p>
          </div>
        </div>
      </section>

      <!-- 数据统计 -->
      <section id="stats" class="stats-section">
        <div class="stats-card">
          <div class="stats-decoration">
            <svg viewBox="0 0 200 200" class="stats-svg">
              <circle cx="100" cy="100" r="80" fill="white"/>
              <circle cx="160" cy="60" r="40" fill="white"/>
              <circle cx="40" cy="150" r="30" fill="white"/>
            </svg>
          </div>
          <div class="stats-content">
            <div class="stat-item">
              <div class="stat-number">10K+</div>
              <div class="stat-label">{{ t('welcome.stats.users') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">50K+</div>
              <div class="stat-label">{{ t('welcome.stats.sessions') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">100TB+</div>
              <div class="stat-label">{{ t('welcome.stats.storage') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">99.9%</div>
              <div class="stat-label">{{ t('welcome.stats.availability') }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA 区域 -->
      <section class="cta-section">
        <h3 class="cta-title">{{ t('welcome.cta.title') }}</h3>
        <p class="cta-description">{{ t('welcome.cta.description') }}</p>
        <div class="cta-buttons">
          <button @click="goToLogin('live')" class="btn btn-primary btn-lg">
            <span>{{ t('welcome.cta.loginButton') }}</span>
            <icon-arrow-right class="btn-icon" />
          </button>
          <button class="btn btn-secondary btn-lg">{{ t('welcome.cta.contactButton') }}</button>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-column">
            <div class="footer-brand">
              <div class="footer-logo">
                <icon-storage class="nav-logo-icon" />
              </div>
              <div>
                <h5 class="footer-brand-title">{{ t('welcome.brandTitle') }}</h5>
                <p class="footer-brand-subtitle">{{ t('welcome.brandSubtitle') }}</p>
              </div>
            </div>
            <p class="footer-text">{{ t('welcome.footer.brandText') }}</p>
          </div>
          <div class="footer-column">
            <h6 class="footer-column-title">{{ t('welcome.footer.productTitle') }}</h6>
            <ul class="footer-links">
              <li><a href="#">{{ t('welcome.footer.productLinks.0') }}</a></li>
              <li><a href="#">{{ t('welcome.footer.productLinks.1') }}</a></li>
              <li><a href="#">{{ t('welcome.footer.productLinks.2') }}</a></li>
              <li><a href="#">{{ t('welcome.footer.productLinks.3') }}</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h6 class="footer-column-title">{{ t('welcome.footer.companyTitle') }}</h6>
            <ul class="footer-links">
              <li><a href="#">{{ t('welcome.footer.companyLinks.0') }}</a></li>
              <li><a href="#">{{ t('welcome.footer.companyLinks.1') }}</a></li>
              <li><a href="#">{{ t('welcome.footer.companyLinks.2') }}</a></li>
              <li><a href="#">{{ t('welcome.footer.companyLinks.3') }}</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h6 class="footer-column-title">{{ t('welcome.footer.supportTitle') }}</h6>
            <ul class="footer-links">
              <li><a href="#">{{ t('welcome.footer.supportLinks.0') }}</a></li>
              <li><a href="#">{{ t('welcome.footer.supportLinks.1') }}</a></li>
              <li><a href="#">{{ t('welcome.footer.supportLinks.2') }}</a></li>
              <li><a href="#">{{ t('welcome.footer.supportLinks.3') }}</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-copyright">{{ t('welcome.footer.copyright') }}</p>
          <div class="footer-social">
            <a href="#" class="social-btn">
              <icon-github class="social-icon" />
            </a>
            <a href="#" class="social-btn">
              <icon-twitter class="social-icon" />
            </a>
            <a href="#" class="social-btn">
              <icon-wechat class="social-icon" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.welcome-page {
  position: relative;
  min-height: 100vh;
  background: #f9fafb;
  overflow-x: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%);
}

.floating-shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.3;
  animation: float 20s ease-in-out infinite;
}

.floating-shape:nth-child(1) {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #165dff, transparent);
  top: -150px;
  left: -100px;
  animation-delay: 0s;
}

.floating-shape:nth-child(2) {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #34c759, transparent);
  top: 30%;
  right: -80px;
  animation-delay: -5s;
}

.floating-shape:nth-child(3) {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #722ed1, transparent);
  bottom: 20%;
  left: 10%;
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(40px, -40px) rotate(5deg);
  }
  50% {
    transform: translate(0, -60px) rotate(0deg);
  }
  75% {
    transform: translate(-40px, -40px) rotate(-5deg);
  }
}

/* 导航栏 */
.nav-bar {
  position: relative;
  z-index: 10;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #f3f4f6;
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.register-btn {
  color: #165dff;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 16px;
  border: 1px solid #165dff;
  border-radius: 6px;
  transition: all 0.2s;
}
.register-btn:hover { background: #165dff; color: #fff; }

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #165dff 0%, #34c759 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.nav-logo-icon {
  font-size: 24px;
  color: white;
}

.nav-brand-text {
  line-height: 1.2;
}

.nav-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.nav-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-link {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #165dff;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-lg {
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #165dff 0%, #34c759 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(22, 93, 255, 0.35);
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 20px;
}

/* 主内容区 */
.main-content {
  position: relative;
  z-index: 10;
}

/* Hero 区域 */
.hero-section {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0px 24px 1px;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.hero-left {
  flex: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #eff6ff;
  border-radius: 9999px;
  margin-bottom: 24px;
}

.hero-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.hero-badge-text {
  font-size: 14px;
  font-weight: 500;
  color: #1d4ed8;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
  margin: 0 0 24px;
}

.hero-title-gradient {
  background: linear-gradient(135deg, #165dff 0%, #34c759 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 18px;
  color: #6b7280;
  line-height: 1.7;
  margin: 0 0 32px;
}

.hero-buttons {
  display: flex;
  flex-direction: row;
  gap: 16px;
}

.hero-right {
  position: relative;
}

.hero-card-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(52, 211, 153, 0.2));
  border-radius: 24px;
  filter: blur(24px);
}

.hero-card {
  position: relative;
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  border: 1px solid #f3f4f6;
}

.hero-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.hero-card-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.hero-card-dot.red {
  background: #f87171;
}

.hero-card-dot.yellow {
  background: #fbbf24;
}

.hero-card-dot.green {
  background: #4ade80;
}

.hero-card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-card-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
}

.hero-card-item.gray {
  background: #f9fafb;
}

.hero-card-item.blue {
  background: #eff6ff;
}

.hero-card-item.purple {
  background: #f5f3ff;
}

.hero-card-item-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.hero-card-item-icon.gradient {
  background: linear-gradient(135deg, #165dff 0%, #34c759 100%);
}

.hero-card-item-icon.blue-gradient {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.hero-card-item-icon.purple-gradient {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
}

.icon-lg {
  font-size: 24px;
}

.hero-card-item-content {
  flex: 1;
}

.hero-card-item-line {
  height: 12px;
  border-radius: 6px;
  background: #e5e7eb;
}

.hero-card-item-line.w-32 {
  width: 128px;
}

.hero-card-item-line.w-40 {
  width: 160px;
}

.hero-card-item-line.w-48 {
  width: 192px;
}

.hero-card-item-line.w-56 {
  width: 224px;
}

.hero-card-item-line.w-36 {
  width: 144px;
}

.hero-card-item-line.w-44 {
  width: 176px;
}

.hero-card-item-line.blue {
  background: #bfdbfe;
}

.hero-card-item-line.purple {
  background: #ddd6fe;
}

.hero-card-item-status {
  width: 40px;
  height: 24px;
  background: #dcfce7;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.hero-card-item-label {
  font-size: 14px;
  font-weight: 500;
  color: #2563eb;
}

.hero-card-item-avatars {
  display: flex;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
}

.avatar.red {
  background: #f87171;
}

.avatar.blue {
  background: #60a5fa;
  margin-left: -8px;
}

.avatar.pink {
  background: #f472b6;
  margin-left: -8px;
}

/* 通用区块样式 */
.platforms-section,
.features-section {
  max-width: 1280px;
  margin: 0 auto;
  padding: 10px 24px;
}

.platforms-header,
.features-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-size: 30px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px;
}

.section-description {
  font-size: 16px;
  color: #6b7280;
  max-width: 672px;
  margin: 0 auto;
}

/* 平台选择 */
.platforms-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1024px;
  margin: 0 auto;
}

.platform-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  border: 2px solid #f3f4f6;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.platform-card:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.15);
}

.platform-card.active {
  border-color: #165dff;
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
}

.platform-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.platform-icon.red-gradient {
  background: linear-gradient(135deg, #165dff, #34c759);
}

.platform-icon.green-blue-gradient {
  background: linear-gradient(135deg, #0e4bdb, #2f9e63);
}

.platform-icon.purple-pink-gradient {
  background: linear-gradient(135deg, #3b82f6, #45d483);
}

.icon-xl {
  font-size: 40px;
  color: white;
}

.platform-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px;
}

.platform-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
}

.platform-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  text-align: left;
}

.platform-feature {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 8px;
}

.check-icon {
  color: #22c55e;
  margin-right: 8px;
  flex-shrink: 0;
}

.platform-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.platform-btn:not(.primary) {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.platform-btn:not(.primary):hover {
  border-color: #165dff;
  color: #165dff;
}

.platform-btn.primary {
  background: linear-gradient(135deg, #165dff 0%, #34c759 100%);
  color: white;
}

/* 功能特性 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #f3f4f6;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1);
}

.feature-icon.blue-gradient {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.feature-icon.pink-gradient {
  background: linear-gradient(135deg, #ec4899, #f87171);
}

.feature-icon.cyan-gradient {
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
}

.feature-icon.orange-gradient {
  background: linear-gradient(135deg, #f97316, #facc15);
}

.feature-icon.green-gradient {
  background: linear-gradient(135deg, #22c55e, #34d399);
}

.feature-icon.purple-indigo-gradient {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
}

.feature-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px;
}

.feature-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* 数据统计 */
.stats-section {
  max-width: 1280px;
  margin: 0 auto;
  padding: 80px 24px;
}

.stats-card {
  background: linear-gradient(135deg, #165dff 0%, #34c759 100%);
  border-radius: 24px;
  padding: 48px 64px;
  position: relative;
  overflow: hidden;
}

.stats-decoration {
  position: absolute;
  right: 0;
  top: 0;
  width: 384px;
  height: 384px;
  opacity: 0.1;
}

.stats-svg {
  width: 100%;
  height: 100%;
}

.stats-content {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  text-align: center;
}

.stat-number {
  font-size: 48px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

/* CTA 区域 */
.cta-section {
  max-width: 896px;
  margin: 0 auto;
  padding: 80px 24px;
  text-align: center;
}

.cta-title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 24px;
}

.cta-description {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 40px;
  max-width: 672px;
  margin-left: auto;
  margin-right: auto;
}

.cta-buttons {
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: center;
}

/* 页脚 */
.footer {
  position: relative;
  z-index: 10;
  background: white;
  border-top: 1px solid #f3f4f6;
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 24px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  margin-bottom: 32px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.footer-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #165dff 0%, #34c759 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-brand-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.footer-brand-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.footer-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.footer-column-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 8px;
}

.footer-links a {
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: #165dff;
}

.footer-bottom {
  padding-top: 32px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.footer-copyright {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.footer-social {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 0;
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  text-decoration: none;
}

.social-btn:hover {
  background: #e5e7eb;
}

.social-icon {
  font-size: 20px;
  color: #4b5563;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
  }

  .platforms-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-content {
    grid-template-columns: repeat(2, 1fr);
  }

  .footer-content {
    grid-template-columns: repeat(2, 1fr);
  }

  .nav-links {
    display: none;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 32px;
  }

  .hero-buttons,
  .cta-buttons {
    flex-direction: column;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-content {
    grid-template-columns: 1fr;
  }

  .footer-content {
    grid-template-columns: 1fr;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
