<!-- 首页Dashboard -->
<template>
  <div class="dashboard-page">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-left">
        <h1 class="welcome-title">欢迎回来，管理员</h1>
        <p class="welcome-subtitle">{{ currentDate }} · 祝您今天工作愉快！</p>
      </div>
      <div class="welcome-right">
        <a-button type="primary" size="large" @click="goToCreateLive">
          <icon-plus /> 新建直播间
        </a-button>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-grid">
      <a-card class="stat-card" hoverable>
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">活跃直播间</p>
            <h3 class="stat-value">{{ stats.liveRooms }}</h3>
            <p class="stat-trend up">
              <icon-arrow-up /> 较昨日 +12%
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
            <p class="stat-label">云盘使用量</p>
            <h3 class="stat-value">{{ stats.cloudStorage }}</h3>
            <p class="stat-trend up">
              <icon-arrow-up /> 较上周 +8.2%
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
            <p class="stat-label">今日观看人次</p>
            <h3 class="stat-value">{{ stats.viewCount }}</h3>
            <p class="stat-trend up">
              <icon-arrow-up /> 较昨日 +23%
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
            <p class="stat-label">待处理任务</p>
            <h3 class="stat-value">{{ stats.pendingTasks }}</h3>
            <p class="stat-trend down">
              <icon-arrow-down /> 较昨日 -3项
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
      <h2 class="section-title">常用功能</h2>
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
        <h2 class="section-title">最近操作</h2>
        <a-list :data="recentOperations" :bordered="false">
          <template #item="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #avatar>
                  <icon-info-circle :style="{ color: item.color, fontSize: '20px' }" />
                </template>
                <template #title>{{ item.title }}</template>
                <template #description>
                  <span class="operation-time">{{ item.time }}</span>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>

      <div class="system-notices">
        <h2 class="section-title">系统公告</h2>
        <a-list :data="notices" :bordered="false">
          <template #item="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <span class="notice-title">{{ item.title }}</span>
                  <a-tag v-if="item.important" color="red">重要</a-tag>
                </template>
                <template #description>
                  <span class="notice-content">{{ item.content }}</span>
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
import {
  IconPlus,
  IconCamera,
  IconCloud,
  IconUser,
  IconList,
  IconArrowUp,
  IconArrowDown,
  IconSettings,
  IconFile,
  IconPlayCircle,
  IconInfoCircle,
  IconLink
} from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '../stores/navigation'

const router = useRouter()
const navigationStore = useNavigationStore()

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
    title: '直播间管理',
    description: '查看和管理所有直播间',
    icon: IconCamera,
    color: '#165dff',
    path: '/live/rooms'
  },
  {
    key: 'cloud',
    title: '云盘管理',
    description: '管理云端存储的文件',
    icon: IconCloud,
    color: '#00b42a',
    path: '/cloud'
  },
  {
    key: 'live-domain',
    title: '域名管理',
    description: '配置直播推流和播放域名',
    icon: IconLink,
    color: '#722ed1',
    path: '/live/domains'
  },
  {
    key: 'pull-stream',
    title: '社媒分发',
    description: '管理跨平台直播分发任务',
    icon: IconPlayCircle,
    color: '#ff7d00',
    path: '/live/pull-stream'
  },
  {
    key: 'system',
    title: '系统设置',
    description: '配置系统参数和用户权限',
    icon: IconSettings,
    color: '#f53f3f',
    path: '/system-management'
  },
  {
    key: 'guide',
    title: '使用指南',
    description: '查看平台功能使用教程',
    icon: IconFile,
    color: '#86909c',
    path: '/LiveGuide'
  }
]

// 最近操作
const recentOperations = ref([
  {
    title: '创建了直播间「新品发布会」',
    time: '10分钟前',
    color: '#00b42a'
  },
  {
    title: '上传了视频文件「产品演示.mp4」',
    time: '1小时前',
    color: '#165dff'
  },
  {
    title: '修改了域名配置',
    time: '3小时前',
    color: '#722ed1'
  },
  {
    title: '创建了新的分发任务',
    time: '昨天 18:30',
    color: '#ff7d00'
  },
  {
    title: '更新了系统权限配置',
    time: '昨天 15:20',
    color: '#f53f3f'
  }
])

// 系统公告
const notices = ref([
  {
    title: '系统升级维护通知',
    content: '本周日00:00-06:00系统将进行升级维护，期间服务可能短暂中断，请提前做好准备。',
    time: '2026-03-10',
    important: true
  },
  {
    title: '新功能上线：多平台同步直播',
    content: '现在支持同时推流到抖音、快手、视频号等10+平台，快来体验吧！',
    time: '2026-03-08',
    important: false
  },
  {
    title: '存储容量扩容优惠',
    content: '云盘存储容量现在买一送一，更多优惠请联系客户经理。',
    time: '2026-03-05',
    important: false
  }
])

// 格式化当前日期
const formatCurrentDate = () => {
  const now = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekday = weekdays[now.getDay()]
  currentDate.value = `${year}年${month}月${day}日 ${weekday}`
}

// 跳转到新建直播间
const goToCreateLive = () => {
  navigationStore.navigateTo('LiveRoomForm', '创建直播间', {})
}

// 快捷入口点击
const handleShortcutClick = (shortcut: any) => {
  // 这里可以根据path跳转
  Message.info(`跳转到${shortcut.title}`)
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