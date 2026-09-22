<!-- 首页Dashboard -->
<template>
  <div class="dashboard-page">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-left">
        <h1 class="welcome-title">{{ t('dashboard.welcomeBack') }}</h1>
        <p class="welcome-subtitle">{{ currentDate }} · {{ t('dashboard.haveANiceDay') }}</p>
      </div>
      <div class="welcome-right">
        <a-button type="primary" size="large" @click="goToCreateLive">
          <icon-plus /> {{ t('dashboard.createLiveRoom') }}
        </a-button>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-grid">
      <a-card class="stat-card" hoverable>
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">{{ t('dashboard.liveRooms') }}</p>
            <h3 class="stat-value">{{ stats.liveRooms }}</h3>
            <p class="stat-trend up">
              <icon-arrow-up /> {{ t('dashboard.comparedYesterday') }} +12%
            </p>
          </div>
          <div class="stat-icon live-icon">
            <icon-camera />
          </div>
        </div>
      </a-card>

      <a-card class="stat-card" hoverable>
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">{{ t('dashboard.cloudStorage') }}</p>
            <h3 class="stat-value">{{ stats.cloudStorage }}</h3>
            <p class="stat-trend up">
              <icon-arrow-up /> {{ t('dashboard.comparedLastWeek') }} +8.2%
            </p>
          </div>
          <div class="stat-icon cloud-icon">
            <icon-cloud />
          </div>
        </div>
      </a-card>

      <a-card class="stat-card" hoverable>
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">{{ t('dashboard.viewCount') }}</p>
            <h3 class="stat-value">{{ stats.viewCount }}</h3>
            <p class="stat-trend up">
              <icon-arrow-up /> {{ t('dashboard.comparedYesterday') }} +23%
            </p>
          </div>
          <div class="stat-icon user-icon">
            <icon-user />
          </div>
        </div>
      </a-card>

      <a-card class="stat-card" hoverable>
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">{{ t('dashboard.pendingTasks') }}</p>
            <h3 class="stat-value">{{ stats.pendingTasks }}</h3>
            <p class="stat-trend down">
              <icon-arrow-down /> {{ t('dashboard.comparedYesterday') }} -3{{ t('dashboard.items') }}
            </p>
          </div>
          <div class="stat-icon task-icon">
            <icon-list />
          </div>
        </div>
      </a-card>
    </div>

    <!-- 快捷功能入口 -->
    <div class="section">
      <h2 class="section-title">{{ t('dashboard.commonFunctions') }}</h2>
      <div class="shortcuts-grid">
        <a-card
          v-for="shortcut in shortcuts"
          :key="shortcut.key"
          class="shortcut-card"
          hoverable
          @click="handleShortcutClick(shortcut)"
        >
          <div class="shortcut-content">
            <div class="shortcut-icon" :style="{ backgroundColor: shortcut.color }">
              <component :is="shortcut.icon" />
            </div>
            <div class="shortcut-info">
              <h3 class="shortcut-title">{{ shortcut.title }}</h3>
              <p class="shortcut-desc">{{ shortcut.description }}</p>
            </div>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 最近操作和公告 -->
    <div class="section row-section">
      <div class="recent-operations">
        <h2 class="section-title">{{ t('dashboard.recentOperations') }}</h2>
        <a-list :data="recentOperations" :bordered="false">
          <template #item="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #avatar>
                  <icon-info-circle :style="{ color: item.color, fontSize: '20px' }" />
                </template>
                <template #title>{{ t(item.titleKey) + item.titleParam }}</template>
                <template #description>
                  <span class="operation-time">{{ item.time }}</span>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>

      <div class="system-notices">
        <h2 class="section-title">{{ t('dashboard.systemNotices') }}</h2>
        <a-list :data="notices" :bordered="false">
          <template #item="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <span class="notice-title">{{ t(item.titleKey) }}</span>
                  <a-tag v-if="item.important" color="red">{{ t('dashboard.important') }}</a-tag>
                </template>
                <template #description>
                  <span class="notice-content">{{ t(item.contentKey) }}</span>
                  <span class="notice-time">{{ item.time }}</span>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import {
  IconPlus,
  IconCamera,
  IconCloud,
  IconUser,
  IconList,
  IconArrowUp,
  IconArrowDown,
  IconSettings,
  IconPlayCircle,
  IconInfoCircle,
  IconLink
} from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '../../stores/navigation'

const router = useRouter()
const navigationStore = useNavigationStore()
const { t, locale } = useI18n()

// 当前日期
const currentDate = ref('')
// 统计数据
const stats = ref({
  liveRooms: 24,
  cloudStorage: '128.5GB',
  viewCount: '12.8万',
  pendingTasks: 7
})

// 快捷入口
const shortcuts = [
  {
    key: 'live-room',
    title: t('dashboard.liveRoomManagement'),
    description: t('dashboard.liveRoomManagementDesc'),
    icon: IconCamera,
    color: '#165dff',
    path: '/live/rooms'
  },
  {
    key: 'cloud',
    title: t('dashboard.cloudStorageManagement'),
    description: t('dashboard.cloudStorageManagementDesc'),
    icon: IconCloud,
    color: '#00b42a',
    path: '/cloud'
  },
  {
    key: 'live-domain',
    title: t('dashboard.domainManagement'),
    description: t('dashboard.domainManagementDesc'),
    icon: IconLink,
    color: '#722ed1',
    path: '/live/domains'
  },
  {
    key: 'pull-stream',
    title: t('dashboard.socialDistribution'),
    description: t('dashboard.socialDistributionDesc'),
    icon: IconPlayCircle,
    color: '#ff7d00',
    path: '/live/pull-stream'
  },
  {
    key: 'system',
    title: t('dashboard.systemSettings'),
    description: t('dashboard.systemSettingsDesc'),
    icon: IconSettings,
    color: '#f53f3f',
        path: '/system-management'
      }
    ]

// 最近操作
const recentOperations = ref([
  {
    titleKey: 'dashboard.createdLiveRoom',
    titleParam: '「新品发布会」',
    time: '10分钟前',
    color: '#00b42a'
  },
  {
    titleKey: 'dashboard.uploadedVideoFile',
    titleParam: '「产品演示.mp4」',
    time: '1小时前',
    color: '#165dff'
  },
  {
    titleKey: 'dashboard.modifiedDomainConfig',
    titleParam: '',
    time: '3小时前',
    color: '#722ed1'
  },
  {
    titleKey: 'dashboard.createdDistributionTask',
    titleParam: '',
    time: '昨天 18:30',
    color: '#ff7d00'
  },
  {
    titleKey: 'dashboard.updatedSystemPermissions',
    titleParam: '',
    time: '昨天 15:20',
    color: '#f53f3f'
  }
])

// 系统公告
const notices = ref([
  {
    titleKey: 'dashboard.systemMaintenanceNotice',
    contentKey: 'dashboard.systemMaintenanceNoticeDesc',
    time: '2026-03-10',
    important: true
  },
  {
    titleKey: 'dashboard.newFeatureLiveSync',
    contentKey: 'dashboard.newFeatureLiveSyncDesc',
    time: '2026-03-08',
    important: false
  },
  {
    titleKey: 'dashboard.storageCapacityOffer',
    contentKey: 'dashboard.storageCapacityOfferDesc',
    time: '2026-03-05',
    important: false
  }
])

// 格式化当前日期
const formatCurrentDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekday = t(`dashboard.weekdays.${now.getDay()}`)

  // 根据语言设置不同的日期格式
  if (locale.value === 'en-US') {
    // 英文格式: March 15, 2023 Thursday
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']
    currentDate.value = `${monthNames[month - 1]} ${day}, ${year} ${weekday}`
  } else {
    // 中文格式: 2023年3月15日 星期四
    currentDate.value = `${year}${t('dashboard.date.year')}${month}${t('dashboard.date.month')}${day}${t('dashboard.date.day')} ${weekday}`
  }
}

// 跳转到新建直播间
const goToCreateLive = () => {
  navigationStore.navigateTo('LiveRoomForm', t('layout.createRoom'), {})
}

// 快捷入口点击
const handleShortcutClick = (shortcut: any) => {
  // 这里可以根据path跳转
  Message.info(`${t('dashboard.jumpingTo')}${shortcut.title}`)
  // 实际项目中调用对应的导航方法
  // navigationStore.navigateTo(...)
}

onMounted(() => {
  formatCurrentDate()
})
</script>

<style scoped>
.dashboard-page {
  padding: 0;
  background: #f5f6fa;
  min-height: 100%;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #165dff 0%, #34c759 100%);
  color: white;
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  padding: 0 20px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  border: none;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info .stat-label {
  font-size: 14px;
  color: #86909c;
  margin: 0 0 8px 0;
}

.stat-info .stat-value {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1d2129;
}

.stat-trend {
  font-size: 12px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.up {
  color: #00b42a;
}

.stat-trend.down {
  color: #f53f3f;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.live-icon {
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
}

.cloud-icon {
  background: linear-gradient(135deg, #00b42a 0%, #27c348 100%);
}

.user-icon {
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
}

.task-icon {
  background: linear-gradient(135deg, #ff7d00 0%, #ff9a2e 100%);
}

/* 通用区块 */
.section {
  padding: 0 20px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1d2129;
}

.row-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 快捷入口 */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.shortcut-card {
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.shortcut-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.shortcut-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.shortcut-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.shortcut-info .shortcut-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1d2129;
}

.shortcut-info .shortcut-desc {
  font-size: 12px;
  color: #86909c;
  margin: 0;
}

/* 最近操作和公告 */
.recent-operations,
.system-notices {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.operation-time,
.notice-time {
  font-size: 12px;
  color: #86909c;
}

.notice-title {
  margin-right: 8px;
}

.notice-content {
  display: block;
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 4px;
}

/* 响应式适配：小屏幕 */
@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    gap: 16px;
    text-align: center;
    padding: 20px 16px;
  }

  .welcome-title {
    font-size: 22px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 0 12px;
  }

  .shortcuts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .row-section {
    grid-template-columns: 1fr;
  }

  .section {
    padding: 0 12px;
  }
}
</style>