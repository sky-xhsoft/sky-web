<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, Message } from '@arco-design/web-vue'
import { IconApps } from '@arco-design/web-vue/es/icon'
import { useMenuStore } from '../stores/menu'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()
const authStore = useAuthStore()

type NavItem = {
  key: string
  title: string
  path?: string
  children?: NavItem[]
}

const mapMenu = (items: any[]): NavItem[] => {
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => item.menuType !== 'button')
    .map((item) => ({
      key: item.path || String(item.id),
      title: item.menuName || item.title || '未命名',
      path: item.path || '/',
      order: item.sortOrder ?? 0,
      children: item.children ? mapMenu(item.children) : undefined,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...rest }) => rest)
}

const navItems = computed<NavItem[]>(() => {
  if (menuStore.menus.length) return mapMenu(menuStore.menus) || []
  return [
    { key: 'dashboard', title: '首页', path: '/' },
  ]
})

const keyPathMap = computed(() => {
  const map = new Map<string, string>()
  const walk = (items?: NavItem[]) => {
    items?.forEach((item) => {
      if (item.path) map.set(item.key, item.path)
      if (item.children?.length) walk(item.children)
    })
  }
  walk(navItems.value)
  return map
})

const selectedKeys = computed(() => {
  const matched = Array.from(keyPathMap.value.entries()).find(([, p]) => p === route.path)
  return matched ? [matched[0]] : []
})

const onMenuClick = (key: string) => {
  const targetPath = keyPathMap.value.get(key)
  if (targetPath) {
    router.push(targetPath)
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

onMounted(async () => {
  if (!menuStore.menus.length && authStore.isAuthenticated) {
    try {
      await menuStore.loadMenus()
    } catch (e) {
      Message.error('加载菜单失败')
    }
  }
})
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider collapsible breakpoint="xl" :width="220">
      <div class="logo">
        <span class="logo-mark">Sky</span>
        <span class="logo-text">Admin</span>
      </div>
      <Menu
        :selected-keys="selectedKeys"
        :default-open-keys="['home']"
        @menu-item-click="onMenuClick"
        auto-open-selected
        theme="dark"
      >
        <template v-for="item in navItems" :key="item.key">
          <Menu.SubMenu v-if="item.children?.length" :key="item.key">
            <template #icon>
              <IconApps />
            </template>
            <template #title>{{ item.title }}</template>
            <Menu.Item v-for="child in item.children" :key="child.key">
              {{ child.title }}
            </Menu.Item>
          </Menu.SubMenu>
          <Menu.Item v-else :key="item.key">
            <template #icon>
              <IconApps />
            </template>
            {{ item.title }}
          </Menu.Item>
        </template>
      </Menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="app-header">
        <div class="header-left">
          <span class="app-name">Sky Web 管理后台</span>
        </div>
        <div class="header-right">
          <a-button type="text" size="small">个人中心</a-button>
          <a-button type="text" size="small" @click="handleLogout">退出</a-button>
        </div>
      </a-layout-header>
      <a-layout-content class="app-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}
.logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 8px;
  border-radius: 8px;
  background: linear-gradient(135deg, #165dff, #00a870);
  color: #fff;
  font-size: 14px;
}
.logo-text {
  font-size: 15px;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid var(--color-border);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.app-content {
  margin: 16px;
  padding: 16px;
  background: #f6f7fb;
  min-height: calc(100vh - 64px);
}
</style>

