<template>
  <div class="dashboard-page">
    <!-- 快速开始流程 -->
    <div class="flow-section">
      <div class="section-header">
        <h2 class="section-title">🚀 {{ t('liveGuide.quickStart') }}</h2>
        <p class="section-description">{{ t('liveGuide.quickStartDesc') }}</p>
      </div>
      <div class="flow-timeline">
        <div class="flow-item">
          <div class="flow-step" style="background-color: #667eea;">
            <span class="step-number">1</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">🌐</div>
            <h3 class="flow-title">{{ t('liveGuide.steps.domainConfig') }}</h3>
            <p class="flow-description">{{ t('liveGuide.steps.domainConfigDesc') }}</p>
          </div>
          <div class="flow-connector"></div>
        </div>
        <div class="flow-item">
          <div class="flow-step" style="background-color: #f093fb;">
            <span class="step-number">2</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">📡</div>
            <h3 class="flow-title">{{ t('liveGuide.steps.startStreaming') }}</h3>
            <p class="flow-description">{{ t('liveGuide.steps.startStreamingDesc') }}</p>
          </div>
          <div class="flow-connector"></div>
        </div>
        <div class="flow-item">
          <div class="flow-step" style="background-color: #4facfe;">
            <span class="step-number">3</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">📊</div>
            <h3 class="flow-title">{{ t('liveGuide.steps.manageLive') }}</h3>
            <p class="flow-description">{{ t('liveGuide.steps.manageLiveDesc') }}</p>
          </div>
          <div class="flow-connector"></div>
        </div>
        <div class="flow-item">
          <div class="flow-step" style="background-color: #fa709a;">
            <span class="step-number">4</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">💾</div>
            <h3 class="flow-title">{{ t('liveGuide.steps.contentManage') }}</h3>
            <p class="flow-description">{{ t('liveGuide.steps.contentManageDesc') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能模块 -->
    <div class="modules-section">
      <div class="category-block">
        <div class="modules-grid">
          <!-- 直播域名 -->
          <a-card class="module-card" :bordered="false" @click="navigateTo('/live/domains')">
            <div class="module-content">
              <div class="module-header">
                <div class="module-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <icon-link class="module-icon" />
                </div>
                <h3 class="module-name">{{ t('liveGuide.modules.liveDomain') }}</h3>
              </div>
              <p class="module-description">{{ t('liveGuide.modules.liveDomainDesc') }}</p>
              <ul class="feature-list">
                <li v-for="(feature, index) in liveDomainFeatures" :key="index">
                  {{ feature }}
                </li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ t('liveGuide.enterManage') }}
                  <icon-right class="action-icon" />
                </span>
              </div>
            </div>
          </a-card>

          <!-- 直播流管理 -->
          <a-card class="module-card" :bordered="false" @click="navigateTo('/live/streams')">
            <div class="module-content">
              <div class="module-header">
                <div class="module-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                  <icon-play-circle class="module-icon" />
                </div>
                <h3 class="module-name">{{ t('liveGuide.modules.liveStream') }}</h3>
              </div>
              <p class="module-description">{{ t('liveGuide.modules.liveStreamDesc') }}</p>
              <ul class="feature-list">
                <li v-for="(feature, index) in liveStreamFeatures" :key="index">
                  {{ feature }}
                </li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ t('liveGuide.enterManage') }}
                  <icon-right class="action-icon" />
                </span>
              </div>
            </div>
          </a-card>

          <!-- 社媒分发 -->
          <a-card class="module-card" :bordered="false" @click="navigateTo('/live/distribution')">
            <div class="module-content">
              <div class="module-header">
                <div class="module-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                  <icon-share-alt class="module-icon" />
                </div>
                <h3 class="module-name">{{ t('liveGuide.modules.socialDistribution') }}</h3>
              </div>
              <p class="module-description">{{ t('liveGuide.modules.socialDistributionDesc') }}</p>
              <ul class="feature-list">
                <li v-for="(feature, index) in socialDistributionFeatures" :key="index">
                  {{ feature }}
                </li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ t('liveGuide.enterManage') }}
                  <icon-right class="action-icon" />
                </span>
              </div>
            </div>
          </a-card>

          <!-- 直播切片 -->
          <a-card class="module-card" :bordered="false" @click="navigateTo('/live/highlight-clips')">
            <div class="module-content">
              <div class="module-header">
                <div class="module-icon-wrapper" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                  <icon-scissor class="module-icon" />
                </div>
                <h3 class="module-name">{{ t('liveGuide.modules.highlightClips') }}</h3>
              </div>
              <p class="module-description">{{ t('liveGuide.modules.highlightClipsDesc') }}</p>
              <ul class="feature-list">
                <li v-for="(feature, index) in highlightClipsFeatures" :key="index">
                  {{ feature }}
                </li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ t('liveGuide.enterManage') }}
                  <icon-right class="action-icon" />
                </span>
              </div>
            </div>
          </a-card>

          <!-- 直播录制 -->
          <a-card class="module-card" :bordered="false" @click="navigateTo('/live/recordings')">
            <div class="module-content">
              <div class="module-header">
                <div class="module-icon-wrapper" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                  <icon-record class="module-icon" />
                </div>
                <h3 class="module-name">{{ t('liveGuide.modules.liveRecording') }}</h3>
              </div>
              <p class="module-description">{{ t('liveGuide.modules.liveRecordingDesc') }}</p>
              <ul class="feature-list">
                <li v-for="(feature, index) in liveRecordingFeatures" :key="index">
                  {{ feature }}
                </li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ t('liveGuide.enterManage') }}
                  <icon-right class="action-icon" />
                </span>
              </div>
            </div>
          </a-card>

          <!-- 云盘 -->
          <a-card class="module-card" :bordered="false" @click="navigateTo('/cloud')">
            <div class="module-content">
              <div class="module-header">
                <div class="module-icon-wrapper" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
                  <icon-cloud class="module-icon" />
                </div>
                <h3 class="module-name">{{ t('layout.cloud') }}</h3>
              </div>
              <p class="module-description">{{ t('dashboard.cloudStorageManagementDesc') }}</p>
              <ul class="feature-list">
                <li v-for="(feature, index) in cloudStorageFeatures" :key="index">
                  {{ feature }}
                </li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ t('liveGuide.enterManage') }}
                  <icon-right class="action-icon" />
                </span>
              </div>
            </div>
          </a-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  IconLink,
  IconPlayCircle,
  IconShareAlt,
  IconScissor,
  IconRecord,
  IconCloud,
  IconRight
} from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '@/stores/navigation'
import { useI18n } from 'vue-i18n'
import zhCN from '@/locales/zh-CN'
import enUS from '@/locales/en-US'

const { t, locale } = useI18n()
const navigationStore = useNavigationStore()

// 获取当前语言的翻译对象
const getMessages = () => {
  return locale.value === 'en-US' ? enUS : zhCN
}

// 安全获取数组类型的翻译
const liveDomainFeatures = computed(() => {
  const msgs = getMessages()
  return msgs.liveGuide?.modules?.liveDomainFeatures || []
})

const liveStreamFeatures = computed(() => {
  const msgs = getMessages()
  return msgs.liveGuide?.modules?.liveStreamFeatures || []
})

const socialDistributionFeatures = computed(() => {
  const msgs = getMessages()
  return msgs.liveGuide?.modules?.socialDistributionFeatures || []
})

const highlightClipsFeatures = computed(() => {
  const msgs = getMessages()
  return msgs.liveGuide?.modules?.highlightClipsFeatures || []
})

const liveRecordingFeatures = computed(() => {
  const msgs = getMessages()
  return msgs.liveGuide?.modules?.liveRecordingFeatures || []
})

const cloudStorageFeatures = computed(() => {
  const msgs = getMessages()
  return msgs.dashboard?.cloudStorageFeatures || []
})

const navigateTo = (path: string) => {
  // 根据路径导航到对应页面
  const routeMap: Record<string, { component: string; title: string }> = {
    '/live/domains': { component: 'LiveDomain', title: t('layout.liveDomain') },
    '/live/streams': { component: 'LiveStream', title: t('layout.liveStreams') },
    '/live/distribution': { component: 'PullStreamTask', title: t('layout.pullStream') },
    '/live/highlight-clips': { component: 'LiveHighlightClips', title: t('layout.highlightClips') },
    '/live/recordings': { component: 'LiveRecordings', title: t('layout.recordings') },
    '/cloud': { component: 'Cloud', title: t('layout.cloud') }
  }

  const route = routeMap[path]
  if (route) {
    navigationStore.navigateTo(route.component, route.title, {}, false)
  }
}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}

/* 通用区块样式 */
.section-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1d2129;
}

.section-description {
  font-size: 14px;
  color: #86909c;
  margin: 0;
}

/* 使用流程 */
.flow-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.flow-timeline {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-top: 24px;
}

.flow-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.flow-step {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.step-number {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.flow-content {
  flex: 1;
}

.flow-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.flow-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1d2129;
}

.flow-description {
  font-size: 13px;
  color: #86909c;
  margin: 0;
  line-height: 1.6;
}

.flow-connector {
  display: block;
  position: absolute;
  top: 24px;
  left: calc(50% + 24px);
  width: calc(100% - 48px);
  height: 2px;
  background: linear-gradient(to right, #e5e6eb 0%, #e5e6eb 100%);
}

.flow-item:last-child .flow-connector {
  display: none;
}

/* 功能模块分类 */
.modules-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.category-block {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 模块网格 */
.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.module-card {
  border-radius: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e5e6eb;
  background: #fafafa;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #165dff;
  background: white;
}

.module-card :deep(.arco-card-body) {
  padding: 20px;
}

.module-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.module-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.module-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.module-icon {
  font-size: 20px;
  color: white;
}

.module-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1d2129;
}

.module-description {
  font-size: 13px;
  color: #86909c;
  margin: 0;
  line-height: 1.6;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.feature-list li {
  font-size: 12px;
  color: #4e5969;
  line-height: 1.8;
  padding-left: 16px;
  position: relative;
}

.feature-list li::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: #165dff;
  font-weight: bold;
}

.module-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
}

.module-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #165dff;
  transition: gap 0.2s ease;
}

.module-card:hover .module-action {
  gap: 8px;
}

.action-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.module-card:hover .action-icon {
  transform: translateX(2px);
}

@media (max-width: 1200px) {
  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .flow-timeline {
    grid-template-columns: 1fr;
  }

  .flow-connector {
    display: none;
  }

  .modules-grid {
    grid-template-columns: 1fr;
  }
}
</style>
