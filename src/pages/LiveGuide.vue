<template>
  <div class="live-guide-page">
    <!-- 快速开始流程 -->
    <div class="flow-section">
      <div class="section-header">
        <h2 class="section-title">🚀 {{ texts.quickStart }}</h2>
        <p class="section-description">{{ texts.quickStartDesc }}</p>
      </div>
      <div class="flow-timeline">
        <div class="flow-item">
          <div class="flow-step" style="background-color: #667eea;">
            <span class="step-number">1</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">🌐</div>
            <h3 class="flow-title">{{ texts.configureDomain }}</h3>
            <p class="flow-description">{{ texts.configureDomainDesc }}</p>
          </div>
          <div class="flow-connector"></div>
        </div>
        <div class="flow-item">
          <div class="flow-step" style="background-color: #f093fb;">
            <span class="step-number">2</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">📡</div>
            <h3 class="flow-title">{{ texts.startPushing }}</h3>
            <p class="flow-description">{{ texts.startPushingDesc }}</p>
          </div>
          <div class="flow-connector"></div>
        </div>
        <div class="flow-item">
          <div class="flow-step" style="background-color: #4facfe;">
            <span class="step-number">3</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">📊</div>
            <h3 class="flow-title">{{ texts.manageLive }}</h3>
            <p class="flow-description">{{ texts.manageLiveDesc }}</p>
          </div>
          <div class="flow-connector"></div>
        </div>
        <div class="flow-item">
          <div class="flow-step" style="background-color: #fa709a;">
            <span class="step-number">4</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">💾</div>
            <h3 class="flow-title">{{ texts.contentManagement }}</h3>
            <p class="flow-description">{{ texts.contentManagementDesc }}</p>
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
                <h3 class="module-name">{{ texts.liveDomain }}</h3>
              </div>
              <p class="module-description">{{ texts.liveDomainDesc }}</p>
              <ul class="feature-list">
                <li>{{ texts.liveDomainFeature1 }}</li>
                <li>{{ texts.liveDomainFeature2 }}</li>
                <li>{{ texts.liveDomainFeature3 }}</li>
                <li>{{ texts.liveDomainFeature4 }}</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ texts.enterManagement }}
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
                <h3 class="module-name">{{ texts.streamManagement }}</h3>
              </div>
              <p class="module-description">{{ texts.streamManagementDesc }}</p>
              <ul class="feature-list">
                <li>{{ texts.streamManagementFeature1 }}</li>
                <li>{{ texts.streamManagementFeature2 }}</li>
                <li>{{ texts.streamManagementFeature3 }}</li>
                <li>{{ texts.streamManagementFeature4 }}</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ texts.enterManagement }}
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
                <h3 class="module-name">{{ texts.socialDistribution }}</h3>
              </div>
              <p class="module-description">{{ texts.socialDistributionDesc }}</p>
              <ul class="feature-list">
                <li>{{ texts.socialDistributionFeature1 }}</li>
                <li>{{ texts.socialDistributionFeature2 }}</li>
                <li>{{ texts.socialDistributionFeature3 }}</li>
                <li>{{ texts.socialDistributionFeature4 }}</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ texts.enterManagement }}
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
                <h3 class="module-name">{{ texts.highlightClips }}</h3>
              </div>
              <p class="module-description">{{ texts.highlightClipsDesc }}</p>
              <ul class="feature-list">
                <li>{{ texts.highlightClipsFeature1 }}</li>
                <li>{{ texts.highlightClipsFeature2 }}</li>
                <li>{{ texts.highlightClipsFeature3 }}</li>
                <li>{{ texts.highlightClipsFeature4 }}</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ texts.enterManagement }}
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
                <h3 class="module-name">{{ texts.liveRecording }}</h3>
              </div>
              <p class="module-description">{{ texts.liveRecordingDesc }}</p>
              <ul class="feature-list">
                <li>{{ texts.liveRecordingFeature1 }}</li>
                <li>{{ texts.liveRecordingFeature2 }}</li>
                <li>{{ texts.liveRecordingFeature3 }}</li>
                <li>{{ texts.liveRecordingFeature4 }}</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  {{ texts.enterManagement }}
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
  IconRight
} from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '@/stores/navigation'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const navigationStore = useNavigationStore()

const texts = computed(() => ({
  quickStart: t('liveGuide.quickStart'),
  quickStartDesc: t('liveGuide.quickStartDesc'),
  configureDomain: t('liveGuide.configureDomain'),
  configureDomainDesc: t('liveGuide.configureDomainDesc'),
  startPushing: t('liveGuide.startPushing'),
  startPushingDesc: t('liveGuide.startPushingDesc'),
  manageLive: t('liveGuide.manageLive'),
  manageLiveDesc: t('liveGuide.manageLiveDesc'),
  contentManagement: t('liveGuide.contentManagement'),
  contentManagementDesc: t('liveGuide.contentManagementDesc'),
  liveDomain: t('liveGuide.liveDomain'),
  liveDomainDesc: t('liveGuide.liveDomainDesc'),
  liveDomainFeature1: t('liveGuide.liveDomainFeature1'),
  liveDomainFeature2: t('liveGuide.liveDomainFeature2'),
  liveDomainFeature3: t('liveGuide.liveDomainFeature3'),
  liveDomainFeature4: t('liveGuide.liveDomainFeature4'),
  streamManagement: t('liveGuide.streamManagement'),
  streamManagementDesc: t('liveGuide.streamManagementDesc'),
  streamManagementFeature1: t('liveGuide.streamManagementFeature1'),
  streamManagementFeature2: t('liveGuide.streamManagementFeature2'),
  streamManagementFeature3: t('liveGuide.streamManagementFeature3'),
  streamManagementFeature4: t('liveGuide.streamManagementFeature4'),
  socialDistribution: t('liveGuide.socialDistribution'),
  socialDistributionDesc: t('liveGuide.socialDistributionDesc'),
  socialDistributionFeature1: t('liveGuide.socialDistributionFeature1'),
  socialDistributionFeature2: t('liveGuide.socialDistributionFeature2'),
  socialDistributionFeature3: t('liveGuide.socialDistributionFeature3'),
  socialDistributionFeature4: t('liveGuide.socialDistributionFeature4'),
  highlightClips: t('liveGuide.highlightClips'),
  highlightClipsDesc: t('liveGuide.highlightClipsDesc'),
  highlightClipsFeature1: t('liveGuide.highlightClipsFeature1'),
  highlightClipsFeature2: t('liveGuide.highlightClipsFeature2'),
  highlightClipsFeature3: t('liveGuide.highlightClipsFeature3'),
  highlightClipsFeature4: t('liveGuide.highlightClipsFeature4'),
  liveRecording: t('liveGuide.liveRecording'),
  liveRecordingDesc: t('liveGuide.liveRecordingDesc'),
  liveRecordingFeature1: t('liveGuide.liveRecordingFeature1'),
  liveRecordingFeature2: t('liveGuide.liveRecordingFeature2'),
  liveRecordingFeature3: t('liveGuide.liveRecordingFeature3'),
  liveRecordingFeature4: t('liveGuide.liveRecordingFeature4'),
  enterManagement: t('liveGuide.enterManagement'),
  liveDomainTitle: t('liveGuide.liveDomainTitle'),
  streamManagementTitle: t('liveGuide.streamManagementTitle'),
  socialDistributionTitle: t('liveGuide.socialDistributionTitle'),
  highlightClipsTitle: t('liveGuide.highlightClipsTitle'),
  liveRecordingTitle: t('liveGuide.liveRecordingTitle'),
}))

const navigateTo = (path: string) => {
  const routeMap: Record<string, { component: string; title: string }> = {
    '/live/domains': { component: 'LiveDomain', title: texts.value.liveDomainTitle },
    '/live/streams': { component: 'LiveStream', title: texts.value.streamManagementTitle },
    '/live/distribution': { component: 'PullStreamTask', title: texts.value.socialDistributionTitle },
    '/live/highlight-clips': { component: 'LiveHighlightClips', title: texts.value.highlightClipsTitle },
    '/live/recordings': { component: 'LiveRecordings', title: texts.value.liveRecordingTitle }
  }

  const route = routeMap[path]
  if (route) {
    navigationStore.navigateTo(route.component, route.title, {}, false)
  }
}
</script>

<style scoped>
.live-guide-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px;
  overflow-y: auto;
  height: 100%;
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
