<template>
  <aside
    class="side-nav"
    :class="{ collapsed: menuStore.sidebarCollapsed, 'mobile-show': mobileShow }"
  >
    <!-- Logo（折叠时只显示图标） -->
    <a class="v2-logo" @click.prevent="$emit('logoClick')">
      <span class="v2-logo-icon"><ZigeboLogo :size="26" /></span>
      <span v-if="!menuStore.sidebarCollapsed" class="v2-logo-text">
        <span class="brand-title">Zigebo</span>
        <span class="brand-subtitle">{{ brandSubtitle }}</span>
      </span>
    </a>

    <!-- 分组导航 -->
    <nav class="v2-nav">
      <template v-for="group in groups" :key="group.key">
        <div v-if="group.isGroup" class="v2-nav-group">
          {{ group.title }}
        </div>
        <a
          v-if="!group.isGroup || (group.isGroup && group.items.length === 1 && group.singleLeaf)"
          :class="['v2-nav-item', { active: isActive(navKey(group)) }]"
          @click.prevent="$emit('click', navKey(group))"
          :title="group.title"
        >
          <IconApps class="nav-icon" />
          <span v-if="!menuStore.sidebarCollapsed" class="nav-label">{{ group.title }}</span>
        </a>
        <template v-else>
          <a
            v-for="item in group.items"
            :key="item.key"
            :class="['v2-nav-item', { active: isActive(item.key) }]"
            @click.prevent="$emit('click', item.key)"
            :title="item.title"
          >
            <IconApps class="nav-icon" />
            <span v-if="!menuStore.sidebarCollapsed" class="nav-label">{{ item.title }}</span>
          </a>
        </template>
      </template>
    </nav>

    <!-- 折叠开关 -->
    <div class="side-nav__toggle" @click="$emit('toggle')">
      <IconMenuFold v-if="!menuStore.sidebarCollapsed" />
      <IconMenuUnfold v-else />
    </div>

    <!-- 底部用户区 -->
    <div class="v2-user" @click="$emit('userClick')">
      <span class="v2-avatar">{{ userInitial }}</span>
      <div v-if="!menuStore.sidebarCollapsed" class="v2-user-info">
        <div class="v2-user-name">{{ userName }}</div>
        <div class="v2-user-company">{{ t('layout.dataCenter') }}</div>
      </div>
    </div>
  </aside>

  <!-- 移动端遮罩 -->
  <div class="mobile-overlay" :class="{ show: mobileShow }" @click="$emit('toggleMobile')"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconApps, IconMenuFold, IconMenuUnfold } from '@arco-design/web-vue/es/icon'
import { useI18n } from 'vue-i18n'
import { useMenuStore } from '../../stores/menu'
import { useAuthStore } from '../../stores/auth'
import ZigeboLogo from '../../components/ZigeboLogo.vue'
import type { NavItem } from '../composables/menuUtils'

interface Props {
  items: NavItem[]
  openKeys: string[]
  selectedKeys: string[]
  mobileShow: boolean
}
const props = defineProps<Props>()
defineEmits<{
  (e: 'update:openKeys', keys: string[]): void
  (e: 'update:selectedKeys', keys: string[]): void
  (e: 'click', key: string): void
  (e: 'toggle'): void
  (e: 'toggleMobile'): void
  (e: 'logoClick'): void
  (e: 'userClick'): void
}>()
const menuStore = useMenuStore()
const authStore = useAuthStore()
const { t } = useI18n()

// 品牌副标题：根据当前登录系统显示对应系统名
const brandSubtitle = computed(() => {
  const type = authStore.loginType
  if (type === 'live') return t('login.platforms.live')
  if (type === 'cloud') return t('login.platforms.cloud')
  if (type === 'system') return t('login.platforms.system')
  return ''
})

// 把顶层项作为分组标题（若有 children），叶子项直接作为导航项
type Group = { key: string; title: string; isGroup: boolean; items: NavItem[]; singleLeaf?: boolean }
const groups = computed<Group[]>(() =>
  props.items.map((item) => ({
    key: item.key,
    title: item.title,
    isGroup: !!item.children?.length,
    items: item.children?.length ? item.children : [item],
    singleLeaf: !item.children?.length,
  })),
)

const isActive = (key: string) => props.selectedKeys.includes(key) || props.selectedKeys[0] === key
// 叶子项直接用其 key
const navKey = (g: Group) => g.singleLeaf ? g.key : g.items[0].key

const userInitial = computed(() => {
  const name = localStorage.getItem('user_name') || '用'
  return (name || '用').slice(0, 1).toUpperCase()
})
const userName = computed(() => {
  // 显示公司名称，缺省回退到用户姓名
  try {
    const raw = localStorage.getItem('sky-web:company')
    if (raw) {
      const c = JSON.parse(raw)
      if (c && c.name) return c.name
    }
  } catch { /* ignore */ }
  return localStorage.getItem('user_name') || '管理员'
})
</script>

<style scoped>
.side-nav {
  width: var(--sidebar-w);
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  transition: width 0.2s var(--ease-out);
}
.side-nav.collapsed {
  width: 64px;
}
.side-nav.collapsed .v2-nav-group {
  text-align: center;
  padding: 8px 0 2px;
}
.side-nav.collapsed .v2-nav-item {
  justify-content: center;
  padding: 8px 0;
}

.v2-logo {
  height: var(--logo-h);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
  cursor: pointer;
  flex-shrink: 0;
}
.side-nav.collapsed .v2-logo {
  padding: 0;
  justify-content: center;
}
.v2-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--brand-gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.v2-logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
}
.brand-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}
.brand-subtitle {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.side-nav__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  margin: 4px 8px;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-out);
}
.side-nav__toggle:hover {
  background: var(--bg-hover);
  color: var(--brand-blue);
}

.v2-nav {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}
.v2-nav-group {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 10px 10px 4px;
  letter-spacing: 0.05em;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}
.v2-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin: 1px 0;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--duration-fast) var(--ease-out);
}
.v2-nav-item .nav-icon {
  font-size: 17px;
  flex-shrink: 0;
}
.v2-nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.v2-nav-item.active {
  background: var(--brand-gradient-soft);
  color: var(--brand-blue);
  font-weight: 500;
}
.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.v2-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--border-light);
  flex-shrink: 0;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}
.v2-user:hover {
  background: var(--bg-hover);
}
.side-nav.collapsed .v2-user {
  justify-content: center;
  padding: 12px 0;
}
.v2-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--brand-gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.v2-user-info {
  min-width: 0;
}
.v2-user-name {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.v2-user-company {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 19;
}
.mobile-overlay.show {
  display: block;
}
@media (max-width: 768px) {
  .side-nav {
    position: fixed;
    left: calc(-1 * var(--sidebar-w));
    top: 0;
    bottom: 0;
    z-index: 20;
    transition: left 0.3s;
    height: 100vh;
  }
  .side-nav.mobile-show {
    left: 0;
  }
  .side-nav.collapsed {
    width: var(--sidebar-w);
    left: calc(-1 * var(--sidebar-w));
  }
}
</style>