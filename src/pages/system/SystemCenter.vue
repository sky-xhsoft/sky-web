<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMenuStore } from '@/stores/menu'
import { useAuthStore } from '@/stores/auth'
import { V2PageHeader, V2Card } from '@/components/ui'
import {
  IconApps,
  IconSafe,
  IconUser,
  IconCommand,
  IconBook,
  IconIdcard,
  IconFile,
  IconRight,
  IconSettings,
  IconClockCircle,
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const { t } = useI18n()
const menuStore = useMenuStore()
const authStore = useAuthStore()

// 系统中心概览：展示用户所属系统信息 + 模块快速入口
const companyName = computed(() => authStore.company?.name || '')
const categories = computed(() => menuStore.menus)

// 快速入口（针对系统管理的常用功能）
const quickEntries = [
  { key: 'companies', title: t('systemCenter.quickCompanies'), desc: '租户与云服务凭证管理', icon: IconIdcard, path: '/metadata/list/4' },
  { key: 'users', title: t('systemCenter.quickUsers'), desc: '账号与权限分配', icon: IconUser, path: '/metadata/list/25' },
  { key: 'groups', title: t('systemCenter.quickGroups'), desc: '权限组与安全等级', icon: IconSafe, path: '/metadata/list/11' },
  { key: 'dict', title: t('systemCenter.quickDict'), desc: '枚举与下拉选项维护', icon: IconBook, path: '/metadata/list/5' },
  { key: 'tables', title: t('systemCenter.quickTables'), desc: '元数据表配置', icon: IconApps, path: '/metadata/list/20' },
  { key: 'subsystems', title: t('systemCenter.quickSubsystems'), desc: '系统模块划分', icon: IconCommand, path: '/metadata/list/19' },
  { key: 'environ', title: '用户环境变量', desc: '用户×模块×键 环境变量', icon: IconSettings, path: '/metadata/list/82' },
  { key: 'schedule', title: '自动任务', desc: '定时任务与 cron 调度', icon: IconClockCircle, path: '/metadata/list/83' },
  { key: 'schedulog', title: '任务执行日志', desc: '自动任务运行历史', icon: IconFile, path: '/metadata/list/84' },
  { key: 'actionlog', title: '动作日志', desc: '后台动作执行记录', icon: IconFile, path: '/metadata/list/85' },
]

const goTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="system-center">
    <V2PageHeader :title="t('systemCenter.title')" :subtitle="t('systemCenter.subtitle')" />

    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-glow"></div>
      <div class="banner-content">
        <div class="banner-icon"><IconApps /></div>
        <div class="banner-text">
          <h3>{{ companyName }}</h3>
          <p>{{ t('systemCenter.bannerDesc') }}</p>
        </div>
      </div>
    </div>

    <!-- 模块分类 -->
    <div v-if="categories.length" class="section">
      <h4 class="section-title">{{ t('systemCenter.moduleTitle') }}</h4>
      <div class="category-grid">
        <V2Card v-for="cat in categories" :key="cat.id" class="category-card" hoverable @click="goTo('/metadata/list/' + (cat.children?.[0]?.id || ''))">
          <div class="category-head">
            <div class="category-icon"><IconFile /></div>
            <div class="category-name">{{ cat.displayName || cat.name }}</div>
          </div>
          <div class="category-meta">{{ (cat.children || []).length }} {{ t('systemCenter.tables') }}</div>
          <div class="category-list">
            <div class="cat-item" v-for="child in (cat.children || []).slice(0, 4)" :key="child.id">
              <span class="cat-item-dot"></span>
              <span class="cat-item-name">{{ child.name }}</span>
              <IconRight class="cat-item-arrow" />
            </div>
          </div>
        </V2Card>
      </div>
    </div>

    <!-- 快速入口 -->
    <div class="section">
      <h4 class="section-title">{{ t('systemCenter.quickTitle') }}</h4>
      <div class="quick-grid">
        <div v-for="entry in quickEntries" :key="entry.key" class="quick-card" @click="goTo(entry.path)">
          <div class="quick-icon"><component :is="entry.icon" /></div>
          <div class="quick-name">{{ entry.title }}</div>
          <div class="quick-desc">{{ entry.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-center {
  max-width: 1280px;
}
.welcome-banner {
  position: relative;
  border-radius: var(--radius-lg);
  background: var(--brand-gradient);
  color: #fff;
  padding: 32px;
  margin-bottom: 28px;
  overflow: hidden;
}
.banner-glow {
  position: absolute;
  right: -40px;
  top: -40px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
}
.banner-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
}
.banner-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
}
.banner-text h3 { font-size: 22px; font-weight: 700; margin-bottom: 6px; color: #fff; }
.banner-text p { margin: 0; opacity: 0.9; font-size: 14px; }

.section { margin-bottom: 28px; }
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.category-card { cursor: pointer; }
.category-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.category-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--info-bg);
  color: var(--brand-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.category-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.category-meta { font-size: 12px; color: var(--text-tertiary); margin-bottom: 12px; }
.category-list { display: flex; flex-direction: column; }
.cat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  color: var(--text-secondary);
  font-size: 13px;
}
.cat-item-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); }
.cat-item-arrow { margin-left: auto; font-size: 14px; color: var(--text-tertiary); }

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.quick-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--brand-blue);
}
.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--brand-gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 12px;
}
.quick-name { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.quick-desc { font-size: 12px; color: var(--text-tertiary); }
</style>