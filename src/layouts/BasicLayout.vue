<script setup lang="ts">
import { SUBSYSTEMS, availableSubsystems, canUseSubsystem, isSubSystem, subsystemHomePath } from '@/constants/subsystems'
import { computed, onMounted, ref, watch, shallowRef, nextTick, h, onBeforeUnmount, defineAsyncComponent, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { IconClose, IconCloseCircle, IconMoon, IconSun, IconExport } from '@arco-design/web-vue/es/icon'
import { useMenuStore } from '../stores/menu'
import { useThemeStore } from '../stores/theme'
import { useAuthStore } from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'
import { getTabTitle } from './composables/tabTitleMap'
import { findMenuTitle } from './composables/menuUtils'
import LayoutTabContextMenu from './components/LayoutTabContextMenu.vue'
import LayoutSidebar from './components/LayoutSidebar.vue'

// 导入常用组件
import HomeDashboard from '@/pages/common/HomeDashboard.vue'
// 元数据视图静态导入：避免异步加载期间旧组件被挂载上新标签页的参数（刷新后 tableId=NaN）
import MetadataListView from '../modules/metadata/views/MetadataListView.vue'
import MetadataFormView from '../modules/metadata/views/MetadataFormView.vue'

// 页面按需加载：首次打开时才下载对应代码（异步包装组件本身同步可用，不影响标签页切换）
const Dashboard = defineAsyncComponent(() => import('@/pages/common/Dashboard.vue'))
const Cloud = defineAsyncComponent(() => import('@/pages/cloud/Cloud.vue'))
const CloudShareManager = defineAsyncComponent(() => import('@/pages/cloud/CloudShareManager.vue'))
const SystemManagement = defineAsyncComponent(() => import('@/pages/system/SystemManagement.vue'))
const SystemCenter = defineAsyncComponent(() => import('@/pages/system/SystemCenter.vue'))
const CloudDashboard = defineAsyncComponent(() => import('@/pages/cloud/CloudDashboard.vue'))
const SystemDashboard = defineAsyncComponent(() => import('@/pages/system/SystemDashboard.vue'))
const LiveDashboard = defineAsyncComponent(() => import('@/pages/live/LiveDashboard.vue'))
const TableView = defineAsyncComponent(() => import('@/pages/system/TableView.vue'))
const LiveDomain = defineAsyncComponent(() => import('@/pages/live/LiveDomain.vue'))
const PushDomain = defineAsyncComponent(() => import('@/pages/live/PushDomain.vue'))
const PlayDomain = defineAsyncComponent(() => import('@/pages/live/PlayDomain.vue'))
const LiveDomainDetail = defineAsyncComponent(() => import('@/pages/live/LiveDomainDetail.vue'))
const LiveStream = defineAsyncComponent(() => import('@/pages/live/LiveStream.vue'))
const LivePreview = defineAsyncComponent(() => import('@/pages/live/LivePreview.vue'))
const PullStreamTask = defineAsyncComponent(() => import('@/pages/live/PullStreamTask.vue'))
const PullStreamTaskForm = defineAsyncComponent(() => import('@/pages/live/PullStreamTaskForm.vue'))
const LiveTemplates = defineAsyncComponent(() => import('@/pages/live/LiveTemplates.vue'))
const LiveHighlightClips = defineAsyncComponent(() => import('@/pages/live/LiveHighlightClips.vue'))
const LiveHighlightClipPreview = defineAsyncComponent(() => import('@/pages/live/LiveHighlightClipPreview.vue'))
const LiveRecordings = defineAsyncComponent(() => import('@/pages/live/LiveRecordings.vue'))
const LiveRecordingPreview = defineAsyncComponent(() => import('@/pages/live/LiveRecordingPreview.vue'))
const LiveRoomList = defineAsyncComponent(() => import('@/pages/live/LiveRoomList.vue'))
const LiveRoomForm = defineAsyncComponent(() => import('@/pages/live/LiveRoomForm.vue'))
const LiveRoomDetail = defineAsyncComponent(() => import('@/pages/live/LiveRoomDetail.vue'))
const LiveTranslation = defineAsyncComponent(() => import('@/pages/live/LiveTranslation.vue'))
const LiveSpeechTasks = defineAsyncComponent(() => import('@/pages/live/LiveSpeechTasks.vue'))
const LiveBilling = defineAsyncComponent(() => import('@/pages/live/LiveBilling.vue'))
const UserProfile = defineAsyncComponent(() => import('@/pages/system/UserProfile.vue'))
const CompanyConfig = defineAsyncComponent(() => import('@/pages/system/CompanyConfig.vue'))
const BillingAdmin = defineAsyncComponent(() => import('@/pages/system/BillingAdmin.vue'))
const UserCenterPage = defineAsyncComponent(() => import('@/pages/system/UserCenterPage.vue'))
const PermissionManagement = defineAsyncComponent(() => import('@/pages/system/PermissionManagement.vue'))
const BatchEditPage = defineAsyncComponent(() => import('../modules/metadata/components/DynamicTable/BatchEditPage.vue'))

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()
const authStore = useAuthStore()
const navigationStore = useNavigationStore()
const themeStore = useThemeStore()
const { t } = useI18n()

// 标签页右键菜单当前操作的key
const currentRightClickTabKey = ref<string>('')
// 右键菜单显示状态
const contextMenuVisible = ref(false)
// 右键菜单位置
const contextMenuPosition = ref({ x: 0, y: 0 })
// 移动端侧边栏显示控制
const mobileSidebarShow = ref(false)
// 标签栏容器（用于滚动定位活跃 tab）
const tabBarRef = ref<HTMLElement | null>(null)

// 活跃 tab 变化时，自动滚动到可视区（保证"当前活跃"标签可见）
watch(
  () => navigationStore.activeTabKey,
  (key) => {
    if (!key) return
    nextTick(() => {
      const bar = tabBarRef.value
      if (!bar) return
      const activeEl = bar.querySelector('.v2-tab.active') as HTMLElement | null
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    })
  }
)

/**
 * 处理标签页右键点击
 */
const handleTabContextMenu = (e: MouseEvent, key: string) => {
  e.preventDefault()
  e.stopPropagation()
  currentRightClickTabKey.value = key
  contextMenuPosition.value = { x: e.clientX, y: e.clientY }
  contextMenuVisible.value = true
}

/**
 * 关闭右键菜单
 */
const closeContextMenu = () => {
  contextMenuVisible.value = false
}

// 监听点击事件，关闭右键菜单
if (typeof window !== 'undefined') {
  window.addEventListener('click', closeContextMenu)
}

// 组件卸载时清理事件监听器
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', closeContextMenu)
  }
})

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
  contextMenuVisible.value = false
}

// 组件映射表
const componentRegistry: Record<string, Component> = {
  HomeDashboard,
  Dashboard,
  Cloud,
  CloudShareManager,
  SystemManagement,
      SystemCenter,
      CloudDashboard,
      SystemDashboard,
      LiveDashboard,
  TableView,
  LiveDomain,
  PushDomain,
  PlayDomain,
  LiveDomainDetail,
  LiveStream,
  LivePreview,
  PullStreamTask,
  PullStreamTaskForm,
  LiveTemplates,
  LiveSpeechTasks,
  LiveBilling,
  LiveHighlightClips,
  LiveHighlightClipPreview,
  LiveRecordings,
  LiveRecordingPreview,
  LiveRoomList,
  LiveRoomForm,
  LiveRoomDetail,
    LiveTranslation,
    UserProfile,
      CompanyConfig,
      BillingAdmin,
      UserCenterPage,
      PermissionManagement,
      BatchEditPage,
    }

// 当前显示的组件（使用 shallowRef 提高性能）
const currentComponent = shallowRef<Component>(HomeDashboard)

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
      title: item.title, // 直接使用菜单的 title，已经根据语言翻译过了
      path: item.path || item.url,
      order: item.orderno ?? item.sortOrder ?? 0,
      children: item.children ? mapMenu(item.children) : undefined,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...rest }) => rest)
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

  try {
    // 根据路径判断需要加载的组件
    if (path.startsWith('/metadata/')) {
      // 元数据系统
      const match = path.match(/\/metadata\/(?:list|browse)\/(\d+)/)
      if (match) {
        const tableId = match[1]
        // 从菜单中获取对应的标题
        let title = '数据列表'
        const foundTitle = findMenuTitle(navItems.value, path)
        if (foundTitle) title = foundTitle

        currentComponent.value = MetadataListView
        navigationStore.navigateTo('MetadataListView', title, { tableId: Number(tableId) }, false)
        return
      } else {
        // 元数据路径格式不正确，显示空白页
        console.warn(`元数据路径格式不正确: ${path}`)
        Message.error(t('error.pagePathError'))
        currentComponent.value = {
          render: () => h('div', { class: 'empty-page' }, '')
        }
        return
      }
    }

  // 其他路由
    switch (path) {
      case '/LiveDashboard':
        currentComponent.value = componentRegistry.LiveDashboard
        navigationStore.navigateTo('LiveDashboard', t('dashboard.title'), {}, false)
        break
      case '/CloudDashboard':
        currentComponent.value = componentRegistry.CloudDashboard
        navigationStore.navigateTo('CloudDashboard', t('cloudDash.title'), {}, false)
        break
      case '/SystemDashboard':
        currentComponent.value = componentRegistry.SystemDashboard
        navigationStore.navigateTo('SystemDashboard', t('sysDash.title'), {}, false)
        break
      case '/':
      // 根路径不显示首页，根据登录类型跳转到对应系统的默认页面
      const loginType = authStore.loginType
            if (loginType === 'live') {
                    currentComponent.value = componentRegistry.LiveDashboard
                    navigationStore.navigateTo('LiveDashboard', t('dashboard.title'), {}, false)
                  } else if (loginType === 'cloud') {
                    currentComponent.value = componentRegistry.CloudDashboard
                    navigationStore.navigateTo('CloudDashboard', t('cloudDash.title'), {}, false)
                  } else if (loginType === 'system') {
                    currentComponent.value = componentRegistry.SystemDashboard
                    navigationStore.navigateTo('SystemDashboard', t('sysDash.title'), {}, false)
                  } else {
                          // 默认跳转到直播系统的默认页面
                          currentComponent.value = componentRegistry.LiveDashboard
                          navigationStore.navigateTo('LiveDashboard', t('dashboard.title'), {}, false)
                        }
                        break
    case '/cloud':
              currentComponent.value = componentRegistry.Cloud
              navigationStore.navigateTo('Cloud', t('layout.cloud'), {}, false)
              break
            case '/cloud/shares':
          currentComponent.value = componentRegistry.CloudShareManager
          navigationStore.navigateTo('CloudShareManager', t('cloud.myShares'), {}, false)
          break
        case '/system-center':
          currentComponent.value = componentRegistry.SystemCenter
          navigationStore.navigateTo('SystemCenter', t('layout.systemCenter'), {}, false)
          break
        case '/system-management':
      currentComponent.value = componentRegistry.SystemManagement
      navigationStore.navigateTo('SystemManagement', t('layout.systemManagement'), {}, false)
      break
    case '/live/domains':
      currentComponent.value = componentRegistry.LiveDomain
      navigationStore.navigateTo('LiveDomain', t('layout.liveDomain'), {}, false)
      break
    case '/live/push-domains':
      currentComponent.value = componentRegistry.PushDomain
      navigationStore.navigateTo('PushDomain', t('layout.pushDomains'), {}, false)
      break
    case '/live/play-domains':
      currentComponent.value = componentRegistry.PlayDomain
      navigationStore.navigateTo('PlayDomain', t('layout.playDomains'), {}, false)
      break
    case '/live/domains/detail':
      currentComponent.value = componentRegistry.LiveDomainDetail
      // 从查询参数中获取域名
      const domainName = new URLSearchParams(window.location.search).get('domain') || ''
      navigationStore.navigateTo('LiveDomainDetail', `${t('layout.domainDetail')} - ${domainName}`, { domainName }, false)
      break
    case '/live/streams':
      currentComponent.value = componentRegistry.LiveStream
      navigationStore.navigateTo('LiveStream', t('layout.liveStreams'), {}, false)
      break
    case '/live/templates':
      currentComponent.value = componentRegistry.LiveTemplates
      navigationStore.navigateTo('LiveTemplates', t('layout.liveTemplates'), {}, false)
      break
    case '/live/speech-tasks':
      currentComponent.value = componentRegistry.LiveSpeechTasks
      navigationStore.navigateTo('LiveSpeechTasks', t('layout.liveSpeechTasks'), {}, false)
      break
    case '/live/billing':
      currentComponent.value = componentRegistry.LiveBilling
      navigationStore.navigateTo('LiveBilling', t('layout.liveBilling'), {}, false)
      break
    case '/live/pull-stream':
    case '/live/distribution':
      currentComponent.value = componentRegistry.PullStreamTask
      navigationStore.navigateTo('PullStreamTask', t('layout.pullStream'), {}, false)
      break
    case '/live/pull-stream/create':
      currentComponent.value = componentRegistry.PullStreamTaskForm
      navigationStore.navigateTo('PullStreamTaskForm', t('layout.createTask'), {}, false)
      break
    case '/live/pull-stream/edit':
      currentComponent.value = componentRegistry.PullStreamTaskForm
      const taskId = new URLSearchParams(window.location.search).get('id') || ''
      navigationStore.navigateTo('PullStreamTaskForm', t('layout.editTask'), { taskId }, false)
      break
    case '/live/highlight-clips':
      currentComponent.value = componentRegistry.LiveHighlightClips
      navigationStore.navigateTo('LiveHighlightClips', t('layout.highlightClips'), {}, false)
      break
    case '/live/recordings':
      currentComponent.value = componentRegistry.LiveRecordings
      navigationStore.navigateTo('LiveRecordings', t('layout.recordings'), {}, false)
      break
    case '/live/rooms':
      currentComponent.value = componentRegistry.LiveRoomList
      navigationStore.navigateTo('LiveRoomList', t('layout.rooms'), {}, false)
      break
    case '/live/rooms/create':
      currentComponent.value = componentRegistry.LiveRoomForm
      navigationStore.navigateTo('LiveRoomForm', t('layout.createRoom'), {}, false)
      break
    case '/live/rooms/edit':
      currentComponent.value = componentRegistry.LiveRoomForm
      const roomId = new URLSearchParams(window.location.search).get('id') || ''
      navigationStore.navigateTo('LiveRoomForm', t('layout.editRoom'), { roomId }, false)
      break
    case '/live/rooms/detail':
      currentComponent.value = componentRegistry.LiveRoomDetail
      const detailRoomId = new URLSearchParams(window.location.search).get('id') || ''
      navigationStore.navigateTo('LiveRoomDetail', t('layout.roomDetail'), { id: detailRoomId }, false)
      break
    case '/user/profile':
          currentComponent.value = componentRegistry.UserCenterPage
          navigationStore.navigateTo('UserCenterPage', t('layout.userProfile'), {}, false)
          break
    case '/system/billing':
      currentComponent.value = componentRegistry.BillingAdmin
      navigationStore.navigateTo('BillingAdmin', t('layout.billingAdmin'), {}, false)
      break
    case '/system/company-config':
      currentComponent.value = componentRegistry.CompanyConfig
      navigationStore.navigateTo('CompanyConfig', '公司配置', {}, false)
      break
    case '/system/permission':
      currentComponent.value = componentRegistry.PermissionManagement
      navigationStore.navigateTo('PermissionManagement', '权限矩阵', {}, false)
      break
    default:
      // 动态表单路由 /tables/xxx
      if (path.startsWith('/tables/')) {
        const TableView = (await import('@/pages/system/TableView.vue')).default
        currentComponent.value = TableView
        // 从菜单中获取对应的标题
        let title = '表单'
        const foundTitle = findMenuTitle(navItems.value, path)
        if (foundTitle) title = foundTitle
        navigationStore.navigateTo('TableView', title, { tablePath: path }, false)
      }
    }
  } catch (e) {
    // 组件加载失败或超时，显示空白页
    console.error(`页面加载失败: ${path}`, e)
    Message.error(t('error.pageLoadError'))
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

// ==================== 子系统切换 ====================
// 可切换的子系统：系统中心仅公司 1 的用户可见
const systemOptions = computed(() => availableSubsystems(authStore.currentCompanyId()))
// 当前子系统：未记录或无权使用时（如旧会话）按视频系统处理，与默认主页一致
const currentSystem = computed(() => systemOptions.value.find((s) => s.key === authStore.loginType) || SUBSYSTEMS[0])
const currentSystemLabel = computed(() => t(currentSystem.value.labelKey))

/**
 * 切换子系统：菜单、标签页、主页都按子系统区分，切换后清空当前标签页与菜单缓存并重新载入目标系统主页，
 * 避免残留上一个系统的页面；登录令牌不变，无需重新登录
 */
const handleSwitchSystem = (value: unknown) => {
  if (!isSubSystem(value) || value === currentSystem.value.key) return
  if (!canUseSubsystem(value, authStore.currentCompanyId())) return
  navigationStore.closeAllTabs()
  menuStore.reset()
  authStore.switchSystem(value)
  window.location.assign(subsystemHomePath(value))
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
    // 登录页不显示系统中心：从系统中心退出时回到视频系统的登录页
    router.push({ name: 'login', query: { type: savedLoginType === 'system' ? 'live' : savedLoginType } })
  } else {
    router.push({ name: 'login' })
  }
}

const goHome = async () => {
  // 跳转到对应系统的默认页面，而不是首页
  const loginType = authStore.loginType
  if (loginType === 'live') {
    currentComponent.value = componentRegistry.LiveDashboard
    navigationStore.navigateTo('LiveDashboard', t('dashboard.title'), {}, false)
  } else if (loginType === 'cloud') {
    await loadComponent('/cloud')
  } else {
    // 默认跳转到直播系统的默认页面
    currentComponent.value = componentRegistry.LiveDashboard
    navigationStore.navigateTo('LiveDashboard', t('dashboard.title'), {}, false)
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
 * 打开个人中心
 */
const handleProfile = async () => {
  await loadComponent('/user/profile')
}

const onUserClick = () => {
  handleProfile()
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
    } catch {
      Message.error('加载菜单失败')
    }
  }

  if (!selectedRootKey.value && rootMenus.value.length) {
    selectedRootKey.value = rootMenus.value[0].key
  }

  openKeys.value = defaultOpenKeys.value

  // 根据登录类型初始化显示的页面（确保刷新时正确显示）
  if (authStore.isAuthenticated) {
    // 检查当前标签页是否与登录类型匹配
    const loginType = authStore.loginType
    const isTabMatchingType = navigationStore.tabs.length > 0 && (
      (loginType === 'live' && navigationStore.tabs.some(tab => tab.componentName === 'LiveDashboard')) ||
      (loginType === 'cloud' && navigationStore.tabs.some(tab => tab.componentName === 'CloudDashboard')) ||
      (loginType === 'system' && navigationStore.tabs.some(tab => tab.componentName === 'SystemDashboard'))
    )

    // 如果没有标签页，或者标签页类型不匹配，重新加载
    if (navigationStore.tabs.length === 0 || !isTabMatchingType) {
      navigationStore.closeAllTabs()
      if (loginType === 'live') {
        navigationStore.initializeDefaultTab('LiveDashboard', t('dashboard.title'), {})
        currentComponent.value = componentRegistry.LiveDashboard
      } else if (loginType === 'cloud') {
        navigationStore.initializeDefaultTab('CloudDashboard', t('cloudDash.title'), {})
        currentComponent.value = componentRegistry.CloudDashboard
      } else if (loginType === 'system') {
        navigationStore.initializeDefaultTab('SystemDashboard', t('sysDash.title'), {})
        currentComponent.value = componentRegistry.SystemDashboard
      } else {
        navigationStore.initializeDefaultTab('LiveDashboard', t('dashboard.title'), {})
        currentComponent.value = componentRegistry.LiveDashboard
      }
    } else {
      if (loginType === 'live' && currentComponent.value !== componentRegistry.LiveDashboard) {
        currentComponent.value = componentRegistry.LiveDashboard
      } else if (loginType === 'cloud' && currentComponent.value !== componentRegistry.CloudDashboard) {
        currentComponent.value = componentRegistry.CloudDashboard
      } else if (loginType === 'system' && currentComponent.value !== componentRegistry.SystemDashboard) {
        currentComponent.value = componentRegistry.SystemDashboard
      }
    }
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
              currentComponent.value = componentRegistry.LiveDashboard
            } else if (loginType === 'cloud') {
              currentComponent.value = componentRegistry.CloudDashboard
            } else if (loginType === 'system') {
              currentComponent.value = componentRegistry.SystemDashboard
            } else {
              // 默认跳转到直播系统的默认页面
              currentComponent.value = componentRegistry.LiveDashboard
            }
            return
    }
    try {
      let comp: Component | null = null
      if (componentName === 'MetadataFormView') {
        comp = MetadataFormView
      } else if (componentName === 'MetadataListView') {
        comp = MetadataListView
      } else if (componentRegistry[componentName]) {
        comp = componentRegistry[componentName]
      } else {
        console.warn(`未知组件名: ${componentName}，已显示空白页`)
        comp = { render: () => h('div', { class: 'empty-page' }, '') }
      }
      // 期间若已切换到其他标签页，丢弃过期结果，避免组件与参数错配
      if (componentName !== navigationStore.current.componentName) return
      if (comp) currentComponent.value = comp
    } catch (e) {
      console.error(`组件 ${componentName} 加载失败:`, e)
      currentComponent.value = { render: () => h('div', { class: 'empty-page' }, '') }
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
  (newVal) => {
    if (newVal) {
          // 检查当前标签页是否与登录类型匹配
          const loginType = authStore.loginType
          const isTabMatchingType = navigationStore.tabs.length > 0 && (
                      (loginType === 'live' && navigationStore.tabs.some(tab => tab.componentName === 'LiveDashboard')) ||
                      (loginType === 'cloud' && navigationStore.tabs.some(tab => tab.componentName === 'CloudDashboard')) ||
                      (loginType === 'system' && navigationStore.tabs.some(tab => tab.componentName === 'SystemDashboard'))
                    )

                    // 如果没有标签页，或者标签页类型不匹配，重新加载
                    if (navigationStore.tabs.length === 0 || !isTabMatchingType) {
                      navigationStore.closeAllTabs()
                      if (loginType === 'live') {
                        navigationStore.initializeDefaultTab('LiveDashboard', t('dashboard.title'), {})
                      } else if (loginType === 'cloud') {
                        navigationStore.initializeDefaultTab('CloudDashboard', t('cloudDash.title'), {})
                      } else if (loginType === 'system') {
                        navigationStore.initializeDefaultTab('SystemDashboard', t('sysDash.title'), {})
                      } else {
                        // 默认跳转到直播系统的默认页面
                        navigationStore.initializeDefaultTab('LiveDashboard', t('dashboard.title'), {})
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
      } else {
        // 当路径是 '/' 时，根据登录类型显示对应的页面（兼容旧落点）
        const loginType = authStore.loginType
        if (loginType === 'live') {
          currentComponent.value = componentRegistry.LiveDashboard
        } else if (loginType === 'cloud') {
          currentComponent.value = componentRegistry.Cloud
        } else {
          currentComponent.value = componentRegistry.LiveDashboard
        }
      }
    }
  },
  { immediate: true }
)

// 监听菜单语言版本变化，确保语言切换时菜单也更新
watch(
  () => menuStore.localeVersion,
  () => {
    // 语言切换时，重新设置默认展开的菜单
    if (sidebarItems.value.length) {
      openKeys.value = defaultOpenKeys.value
    }
    // 更新所有已打开标签页的标题
    updateTabTitles()
  }
)

// 更新标签页标题的辅助函数
const updateTabTitles = () => {
  const tabs = navigationStore.tabs
  const updatedTabs = tabs.map((tab) => {
    let newTitle = tab.title
    const mappedTitle = getTabTitle(tab.componentName, t, tab.params)
    if (mappedTitle) {
      newTitle = mappedTitle
    } else if (tab.componentName === 'MetadataListView' || tab.componentName === 'TableView') {
      const path = tab.params?.tablePath || (tab.params?.tableId ? `/metadata/list/${tab.params.tableId}` : null)
      if (path) {
        const foundTitle = findMenuTitle(navItems.value, path)
        if (foundTitle) newTitle = foundTitle
      }
    }
    return { ...tab, title: newTitle }
  })
  navigationStore.replaceTabs(updatedTabs)
}
</script>

<template>
  <div class="app-shell">
    <div class="app-shell__inner">
      <LayoutSidebar
        :items="rootMenus"
        :open-keys="openKeys"
        :selected-keys="selectedKeys"
        :mobile-show="mobileSidebarShow"
        @update:open-keys="openKeys = $event"
        @update:selected-keys="selectedKeys = $event"
        @click="onMenuClick"
        @toggle="toggleSidebar"
        @toggle-mobile="toggleMobileSidebar"
                @logo-click="goHome"
                        @user-click="onUserClick"
                                              />
                              <div class="v2-main">
        <!-- 标签页栏 -->
        <div class="v2-tabbar">
          <div class="v2-tabs" ref="tabBarRef">
            <div
              v-for="tab in navigationStore.tabs"
              :key="tab.key"
              :class="['v2-tab', { active: tab.key === navigationStore.activeTabKey }]"
              @click="onTabChange(tab.key)"
              @contextmenu.prevent.stop="(e) => handleTabContextMenu(e, tab.key)"
            >
              <span class="v2-tab__title">{{ tab.title }}</span>
              <i
                v-if="!tab.isFixed"
                class="v2-tab-close"
                @click.stop="onTabClose(tab.key)"
              >×</i>
            </div>
          </div>
          <div class="v2-tabbar-actions">
            <!-- 子系统切换 -->
            <a-dropdown trigger="click" position="br" @select="handleSwitchSystem">
              <button class="v2-system-btn" :title="t('login.switchSystem')" :aria-label="t('login.switchSystem')">
                <icon-swap />
                <span>{{ currentSystemLabel }}</span>
                <icon-down class="v2-system-btn__arrow" />
              </button>
              <template #content>
                <a-doption
                  v-for="sys in systemOptions"
                  :key="sys.key"
                  :value="sys.key"
                  :class="{ 'v2-system-option--active': sys.key === currentSystem.key }"
                >
                  {{ t(sys.labelKey) }}
                </a-doption>
              </template>
            </a-dropdown>
            <button class="v2-icon-btn" :title="t('layout.closeOther')" @click="handleCloseOtherTabs"><icon-close-circle /></button>
            <button class="v2-icon-btn" :title="t('layout.closeAll')" @click="handleCloseAllTabs"><icon-close /></button>
            <button class="v2-icon-btn" :title="themeStore.theme === 'dark' ? t('layout.lightMode') : t('layout.darkMode')" @click="themeStore.toggleTheme">
                          <icon-sun v-if="themeStore.theme === 'dark'" />
                          <icon-moon v-else />
                        </button>
                        <button class="v2-icon-btn" :title="t('layout.logout')" @click="handleLogout"><icon-export /></button>
                      </div>
        </div>

        <div class="v2-content">
          <LayoutTabContextMenu
            :visible="contextMenuVisible"
            :x="contextMenuPosition.x"
            :y="contextMenuPosition.y"
            @close="contextMenuVisible = false"
            @action="onTabContextMenuClick"
          />
          <!-- 使用动态组件，传递 navigationStore 中的参数 -->
                    <!-- out-in 过渡：先淡出旧页面再淡入新页面，避免菜单切换时的闪白/硬切 -->
                    <Transition name="v2-fade" mode="out-in" appear>
                      <keep-alive :include="navigationStore.keepAliveIncludes" :exclude="['BatchEditPage', 'MetadataFormView']" :max="10">
                        <component
                          :is="currentComponent"
                          v-bind="navigationStore.current.params"
                          :key="navigationStore.activeTabKey"
                        />
                      </keep-alive>
                    </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============ 整体外壳：左侧侧边栏 + 右侧主区 ============ */
.app-shell {
  min-height: 100vh;
  background: var(--bg-page);
}
.app-shell__inner {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ============ 右侧主区：标签栏 + 内容 ============ */
.v2-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
}

/* 标签页栏 */
.v2-tabbar {
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}
.v2-tabs {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  min-width: 0;
}
.v2-tabs::-webkit-scrollbar { display: none; }
.v2-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  border-radius: 6px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-out);
}
.v2-tab:hover {
  color: var(--brand-blue);
  background: var(--bg-hover);
}
.v2-tab.active {
  background: var(--brand-blue);
  color: #fff;
  font-weight: 500;
}
.v2-tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-style: normal;
  border-radius: 50%;
  line-height: 1;
  font-size: 13px;
  cursor: pointer;
  opacity: 0.6;
  transition: all var(--duration-fast) var(--ease-out);
}
.v2-tab-close:hover {
  background: rgba(255, 255, 255, 0.25);
  opacity: 1;
}
.v2-tab.active .v2-tab-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

.v2-tabbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.v2-icon-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all var(--duration-fast) var(--ease-out);
}
.v2-icon-btn:hover {
  background: var(--bg-hover);
  color: var(--brand-blue);
}

/* 内容区 */
.v2-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-page);
  padding: 12px 16px;
}

/* 页面切换过渡：菜单切换时旧页淡出新页淡入，避免闪白 */
.v2-fade-enter-active,
.v2-fade-leave-active {
  transition: opacity 0.18s var(--ease-out);
}
.v2-fade-enter-from,
.v2-fade-leave-to {
  opacity: 0;
}

/* ============ 右键菜单（标签页） ============ */
.tab-context-menu {
  position: fixed;
  z-index: 10000;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
  padding: 4px 0;
}
.tab-context-menu :deep(.arco-menu) {
  min-width: 160px;
  border: none;
  box-shadow: none;
  background: var(--bg-card);
}
.tab-context-menu :deep(.arco-menu-item) {
  height: 32px;
  line-height: 32px;
  padding: 0 16px;
  font-size: 14px;
  color: var(--text-primary);
}
.tab-context-menu :deep(.arco-menu-item:hover) {
  background: var(--bg-hover);
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .app-shell__inner {
    height: 100vh;
    display: block;
  }
  .v2-main {
    height: 100vh;
    margin-left: 0;
  }
}

/* 子系统切换 */
.v2-system-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  margin-right: 4px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 6px);
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.v2-system-btn:hover { border-color: var(--brand-blue); color: var(--brand-blue); }
.v2-system-btn__arrow { font-size: 10px; opacity: 0.7; }
:global(.v2-system-option--active) { color: var(--brand-blue); font-weight: 600; }
</style>