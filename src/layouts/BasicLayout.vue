<script setup lang="ts">
import { computed, onMounted, ref, watch, shallowRef, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, Message } from '@arco-design/web-vue'
import { IconApps, IconMenuFold, IconMenuUnfold } from '@arco-design/web-vue/es/icon'
import { useMenuStore } from '../stores/menu'
import { useAuthStore } from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'

// 导入常用组件
import Dashboard from '../pages/Dashboard.vue'
import Cloud from '../pages/Cloud.vue'
import SystemManagement from '../pages/SystemManagement.vue'
import LiveGuide from '../pages/LiveGuide.vue'
import LiveDomain from '../pages/LiveDomain.vue'
import PushDomain from '../pages/PushDomain.vue'
import PlayDomain from '../pages/PlayDomain.vue'
import LiveDomainDetail from '../pages/LiveDomainDetail.vue'
import LiveStream from '../pages/LiveStream.vue'
import LivePreview from '../pages/LivePreview.vue'
import PullStreamTask from '../pages/PullStreamTask.vue'
import PullStreamTaskForm from '../pages/PullStreamTaskForm.vue'
import LiveHighlightClips from '../pages/LiveHighlightClips.vue'
import LiveHighlightClipPreview from '../pages/LiveHighlightClipPreview.vue'
import LiveRecordings from '../pages/LiveRecordings.vue'
import LiveRecordingPreview from '../pages/LiveRecordingPreview.vue'
import LiveRoomList from '../pages/LiveRoomList.vue'
import LiveRoomForm from '../pages/LiveRoomForm.vue'
import LiveRoomDetail from '../pages/LiveRoomDetail.vue'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()
const authStore = useAuthStore()
const navigationStore = useNavigationStore()

// 组件映射表
const componentRegistry: Record<string, any> = {
  Dashboard,
  Cloud,
  SystemManagement,
  LiveGuide,
  LiveDomain,
  PushDomain,
  PlayDomain,
  LiveDomainDetail,
  LiveStream,
  LivePreview,
  PullStreamTask,
  PullStreamTaskForm,
  LiveHighlightClips,
  LiveHighlightClipPreview,
  LiveRecordings,
  LiveRecordingPreview,
  LiveRoomList,
  LiveRoomForm,
  LiveRoomDetail,
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
      key: item.path || item.url || item.id || item.name,
      title: item.title || item.displayName || item.menuName || item.name || '未命名',
      path: item.path || item.url,
      order: item.orderno ?? item.sortOrder ?? 0,
      children: item.children ? mapMenu(item.children) : undefined,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...rest }) => rest)
}

const navItems = computed<NavItem[]>(() => {
  const mapped =
    menuStore.navMenus.length ? mapMenu(menuStore.navMenus) : menuStore.menus.length ? mapMenu(menuStore.menus) : []

  // 过滤掉后端返回的首页和云盘（如果存在）
  const filtered = mapped.filter((m) => m.key !== 'dashboard' && m.key !== 'cloud')

  return filtered
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

// 监听折叠状态变化
watch(() => menuStore.sidebarCollapsed, (collapsed) => {
  if (!collapsed && openKeys.value.length === 0) {
    // 仅在展开且 openKeys 为空时，设置默认值
    nextTick(() => {
      openKeys.value = [...defaultOpenKeys.value]
    })
  }
})

/**
 * 动态加载组件
 */
async function loadComponent(path: string) {
  // 菜单点击时清空历史栈，因为这是顶级导航
  navigationStore.clearHistory()

  // 根据路径判断需要加载的组件
  if (path.startsWith('/metadata/')) {
    // 元数据系统
    const match = path.match(/\/metadata\/(?:list|browse)\/(\d+)/)
    if (match) {
      const tableId = match[1]
      const MetadataListView = (await import('../modules/metadata/views/MetadataListView.vue')).default
      currentComponent.value = MetadataListView
      navigationStore.navigateTo('MetadataListView', '数据列表', { tableId: Number(tableId) }, false)
      return
    }
  }

  // 其他路由
  switch (path) {
    case '/':
      currentComponent.value = componentRegistry.LiveRoomList
      navigationStore.navigateTo('LiveRoomList', '直播间管理', {}, false)
      break
    case '/cloud':
      currentComponent.value = componentRegistry.Cloud
      navigationStore.navigateTo('Cloud', '云盘', {}, false)
      break
    case '/system-management':
      currentComponent.value = componentRegistry.SystemManagement
      navigationStore.navigateTo('SystemManagement', '系统管理', {}, false)
      break
    case '/LiveGuide':
      currentComponent.value = componentRegistry.LiveGuide
      navigationStore.navigateTo('LiveGuide', '视频直播功能说明', {}, false)
      break
    case '/live/domains':
      currentComponent.value = componentRegistry.LiveDomain
      navigationStore.navigateTo('LiveDomain', '直播域名管理', {}, false)
      break
    case '/live/push-domains':
      currentComponent.value = componentRegistry.PushDomain
      navigationStore.navigateTo('PushDomain', '推流域名管理', {}, false)
      break
    case '/live/play-domains':
      currentComponent.value = componentRegistry.PlayDomain
      navigationStore.navigateTo('PlayDomain', '播放域名管理', {}, false)
      break
    case '/live/domains/detail':
      currentComponent.value = componentRegistry.LiveDomainDetail
      // 从查询参数中获取域名
      const domainName = new URLSearchParams(window.location.search).get('domain') || ''
      navigationStore.navigateTo('LiveDomainDetail', `域名详情 - ${domainName}`, { domainName }, false)
      break
    case '/live/streams':
      currentComponent.value = componentRegistry.LiveStream
      navigationStore.navigateTo('LiveStream', '直播流管理', {}, false)
      break
    case '/live/pull-stream':
      currentComponent.value = componentRegistry.PullStreamTask
      navigationStore.navigateTo('PullStreamTask', '社媒分发', {}, false)
      break
    case '/live/pull-stream/create':
      currentComponent.value = componentRegistry.PullStreamTaskForm
      navigationStore.navigateTo('PullStreamTaskForm', '创建分发任务', {}, false)
      break
    case '/live/pull-stream/edit':
      currentComponent.value = componentRegistry.PullStreamTaskForm
      const taskId = new URLSearchParams(window.location.search).get('id') || ''
      navigationStore.navigateTo('PullStreamTaskForm', '编辑分发任务', { taskId }, false)
      break
    case '/live/highlight-clips':
      currentComponent.value = componentRegistry.LiveHighlightClips
      navigationStore.navigateTo('LiveHighlightClips', '高光切片', {}, false)
      break
    case '/live/recordings':
      currentComponent.value = componentRegistry.LiveRecordings
      navigationStore.navigateTo('LiveRecordings', '录制列表', {}, false)
      break
    case '/live/rooms':
      currentComponent.value = componentRegistry.LiveRoomList
      navigationStore.navigateTo('LiveRoomList', '直播间管理', {}, false)
      break
    case '/live/rooms/create':
      currentComponent.value = componentRegistry.LiveRoomForm
      navigationStore.navigateTo('LiveRoomForm', '创建直播间', {}, false)
      break
    case '/live/rooms/edit':
      currentComponent.value = componentRegistry.LiveRoomForm
      const roomId = new URLSearchParams(window.location.search).get('id') || ''
      navigationStore.navigateTo('LiveRoomForm', '编辑直播间', { roomId }, false)
      break
    case '/live/rooms/detail':
      currentComponent.value = componentRegistry.LiveRoomDetail
      const detailRoomId = new URLSearchParams(window.location.search).get('id') || ''
      navigationStore.navigateTo('LiveRoomDetail', '直播间详情', { id: detailRoomId }, false)
      break
    default:
      // 动态表单路由 /tables/xxx
      if (path.startsWith('/tables/')) {
        const TableView = (await import('../pages/TableView.vue')).default
        currentComponent.value = TableView
        navigationStore.navigateTo('TableView', '表单', { tablePath: path }, false)
      }
  }
}

const onMenuClick = async (key: string) => {
  // 找到被点击项的父菜单
  let parentKey: string | null = null
  for (const item of sidebarItems.value) {
    if (item.children?.some(child => child.key === key)) {
      parentKey = item.key
      break
    }
  }

  currentMenuKey.value = key
  const targetPath = keyPathMap.value.get(key)
  if (targetPath) {
    // 不使用路由跳转，而是动态加载组件
    await loadComponent(targetPath)
  }

  // 确保父菜单保持展开状态
  if (parentKey && !openKeys.value.includes(parentKey)) {
    openKeys.value = [...openKeys.value, parentKey]
  }
}

const onOpenChange = (keys: string[]) => {
  openKeys.value = keys as string[]
}

const onRootClick = async (key: string) => {
  // 如果切换了根菜单，重置展开状态
  if (selectedRootKey.value !== key) {
    selectedRootKey.value = key
    openKeys.value = defaultOpenKeys.value
  }
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
  // 首页功能已取消，直接跳转到直播间管理页面
  currentMenuKey.value = 'live-rooms'
  await loadComponent('/live/rooms')
}

const toggleSidebar = () => {
  menuStore.toggleSidebar()
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

// 监听 navigationStore 的变化，处理组件切换
watch(
  () => navigationStore.current.componentName,
  async (componentName) => {
    if (componentName === 'MetadataFormView') {
      // 动态加载表单视图组件
      const MetadataFormView = (await import('../modules/metadata/views/MetadataFormView.vue')).default
      currentComponent.value = MetadataFormView
    } else if (componentName === 'MetadataListView') {
      // 动态加载列表视图组件
      const MetadataListView = (await import('../modules/metadata/views/MetadataListView.vue')).default
      currentComponent.value = MetadataListView
    } else if (componentRegistry[componentName]) {
      // 如果组件在 componentRegistry 中，直接使用
      currentComponent.value = componentRegistry[componentName]
    }
  }
)

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
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
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
            <a-menu
              mode="horizontal"
              :selected-keys="rootSelectedKeys"
              @menuItemClick="onRootClick"
              class="root-menu-flat"
              :ellipsis="false"
            >
              <a-menu-item v-for="item in rootMenus" :key="item.key">
                {{ item.title }}
              </a-menu-item>
            </a-menu>
          </div>
        </div>
        <div class="header-actions">
          <a-button type="text" size="small">个人中心</a-button>
          <a-button type="text" size="small" @click="handleLogout">退出</a-button>
        </div>
      </div>
    </header>
    <div class="main-layout">
      <aside class="side-nav" :class="{ collapsed: menuStore.sidebarCollapsed }">
        <a-menu
          v-model:openKeys="openKeys"
          v-model:selectedKeys="selectedKeys"
          @menuItemClick="onMenuClick"
          :accordion="true"
          :collapsed="menuStore.sidebarCollapsed"
          :popup-max-height="400"
        >
          <template v-for="item in sidebarItems" :key="item.key">
            <a-sub-menu v-if="item.children?.length" :key="item.key">
              <template #icon>
                <IconApps />
              </template>
              <template #title>{{ item.title }}</template>
              <a-menu-item v-for="child in item.children" :key="child.key">
                {{ child.title }}
              </a-menu-item>
            </a-sub-menu>
            <a-menu-item v-else :key="item.key">
              <template #icon>
                <IconApps />
              </template>
              {{ item.title }}
            </a-menu-item>
          </template>
        </a-menu>
      </aside>
      <main class="app-content" :class="{ collapsed: menuStore.sidebarCollapsed }">
        <div class="sidebar-toggle" @click="toggleSidebar">
          <IconMenuFold v-if="!menuStore.sidebarCollapsed" />
          <IconMenuUnfold v-else />
        </div>
        <!-- 使用动态组件，传递 navigationStore 中的参数 -->
        <!-- key 确保每次切换都创建新实例 -->
        <component
          :is="currentComponent"
          v-bind="navigationStore.current.params"
          :key="navigationStore.current.componentName + '-' + JSON.stringify(navigationStore.current.params)"
        />
      </main>
    </div>
  </div>
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
  position: relative;
  height: calc(100vh - 64px);
  display: flex;
  overflow: hidden;
}
.side-nav {
  position: fixed;
  left: 0;
  top: 64px;
  height: calc(100vh - 64px);
  width: 230px;
  background: #f8f9fb;
  border-right: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  overflow-y: auto;
  z-index: 10;
}
.side-nav.collapsed {
  width: 48px;
}
.app-content {
  padding: 20px;
  background: #ffffff;
  min-height: 100%;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  position: relative;
  margin-left: 230px;
  transition: margin-left 0.2s ease;
  width: calc(100% - 230px);
}
.app-content.collapsed {
  margin-left: 48px;
  width: calc(100% - 48px);
}
.app-content :deep(.arco-breadcrumb) {
  margin-left: 40px;
}
.sidebar-toggle {
  position: absolute;
  top: 3px;
  left: 0px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  z-index: 100;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.sidebar-toggle:hover {
  background: #f2f3f5;
  border-color: #165dff;
  color: #165dff;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.15);
}
.side-nav {
  background: #f8f9fb;
  border-right: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}
.side-nav :deep(.arco-menu) {
  background: transparent;
  transition: all 0.2s ease;
}
.side-nav :deep(.arco-menu-item) {
  border-radius: 6px;
  margin: 4px 8px;
}
.side-nav :deep(.arco-menu-selected) {
  background: rgba(22, 93, 255, 0.12);
  color: #165dff;
}
.side-nav :deep(.arco-layout-sider-collapsed .arco-menu) {
  padding-left: 0;
}
.side-nav :deep(.arco-layout-sider-collapsed .arco-menu-item) {
  display: flex;
  justify-content: center;
  padding: 0;
  margin: 8px 4px;
}
.side-nav :deep(.arco-layout-sider-collapsed .arco-menu-icon) {
  margin-right: 0;
  font-size: 18px;
}
.side-nav :deep(.arco-layout-sider-collapsed .arco-menu-item-inner) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.arco-menu-inner{
  padding: 14px 0px;
}
</style>
