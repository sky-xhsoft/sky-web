<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IconVideoCamera, IconCloud } from '@arco-design/web-vue/es/icon'

const router = useRouter()

const navigateToLive = () => {
  router.push('/login?type=live')
}

const navigateToCloud = () => {
  router.push('/login?type=cloud')
}
</script>

<template>
  <div class="welcome-page">
    <div class="welcome-content">
      <!-- 品牌区域 -->
      <div class="brand-section">
        <div class="logo-mark">AI</div>
        <div class="brand-text">
          <div class="brand-title">ZiGeBo</div>
          <div class="brand-subtitle">智能云数据平台</div>
        </div>
      </div>

      <!-- 功能选择区域 -->
      <div class="options-section">
        <h2>欢迎使用 ZiGeBo 平台</h2>
        <p class="description">请选择您要访问的系统</p>

        <div class="options-grid">
          <!-- 直播平台选项 -->
          <div class="option-card" @click="navigateToLive">
            <div class="option-icon live-icon">
              <IconVideoCamera />
            </div>
            <div class="option-content">
              <h3>直播平台</h3>
              <p>专业的直播管理系统，支持直播间管理、直播流监控、录制回放等功能</p>
            </div>
          </div>

          <!-- 云盘系统选项 -->
          <div class="option-card" @click="navigateToCloud">
            <div class="option-icon cloud-icon">
              <IconCloud />
            </div>
            <div class="option-content">
              <h3>云盘系统</h3>
              <p>安全的文件存储和分享平台，支持文件上传、下载、分享、权限管理等功能</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="footer-section">
        <p>© 2026 ZiGeBo 智能云数据平台</p>
      </div>
    </div>

    <!-- 装饰元素 -->
    <div class="bg-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
  </div>
</template>

<style scoped>
.welcome-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fb 0%, #e8f2ff 100%);
  overflow: hidden;
}

.welcome-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
  padding: 40px 20px;
  text-align: center;
}

/* 品牌区域 */
.brand-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
}

.logo-mark {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #165dff, #34c759);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.3);
}

.brand-text {
  line-height: 1.2;
}

.brand-title {
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
}

.brand-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

/* 功能选择区域 */
.options-section {
  margin-bottom: 40px;
}

.options-section h2 {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.description {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 40px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;
}

.option-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.option-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.15);
  border-color: #165dff;
}

.option-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 32px;
  color: #ffffff;
  transition: all 0.3s ease;
}

.live-icon {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
}

.cloud-icon {
  background: linear-gradient(135deg, #165dff, #00c9ff);
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.3);
}

.option-card:hover .live-icon {
  background: linear-gradient(135deg, #ee5a24, #ff6b6b);
}

.option-card:hover .cloud-icon {
  background: linear-gradient(135deg, #00c9ff, #165dff);
}

.option-content h3 {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.option-content p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

/* 底部信息 */
.footer-section {
  margin-top: 60px;
  padding-top: 30px;
  border-top: 1px solid #e5e7eb;
}

.footer-section p {
  font-size: 14px;
  color: #9ca3af;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  filter: blur(80px);
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: #165dff;
  top: -200px;
  left: -200px;
  animation: float 20s infinite ease-in-out;
}

.circle-2 {
  width: 500px;
  height: 500px;
  background: #34c759;
  bottom: -250px;
  right: -250px;
  animation: float 25s infinite ease-in-out reverse;
}

.circle-3 {
  width: 300px;
  height: 300px;
  background: #ff6b6b;
  top: 50%;
  right: 10%;
  animation: float 18s infinite ease-in-out;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, 30px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr;
  }

  .options-section h2 {
    font-size: 28px;
  }

  .brand-title {
    font-size: 24px;
  }
}
</style>
