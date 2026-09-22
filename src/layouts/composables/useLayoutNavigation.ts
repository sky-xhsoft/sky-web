
import { h, type Component } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useNavigationStore } from '../../stores/navigation'
import { getTabTitle } from './tabTitleMap'
import { findMenuTitle, type NavItem } from './menuUtils'
import { componentRegistry } from './componentRegistry'

/**
 * 路由配置
 */
const ROUTE_CONFIG = {
  '/cloud': { component: 'Cloud', titleKey: 'layout.cloud' },
  '/system-management': { component: 'SystemManagement', titleKey: 'layout.systemManagement' },
  '/live/domains': { component: 'LiveDomain', titleKey: 'layout.liveDomain' },
  '/live/push-domains': { component: 'PushDomain', titleKey: 'layout.pushDomains' },
  '/live/play-domains': { component: 'PlayDomain', titleKey: 'layout.playDomains' },
  '/live/streams': { component: 'LiveStream', titleKey: 'layout.liveStreams' },
  '/live/pull-stream': { component: 'PullStreamTask', titleKey: 'layout.pullStream' },
  '/live/distribution': { component: 'PullStreamTask', titleKey: 'layout.pullStream' },
  '/live/pull-stream/create': { component: 'PullStreamTaskForm', titleKey: 'layout.createTask' },
  '/live/highlight-clips': { component: 'LiveHighlightClips', titleKey: 'layout.highlightClips' },
  '/live/recordings': { component: 'LiveRecordings', titleKey: 'layout.recordings' },
  '/live/rooms': { component: 'LiveRoomList', titleKey: 'layout.rooms' },
  '/live/rooms/create': { component: 'LiveRoomForm', titleKey: 'layout.createRoom' },
  '/user/profile': { component: 'UserProfile', titleKey: 'layout.userProfile' },
} as const

/**
 * 动态加载组件
 */
export async function loadComponentByPath(
  path: string,
  navItems: NavItem[],
  t: (key: string) => string,
  navigationStore: ReturnType<typeof useNavigationStore>,
  currentComponent: ReturnType<typeof import('vue').shallowRef>
): Promise<void> {
  // 菜单点击时清空历史栈，因为这是顶级导航
  navigationStore.clearHistory()

  try {
    // 处理元数据路由
    if (path.startsWith('/metadata/')) {
      const match = path.match(/\/metadata\/(?:list|browse)\/(\d+)/)
      if (match) {
        const tableId = match[1]
        let title = '数据列表'
        const foundTitle = findMenuTitle(navItems, path)
        if (foundTitle) title = foundTitle

        const MetadataListView = (await import('../../modules/metadata/views/MetadataListView.vue')).default
        currentComponent.value = MetadataListView
        navigationStore.navigateTo('MetadataListView', title, { tableId: Number(tableId) }, false)
        return
      } else {
        console.warn(`元数据路径格式不正确: ${path}`)
        Message.error(t('error.pagePathError'))
        currentComponent.value = { render: () => h('div', { class: 'empty-page' }, '') }
        return
      }
    }

    // 处理动态表单路由
    if (path.startsWith('/tables/')) {
      const TableView = (await import('@/pages/system/TableView.vue')).default
      currentComponent.value = TableView
      let title = '表单'
      const foundTitle = findMenuTitle(navItems, path)
      if (foundTitle) title = foundTitle
      navigationStore.navigateTo('TableView', title, { tablePath: path }, false)
      return
    }

    // 处理域名详情路由
    if (path === '/live/domains/detail') {
      currentComponent.value = componentRegistry.LiveDomainDetail
      const domainName = new URLSearchParams(window.location.search).get('domain') || ''
      navigationStore.navigateTo('LiveDomainDetail', `${t('layout.domainDetail')} - ${domainName}`, { domainName }, false)
      return
    }

    // 处理任务编辑路由
    if (path === '/live/pull-stream/edit') {
      currentComponent.value = componentRegistry.PullStreamTaskForm
      const taskId = new URLSearchParams(window.location.search).get('id') || ''
      navigationStore.navigateTo('PullStreamTaskForm', t('layout.editTask'), { taskId }, false)
      return
    }

    // 处理房间编辑路由
    if (path === '/live/rooms/edit') {
      currentComponent.value = componentRegistry.LiveRoomForm
      const roomId = new URLSearchParams(window.location.search).get('id') || ''
      navigationStore.navigateTo('LiveRoomForm', t('layout.editRoom'), { roomId }, false)
      return
    }

    // 处理房间详情路由
    if (path === '/live/rooms/detail') {
      currentComponent.value = componentRegistry.LiveRoomDetail
      const detailRoomId = new URLSearchParams(window.location.search).get('id') || ''
      navigationStore.navigateTo('LiveRoomDetail', t('layout.roomDetail'), { id: detailRoomId }, false)
      return
    }

    // 处理根路径
    if (path === '/') {
      return
    }

    // 使用配置处理路由
    const config = ROUTE_CONFIG[path as keyof typeof ROUTE_CONFIG]
    if (config) {
      currentComponent.value = componentRegistry[config.component]
      navigationStore.navigateTo(config.component, t(config.titleKey), {}, false)
      return
    }

    // 未知路径
    console.warn(`未知路径: ${path}`)
    currentComponent.value = { render: () => h('div', { class: 'empty-page' }, '') }
  } catch (e) {
    console.error(`页面加载失败: ${path}`, e)
    Message.error(t('error.pageLoadError'))
    currentComponent.value = { render: () => h('div', { class: 'empty-page' }, '') }
  }
}

/**
 * 获取默认组件
 */
export function getDefaultComponent(loginType: string | null): Component {
  if (loginType === 'cloud') {
    return componentRegistry.CloudDashboard
  }
  if (loginType === 'system') {
    return componentRegistry.SystemDashboard
  }
  return componentRegistry.LiveDashboard
}

/**
 * 获取默认组件名称
 */
export function getDefaultComponentName(loginType: string | null): string {
  if (loginType === 'cloud') {
    return 'CloudDashboard'
  }
  if (loginType === 'system') {
    return 'SystemDashboard'
  }
  return 'LiveDashboard'
}

/**
 * 获取默认标题
 */
export function getDefaultTitle(loginType: string | null, t: (key: string) => string): string {
  if (loginType === 'cloud') {
    return t('cloudDash.title')
  }
  if (loginType === 'system') {
    return t('sysDash.title')
  }
  return t('dashboard.title')
}

/**
 * 检查标签页是否与登录类型匹配
 */
export function isTabMatchingLoginType(
  tabs: Array<{ key: string; componentName: string }>,
  loginType: string | null
): boolean {
  if (tabs.length === 0) return false
  const targetComponent = loginType === 'cloud' ? 'Cloud' : loginType === 'system' ? 'SystemCenter' : 'LiveDashboard'
  return tabs.some(tab => tab.componentName === targetComponent)
}

/**
 * 加载组件通过组件名
 */
export async function loadComponentByName(
  componentName: string,
  currentComponent: ReturnType<typeof import('vue').shallowRef>,
  _t: (key: string) => string
): Promise<void> {
  if (!componentName) {
    return
  }

  try {
    let comp: Component | null = null
    if (componentName === 'MetadataFormView') {
      comp = (await import('../../modules/metadata/views/MetadataFormView.vue')).default
    } else if (componentName === 'MetadataListView') {
      comp = (await import('../../modules/metadata/views/MetadataListView.vue')).default
    } else if (componentRegistry[componentName]) {
      comp = componentRegistry[componentName]
    } else {
      console.warn(`未知组件名: ${componentName}，已显示空白页`)
      comp = { render: () => h('div', { class: 'empty-page' }, '') }
    }
    if (comp) currentComponent.value = comp
  } catch (e) {
    console.error(`组件 ${componentName} 加载失败:`, e)
    currentComponent.value = { render: () => h('div', { class: 'empty-page' }, '') }
  }
}

/**
 * 更新标签页标题
 */
export function updateTabTitles(
  navItems: NavItem[],
  navigationStore: ReturnType<typeof useNavigationStore>,
  t: (key: string) => string
): void {
  const tabs = navigationStore.tabs
  const updatedTabs = tabs.map((tab) => {
    let newTitle = tab.title
    const mappedTitle = getTabTitle(tab.componentName, t, tab.params)
    if (mappedTitle) {
      newTitle = mappedTitle
    } else if (tab.componentName === 'MetadataListView' || tab.componentName === 'TableView') {
      const path = tab.params?.tablePath || (tab.params?.tableId ? `/metadata/list/${tab.params.tableId}` : null)
      if (path) {
        const foundTitle = findMenuTitle(navItems, path)
        if (foundTitle) newTitle = foundTitle
      }
    }
    return { ...tab, title: newTitle }
  })
  navigationStore.replaceTabs(updatedTabs)
}

