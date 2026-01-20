<script setup lang="ts">
import { computed, onMounted, ref, watch, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, Message } from '@arco-design/web-vue'
import { IconApps } from '@arco-design/web-vue/es/icon'
import { useMenuStore } from '../stores/menu'
import { useAuthStore } from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'

// 导入常用组件
import Dashboard from '../pages/Dashboard.vue'
import Cloud from '../pages/Cloud.vue'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()
const authStore = useAuthStore()
const navigationStore = useNavigationStore()

// 组件映射表
const componentRegistry: Record<string, any> = {
  Dashboard,
  Cloud,
}

// 当前显示的组件（使用 shallowRef 提高性能）
const currentComponent = shallowRef(Dashboard)

type NavItem = {
  key: string
  title: string
  path?: string
  children?: NavItem[]
}

const mapMenu = (items: any[]): NavItem[] => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => ({
      key: item.path || item.id || item.name,
      title: item.title || item.displayName || item.menuName || item.name || '未命名',
      path: item.path,
      order: item.orderno ?? item.sortOrder ?? 0,
      children: item.children ? mapMenu(item.children) : undefined,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...rest }) => rest)
}

const navItems = computed<NavItem[]>(() => {
  const mapped =
    menuStore.navMenus.length ? mapMenu(menuStore.navMenus) : menuStore.menus.length ? mapMenu(menuStore.menus) : []
  const defaults: NavItem[] = [
    { key: 'dashboard', title: '首页', path: '/' },
    { key: 'cloud', title: '云盘', path: '/cloud' },
  ]
  const merged = [...mapped]
  defaults.forEach((item) => {
    if (!merged.some((m) => m.key === item.key)) merged.push(item)
  })
  return merged
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

// 当前选中的菜单项
const currentMenuKey = ref('dashboard')

const selectedKeys = computed(() => {
  return [currentMenuKey.value]
})

const rootMenus = computed(() => navItems.value)
const selectedRootKey = ref<string | null>(null)
const rootSelectedKeys = computed(() => {
  if (selectedRootKey.value) return [selectedRootKey.value]
  return rootMenus.value.length ? [rootMenus.value[0].key] : []
})
const sidebarItems = computed(() => {
  const currentRoot =
    rootMenus.value.find((item) => item.key === selectedRootKey.value) || rootMenus.value[0]
  return currentRoot?.children || []
})
const defaultOpenKeys = computed(() => {
  const firstWithChildren = sidebarItems.value.find((item) => item.children?.length)
  if (firstWithChildren) return [firstWithChildren.key]
  return sidebarItems.value.length ? [sidebarItems.value[0].key] : []
})
const openKeys = ref<string[]>([])

/**
 * 动态加载组件
 */
async function loadComponent(path: string) {
  // 根据路径判断需要加载的组件
  if (path.startsWith('/metadata/')) {
    // 元数据系统
    const match = path.match(/\/metadata\/(?:list|browse)\/(\d+)/)
    if (match) {
      const tableId = match[1]
      const MetadataListView = (await import('../modules/metadata/views/MetadataListView.vue')).default
      currentComponent.value = MetadataListView
      navigationStore.navigateTo('MetadataListView', '数据列表', { tableId: Number(tableId) })
      return
    }
  }

  // 其他路由
  switch (path) {
    case '/':
      currentComponent.value = componentRegistry.Dashboard
      navigationStore.navigateTo('Dashboard', '首页')
      break
    case '/cloud':
      currentComponent.value = componentRegistry.Cloud
      navigationStore.navigateTo('Cloud', '云盘')
      break
    default:
      // 动态表单路由 /tables/xxx
      if (path.startsWith('/tables/')) {
        const TableView = (await import('../pages/TableView.vue')).default
        currentComponent.value = TableView
        navigationStore.navigateTo('TableView', '表单', { tablePath: path })
      }
  }
}

const onMenuClick = async (key: string) => {
  currentMenuKey.value = key
  const targetPath = keyPathMap.value.get(key)
  if (targetPath) {
    // 不使用路由跳转，而是动态加载组件
    await loadComponent(targetPath)
  }
}

const onRootClick = async (key: string) => {
  selectedRootKey.value = key
  currentMenuKey.value = key
  const targetPath = keyPathMap.value.get(key)
  if (targetPath) {
    // 不使用路由跳转，而是动态加载组件
    await loadComponent(targetPath)
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

const goHome = async () => {
  currentMenuKey.value = 'dashboard'
  await loadComponent('/')
}

onMounted(async () => {
  if (!menuStore.menus.length && authStore.isAuthenticated) {
    try {
      await menuStore.loadMenus()
    } catch (e) {
      Message.error('加载菜单失败')
    }
  }

  if (!selectedRootKey.value && rootMenus.value.length) {
    selectedRootKey.value = rootMenus.value[0].key
  }

  openKeys.value = defaultOpenKeys.value
})

watch(
  () => rootMenus.value,
  (val) => {
    if (!val?.length) return
    if (!selectedRootKey.value || !val.some((v) => v.key === selectedRootKey.value)) {
      selectedRootKey.value = val[0].key
    }
  },
  { immediate: true }
)

watch(
  () => sidebarItems.value,
  () => {
    openKeys.value = defaultOpenKeys.value
  },
  { immediate: true }
)
</script>

<template>
  <a-layout class="app-shell">
    <a-layout-header class="app-header">
      <div class="header-inner">
        <div class="header-left-wrap">
          <div class="brand-area" role="button" tabindex="0" @click="goHome">
            <div class="logo-mark">AI</div>
            <div class="brand-text">
              <div class="brand-title">XH-TEC</div>
              <div class="brand-subtitle">数据中心</div>
            </div>
          </div>
          <div class="root-menu-bar">
            <Menu
              mode="horizontal"
              :selected-keys="rootSelectedKeys"
              @menu-item-click="onRootClick"
              class="root-menu-flat"
              :ellipsis="false"
            >
              <Menu.Item v-for="item in rootMenus" :key="item.key">
                {{ item.title }}
              </Menu.Item>
            </Menu>
          </div>
        </div>
        <div class="header-actions">
          <a-button type="text" size="small">个人中心</a-button>
          <a-button type="text" size="small" @click="handleLogout">退出</a-button>
        </div>
      </div>
    </a-layout-header>
    <a-layout class="main-layout">
      <a-layout-sider class="side-nav" :width="230">
        <Menu
          :selected-keys="selectedKeys"
          :default-open-keys="defaultOpenKeys"
          :open-keys="openKeys"
          @open-change="(keys) => (openKeys = keys as string[])"
          @menu-item-click="onMenuClick"
          auto-open-selected
          theme="light"
        >
          <template v-for="item in sidebarItems" :key="item.key">
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
        <a-layout-content class="app-content">
          <!-- 使用动态组件，传递 navigationStore 中的参数 -->
          <!-- key 确保每次切换都创建新实例 -->
          <component
            :is="currentComponent"
            v-bind="navigationStore.current.params"
            :key="navigationStore.current.componentName + '-' + JSON.stringify(navigationStore.current.params)"
          />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f5f6fa;
}
.app-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  padding-bottom: 12px;
  background: #ffffff;
  color: #1f2937;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.header-left-wrap {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}
.brand-area {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  width: 230px;
  min-width: 230px;
  justify-content: center;
}
.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #165dff, #34c759);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}
.brand-text {
  line-height: 1.2;
}
.brand-title {
  font-size: 16px;
  font-weight: 700;
}
.brand-subtitle {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}
.root-menu-bar :deep(.arco-menu-horizontal) {
  background: transparent;
  color: #1f2937;
  border: none;
}
.root-menu-bar {
  flex: 1;
  min-width: 0;
  display: flex;
  overflow: visible;
}
.root-menu-bar :deep(.arco-menu-horizontal .arco-menu-item) {
  padding: 0 16px;
  margin: 0 4px;
}
.root-menu-bar :deep(.arco-menu-horizontal .arco-menu-inner) {
  padding-left: 20px;
}
.root-menu-bar :deep(.arco-menu-selected) {
  background: rgba(22, 93, 255, 0.1);
  color: #165dff;
}
.header-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.main-layout {
}
.side-nav {
  background: #f8f9fb;
  border-right: 1px solid #e5e7eb;
}
.side-nav :deep(.arco-menu) {
  background: transparent;
  padding-left: 20px;
}
.side-nav :deep(.arco-menu-item) {
  border-radius: 6px;
  margin: 4px 8px;
}
.side-nav :deep(.arco-menu-selected) {
  background: rgba(22, 93, 255, 0.12);
  color: #165dff;
}
.arco-menu-inner{
  padding: 14px 0px;
}

.app-content {
  padding: 20px;
  background: #ffffff;
  min-height: calc(100vh - 120px);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
}
</style>
