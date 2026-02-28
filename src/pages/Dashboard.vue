<template>
  <div class="live-guide-page">
    <!-- 快速开始流程 -->
    <div class="flow-section">
      <div class="section-header">
        <h2 class="section-title">🚀 快速开始</h2>
        <p class="section-description">按照以下步骤快速开始使用直播服务</p>
      </div>
      <div class="flow-timeline">
        <div class="flow-item">
          <div class="flow-step" style="background-color: #667eea;">
            <span class="step-number">1</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">🌐</div>
            <h3 class="flow-title">配置域名</h3>
            <p class="flow-description">添加推流和播放域名，配置 CNAME 解析</p>
          </div>
          <div class="flow-connector"></div>
        </div>
        <div class="flow-item">
          <div class="flow-step" style="background-color: #f093fb;">
            <span class="step-number">2</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">📡</div>
            <h3 class="flow-title">开始推流</h3>
            <p class="flow-description">获取推流地址，使用 OBS 等工具推流</p>
          </div>
          <div class="flow-connector"></div>
        </div>
        <div class="flow-item">
          <div class="flow-step" style="background-color: #4facfe;">
            <span class="step-number">3</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">📊</div>
            <h3 class="flow-title">管理直播</h3>
            <p class="flow-description">监控直播状态，管理直播流</p>
          </div>
          <div class="flow-connector"></div>
        </div>
        <div class="flow-item">
          <div class="flow-step" style="background-color: #fa709a;">
            <span class="step-number">4</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">💾</div>
            <h3 class="flow-title">内容管理</h3>
            <p class="flow-description">录制、切片和云盘存储管理</p>
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
                <h3 class="module-name">直播域名</h3>
              </div>
              <p class="module-description">管理推流和播放域名，配置 CNAME 解析</p>
              <ul class="feature-list">
                <li>添加推流域名和播放域名</li>
                <li>配置 CNAME 解析记录</li>
                <li>查看域名状态和配置信息</li>
                <li>启用、禁用或删除域名</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  进入管理
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
                <h3 class="module-name">直播流管理</h3>
              </div>
              <p class="module-description">实时监控和管理所有直播流</p>
              <ul class="feature-list">
                <li>查看所有直播流状态和推流时长</li>
                <li>获取推流地址和播放地址</li>
                <li>禁用、恢复或断开直播流</li>
                <li>查看直播流历史记录</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  进入管理
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
                <h3 class="module-name">社媒分发</h3>
              </div>
              <p class="module-description">同步分发到多个社交媒体平台</p>
              <ul class="feature-list">
                <li>同时推流到抖音、快手、B站等平台</li>
                <li>配置各平台推流地址和密钥</li>
                <li>实时监控各平台推流状态</li>
                <li>启动、停止或编辑分发任务</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  进入管理
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
                <h3 class="module-name">直播切片</h3>
              </div>
              <p class="module-description">保存直播精彩片段</p>
              <ul class="feature-list">
                <li>直播过程中实时生成切片文件</li>
                <li>标记和保存精彩时刻</li>
                <li>查看、下载或删除切片文件</li>
                <li>在线预览切片内容</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  进入管理
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
                <h3 class="module-name">直播录制</h3>
              </div>
              <p class="module-description">自动录制直播内容</p>
              <ul class="feature-list">
                <li>配置录制规则和存储位置</li>
                <li>自动录制直播全程内容</li>
                <li>查看录制文件列表和详情</li>
                <li>下载、播放或删除录制文件</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  进入管理
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
                <h3 class="module-name">云盘</h3>
              </div>
              <p class="module-description">统一管理直播相关文件</p>
              <ul class="feature-list">
                <li>集中存储录制和切片文件</li>
                <li>文件夹分类管理和搜索</li>
                <li>上传、下载和分享文件</li>
                <li>查看文件详情和存储空间</li>
              </ul>
              <div class="module-footer">
                <span class="module-action">
                  进入管理
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

const navigationStore = useNavigationStore()

const navigateTo = (path: string) => {
  // 根据路径导航到对应页面
  const routeMap: Record<string, { component: string; title: string }> = {
    '/live/domains': { component: 'LiveDomain', title: '直播域名管理' },
    '/live/streams': { component: 'LiveStream', title: '直播流管理' },
    '/live/distribution': { component: 'PullStreamTask', title: '社媒分发' },
    '/live/highlight-clips': { component: 'LiveHighlightClips', title: '直播切片' },
    '/live/recordings': { component: 'LiveRecordings', title: '直播录制' },
    '/cloud': { component: 'Cloud', title: '云盘' }
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
  max-width: 1600px;
  margin: 0 auto;
  overflow-y: auto;
  height: 850px;
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
