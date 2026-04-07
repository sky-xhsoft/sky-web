<script setup lang="ts">
import { computed, onMounted, ref, watch, shallowRef, nextTick, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, Message, Tabs, Dropdown } from '@arco-design/web-vue'
import { IconApps, IconMenuFold, IconMenuUnfold, IconRefresh, IconClose, IconCloseCircle } from '@arco-design/web-vue/es/icon'
import { useMenuStore } from '../stores/menu'
import { useAuthStore } from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'

// 导入常用组件
import HomeDashboard from '../pages/HomeDashboard.vue'
import Dashboard from '../pages/Dashboard.vue'
import Cloud from '../pages/Cloud.vue'
import SystemManagement from '../pages/SystemManagement.vue'
import LiveGuide from '../pages/LiveGuide.vue'
import TableView from '../pages/TableView.vue'
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

// 标签页右键菜单当前操作的key
const currentRightClickTabKey = ref<string>('')
// 移动端侧边栏显示控制
const mobileSidebarShow = ref(false)

// 标签页右键菜单选项
const tabContextMenuOptions = [
  {
    key: 'refresh',
    title: '刷新',
    icon: IconRefresh
  },
  {
    key: 'close',
    title: '关闭',
    icon: IconClose
  },
  {
    key: 'closeOther',
    title: '关闭其他',
    icon: IconCloseCircle
  },
  {
    key: 'closeAll',
    title: '关闭所有',
    icon: IconCloseCircle
  }
]

/**
 * 标签页切换回调
 */
const onTabChange = (key: string) => {
  navigationStore.switchTab(key)
}

/**
 * 标签页关闭回调
 */
const onTabClose = (key: string) => {
  navigationStore.removeTab(key)
}

/**
 * 标签页右键菜单点击回调
 */
const onTabContextMenuClick = (key: string) => {
  const tabKey = currentRightClickTabKey.value
  if (!tabKey) return

  switch (key) {
    case 'refresh':
      // 刷新当前标签页：先从缓存中移除，再重新切换
      const tab = navigationStore.tabs.find(t => t.key === tabKey)
      if (tab) {
        const index = navigationStore.keepAliveIncludes.indexOf(tab.componentName)
        if (index > -1) {
          navigationStore.keepAliveIncludes.splice(index, 1)
        }
        // 下一帧重新添加到缓存
        nextTick(() => {
          if (!navigationStore.keepAliveIncludes.includes(tab.componentName)) {
            navigationStore.keepAliveIncludes.push(tab.componentName)
          }
        })
      }
      break
    case 'close':
      navigationStore.removeTab(tabKey)
      break
    case 'closeOther':
      navigationStore.closeOtherTabs(tabKey)
      break
    case 'closeAll':
      navigationStore.closeAllTabs()
      break
  }
}

/**
 * 标签页右键菜单显示回调
 */
const onTabContextMenu = (key: string) => {
  currentRightClickTabKey.value = key
}

// 组件映射表
const componentRegistry: Record<string, any> = {
  HomeDashboard,
  Dashboard,
  Cloud,
  SystemManagement,
  LiveGuide,
  TableView,
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
const currentComponent = shallowRef(HomeDashboard)

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
const selectedKeys = ref<string[]>(['dashboard'])

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

  // 更新内容容器的margin
  const contentWrapper = document.querySelector('.content-wrapper')
  if (contentWrapper) {
    if (collapsed) {
      contentWrapper.classList.add('collapsed')
    } else {
      contentWrapper.classList.remove('collapsed')
    }
  }
})

/**
 * 动态加载组件
 */
async function loadComponent(path: string) {
  // 菜单点击时清空历史栈，因为这是顶级导航
  navigationStore.clearHistory()

  try {
    // 根据路径判断需要加载的组件
    if (path.startsWith('/metadata/')) {
      // 元数据系统
      const match = path.match(/\/metadata\/(?:list|browse)\/(\d+)/)
      if (match) {
        const tableId = match[1]
        // 从菜单中获取对应的标题
        let title = '数据列表'
        // 遍历菜单查找匹配的路径
        const findMenuTitle = (items: any[]): string | null => {
          for (const item of items) {
            if (item.path === path) {
              return item.title
            }
            if (item.children?.length) {
              const childTitle = findMenuTitle(item.children)
              if (childTitle) return childTitle
            }
          }
          return null
        }
        const foundTitle = findMenuTitle(navItems.value)
        if (foundTitle) {
          title = foundTitle
        }

        const MetadataListView = (await import('../modules/metadata/views/MetadataListView.vue')).default
        currentComponent.value = MetadataListView
        navigationStore.navigateTo('MetadataListView', title, { tableId: Number(tableId) }, false)
        return
      } else {
        // 元数据路径格式不正确，显示空白页
        console.warn(`元数据路径格式不正确: ${path}`)
        Message.error('页面路径不正确')
        currentComponent.value = {
          render: () => h('div', { class: 'empty-page' }, '')
        }
        return
      }
    }

  // 其他路由
  switch (path) {
    case '/':
      // 根路径不显示首页，根据登录类型跳转到对应系统的默认页面
      const loginType = authStore.loginType
      if (loginType === 'live') {
        currentComponent.value = componentRegistry.LiveGuide
        navigationStore.navigateTo('LiveGuide', '视频直播功能说明', {}, false)
      } else if (loginType === 'cloud') {
        currentComponent.value = componentRegistry.Cloud
        navigationStore.navigateTo('Cloud', '云盘', {}, false)
      } else {
        // 默认跳转到直播系统的默认页面
        currentComponent.value = componentRegistry.LiveGuide
        navigationStore.navigateTo('LiveGuide', '视频直播功能说明', {}, false)
      }
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
        // 从菜单中获取对应的标题
        let title = '表单'
        // 遍历菜单查找匹配的路径
        const findMenuTitle = (items: any[]): string | null => {
          for (const item of items) {
            if (item.path === path) {
              return item.title
            }
            if (item.children?.length) {
              const childTitle = findMenuTitle(item.children)
              if (childTitle) return childTitle
            }
          }
          return null
        }
        const foundTitle = findMenuTitle(navItems.value)
        if (foundTitle) {
          title = foundTitle
        }
        navigationStore.navigateTo('TableView', title, { tablePath: path }, false)
      }
    }
  } catch (e) {
    // 组件加载失败或超时，显示空白页
    console.error(`页面加载失败: ${path}`, e)
    Message.error('页面加载失败，请稍后重试')
    currentComponent.value = {
      render: () => h('div', { class: 'empty-page' }, '')
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
  selectedKeys.value = [key]
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
  selectedKeys.value = [key]
  const targetPath = keyPathMap.value.get(key)
  if (targetPath) {
    // 不使用路由跳转，而是动态加载组件
    await loadComponent(targetPath)
  }
}

const handleLogout = async () => {
  // 保存当前的登录类型，用于退出后跳转
  const savedLoginType = authStore.loginType

  // 1. 使用 navigationStore 的 closeAllTabs 方法彻底清理所有标签页和状态
  navigationStore.closeAllTabs()

  // 2. 清理菜单缓存
  menuStore.reset()

  // 3. 重置当前组件显示为空白
  currentComponent.value = {
    render: () => h('div', { class: 'empty-page' }, '')
  }

  // 4. 调用退出登录 API
  await authStore.logout()

  // 5. 跳转到登录页，如果有之前的登录类型，带上该类型
  if (savedLoginType) {
    router.push({ name: 'login', query: { type: savedLoginType } })
  } else {
    router.push({ name: 'login' })
  }
}

const goHome = async () => {
  // 跳转到对应系统的默认页面，而不是首页
  const loginType = authStore.loginType
  if (loginType === 'live') {
    await loadComponent('/LiveGuide')
  } else if (loginType === 'cloud') {
    await loadComponent('/cloud')
  } else {
    // 默认跳转到直播系统的默认页面
    await loadComponent('/LiveGuide')
  }
}

const toggleSidebar = () => {
  if (window.innerWidth <= 768) {
    mobileSidebarShow.value = !mobileSidebarShow.value
  } else {
    menuStore.toggleSidebar()
  }
}

/**
 * 移动端点击遮罩层关闭侧边栏
 */
const toggleMobileSidebar = () => {
  mobileSidebarShow.value = false
}

/**
 * 关闭其他标签页
 */
const handleCloseOtherTabs = () => {
  if (navigationStore.activeTabKey) {
    navigationStore.closeOtherTabs(navigationStore.activeTabKey)
  }
}

/**
 * 关闭全部标签页
 */
const handleCloseAllTabs = () => {
  navigationStore.closeAllTabs()
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

  // 根据登录类型初始化显示的页面
  if (authStore.isAuthenticated) {
    // 检查当前标签页是否与登录类型匹配
    const loginType = authStore.loginType
    const isTabMatchingType = navigationStore.tabs.length > 0 && (
      (loginType === 'live' && navigationStore.tabs.some(tab => tab.componentName === 'LiveGuide')) ||
      (loginType === 'cloud' && navigationStore.tabs.some(tab => tab.componentName === 'Cloud'))
    )

    // 如果没有标签页，或者标签页类型不匹配，重新加载
    if (navigationStore.tabs.length === 0 || !isTabMatchingType) {
      navigationStore.closeAllTabs()
      if (loginType === 'live') {
        await loadComponent('/LiveGuide')
      } else if (loginType === 'cloud') {
        await loadComponent('/cloud')
      } else {
        // 默认跳转到直播系统的默认页面
        await loadComponent('/LiveGuide')
      }
    }
  }

  // 初始化内容容器的折叠状态
  const contentWrapper = document.querySelector('.content-wrapper')
  if (contentWrapper && menuStore.sidebarCollapsed) {
    contentWrapper.classList.add('collapsed')
  }
})

// 监听 navigationStore 的变化，处理组件切换
watch(
  () => navigationStore.current.componentName,
  async (componentName) => {
    if (!componentName) {
      // 组件名为空，根据登录类型显示对应的默认页面，不显示首页
      const loginType = authStore.loginType
      if (loginType === 'live') {
        currentComponent.value = componentRegistry.LiveGuide
        navigationStore.navigateTo('LiveGuide', '视频直播功能说明', {}, false)
      } else if (loginType === 'cloud') {
        currentComponent.value = componentRegistry.Cloud
        navigationStore.navigateTo('Cloud', '云盘', {}, false)
      } else {
        // 默认跳转到直播系统的默认页面
        currentComponent.value = componentRegistry.LiveGuide
        navigationStore.navigateTo('LiveGuide', '视频直播功能说明', {}, false)
      }
      return
    }
    try {
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
      } else {
        // 未知组件，显示空白页
        console.warn(`未知组件名: ${componentName}，已显示空白页`)
        currentComponent.value = {
          render: () => h('div', { class: 'empty-page' }, '')
        }
      }
    } catch (e) {
      // 组件加载失败，显示空白页并提示错误
      console.error(`组件 ${componentName} 加载失败:`, e)
      Message.error(`页面加载失败: ${(e as Error).message}`)
      currentComponent.value = {
        render: () => h('div', { class: 'empty-page' }, '')
      }
    }
  },
  { immediate: true }
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

// 监听认证状态变化，当用户重新登录时检查是否需要重新初始化页面
watch(
  () => authStore.isAuthenticated,
  async (newVal) => {
    if (newVal) {
      // 检查当前标签页是否与登录类型匹配
      const loginType = authStore.loginType
      const isTabMatchingType = navigationStore.tabs.length > 0 && (
        (loginType === 'live' && navigationStore.tabs.some(tab => tab.componentName === 'LiveGuide')) ||
        (loginType === 'cloud' && navigationStore.tabs.some(tab => tab.componentName === 'Cloud'))
      )

      // 如果没有标签页，或者标签页类型不匹配，重新加载
      if (navigationStore.tabs.length === 0 || !isTabMatchingType) {
        navigationStore.closeAllTabs()
        if (loginType === 'live') {
          await loadComponent('/LiveGuide')
        } else if (loginType === 'cloud') {
          await loadComponent('/cloud')
        } else {
          // 默认跳转到直播系统的默认页面
          await loadComponent('/LiveGuide')
        }
      }
    }
  },
  { immediate: true }
)

// 监听路由变化，根据路由路径加载对应的组件
watch(
  () => route.path,
  async (path) => {
    if (authStore.isAuthenticated) {
      // 当路由是 BasicLayout 下的子路由时，加载对应的组件
      if (path !== '/') {
        await loadComponent(path)
      }
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
              <div class="brand-title">ZiGeBo</div>
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
      <aside class="side-nav" :class="{ collapsed: menuStore.sidebarCollapsed, 'mobile-show': mobileSidebarShow }">
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
      <!-- 移动端遮罩层 -->
      <div
        class="mobile-overlay"
        :class="{ show: mobileSidebarShow }"
        @click="toggleMobileSidebar"
      ></div>
      <div class="content-wrapper">
        <!-- 标签页栏 - 现在放在右侧内容区域顶部 -->
        <div class="tabs-bar">
          <!-- 侧边栏折叠按钮 -->
          <div class="sidebar-toggle" @click="toggleSidebar">
            <IconMenuFold v-if="!menuStore.sidebarCollapsed" />
            <IconMenuUnfold v-else />
          </div>
          <a-tabs
            :active-key="navigationStore.activeTabKey"
            type="card"
            :closable="true"
            :editable="true"
            @update:active-key="onTabChange"
            @delete="onTabClose"
            @contextmenu="(e, key) => { e.preventDefault(); onTabContextMenu(key); }"
            class="page-tabs"
          >
            <!-- 标签栏右侧操作按钮 -->
            <template #extra>
              <a-space size="small">
                <a-button size="small" @click="handleCloseOtherTabs">
                  <template #icon><icon-close-circle /></template>
                  关闭其他
                </a-button>
                <a-button size="small" @click="handleCloseAllTabs">
                  <template #icon><icon-close /></template>
                  全部关闭
                </a-button>
              </a-space>
            </template>
            <a-tab-pane
              v-for="tab in navigationStore.tabs"
              :key="tab.key"
              :title="tab.title"
              :closable="!tab.isFixed"
            >
            </a-tab-pane>

            <!-- 右键菜单 -->
            <template #contextMenu>
              <a-dropdown @menu-item-click="onTabContextMenuClick" popup-arrow>
                <template #content>
                  <a-menu>
                    <a-menu-item
                      v-for="item in tabContextMenuOptions"
                      :key="item.key"
                    >
                      <component :is="item.icon" class="mr-2" />
                      {{ item.title }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
          </a-tabs>
        </div>
        <main class="app-content">
          <!-- 使用动态组件，传递 navigationStore 中的参数 -->
          <!-- 使用 keep-alive 缓存页面状态 -->
          <keep-alive :include="navigationStore.keepAliveIncludes">
            <component
              :is="currentComponent"
              v-bind="navigationStore.current.params"
              :key="navigationStore.activeTabKey"
            />
          </keep-alive>
        </main>
      </div>
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

/* 标签页栏样式 - 现在在右侧内容区域顶部 */
.tabs-bar {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.page-tabs {
  height: 40px;
  margin-left: 52px;
}

.page-tabs :deep(.arco-tabs-header) {
  height: 40px;
  padding: 0;
}

.page-tabs :deep(.arco-tabs-nav) {
  height: 40px;
}

.page-tabs :deep(.arco-tabs-tab) {
  height: 39px;
  line-height: 39px;
  padding: 0 16px;
  border-radius: 6px 6px 0 0;
}

.page-tabs :deep(.arco-tabs-tab-active) {
  background: #f5f6fa;
}

.page-tabs :deep(.arco-tabs-tab-btn) {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-tabs :deep(.arco-tabs-tab-remove) {
  margin-left: 8px;
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

/* 右侧内容容器 */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 230px;
  transition: margin-left 0.2s ease;
  height: 100%;
  min-width: 0;
}

.content-wrapper.collapsed {
  margin-left: 48px;
}

.app-content {
  padding: 20px;
  background: #ffffff;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  border-radius: 10px;
  width: calc(100% - 40px);
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  margin: 10px;
}
.sidebar-toggle {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin: 4px 8px 4px 12px;
  float: left;
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
  padding-top: 0 !important;
  margin-top: 0 !important;
}

.side-nav :deep(.arco-menu-root) {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

.side-nav :deep(.arco-menu-inner) {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

.side-nav :deep(.arco-menu-item:first-child) {
  margin-top: 0 !important;
}

.side-nav :deep(.arco-sub-menu:first-child) {
  margin-top: 0 !important;
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
.side-nav :deep(.arco-menu-inner) {
  padding: 8px 0 14px 0 !important;
  margin: 0 !important;
}

/* 响应式适配：小屏幕 */
@media (max-width: 768px) {
  .side-nav {
    position: fixed;
    left: -240px;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transition: left 0.3s ease;
    height: 100vh !important;
  }

  .side-nav.collapsed {
    left: -60px;
  }

  .side-nav.mobile-show {
    left: 0;
    box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  }

  .content-wrapper {
    margin-left: 0 !important;
    width: 100% !important;
  }

  .content-wrapper.collapsed {
    margin-left: 0 !important;
  }

  .tabs-bar {
    padding: 0 8px;
  }

  .page-tabs :deep(.arco-tabs-header) {
    overflow-x: auto;
    overflow-y: hidden;
  }

  .page-tabs :deep(.arco-tabs-nav-list) {
    flex-wrap: nowrap;
  }

  .sidebar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .app-header .header-right {
    gap: 8px;
  }

  .app-header .header-right .user-info span {
    display: none;
  }

  /* 遮罩层 */
  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
    display: none;
  }

  .mobile-overlay.show {
    display: block;
  }

  .brand-area {
    width: auto;
    min-width: auto;
    padding: 0 16px;
  }

  .brand-text {
    display: none;
  }

  .root-menu-bar {
    display: none;
  }
}
</style>
