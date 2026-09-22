/**
 * useComponentLoader - 提供基于路径的动态组件加载逻辑
 * 用于 BasicLayout 中根据菜单路径加载对应的页面组件
 */
import { h, type Component, type ShallowRef } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { useNavigationStore } from '../../stores/navigation'
import { useAuthStore } from '../../stores/auth'
import { findMenuTitle } from './menuUtils'

interface NavItem {
  key: string
  title: string
  path?: string
  children?: NavItem[]
}

type ComponentRegistry = Record<string, Component>

interface ComponentLoaderOptions {
  registry: ComponentRegistry
  currentComponent: ShallowRef<Component>
  navItems: { value: NavItem[] }
}

/**
 * 创建组件加载器
 *
 * 根据路径模式分发到不同的组件加载策略：
 * - /metadata/list/{id} 或 /metadata/browse/{id} -> MetadataListView（动态导入）
 * - /tables/xxx -> TableView（动态导入）
 * - 其他静态路径 -> 从 registry 中查找
 */
export function useComponentLoader(options: ComponentLoaderOptions) {
  const { registry, currentComponent, navItems } = options
  const navigationStore = useNavigationStore()
  const authStore = useAuthStore()
  const { t } = useI18n()
  const emptyComponent: Component = {
    render: () => h('div', { class: 'empty-page' }, ''),
  }

  function getRegistryComponent(componentKey: string): Component {
    return registry[componentKey] ?? emptyComponent
  }

  /**
   * 显示空白页（用于错误回退）
   */
  function showEmptyPage() {
    currentComponent.value = emptyComponent
  }

  /**
   * 静态路径映射表
   * { path: { componentKey, titleKey, params? } }
   */
  const staticRouteMap: Record<string, { componentKey: string; titleKey: string }> = {
    '/cloud': { componentKey: 'Cloud', titleKey: 'layout.cloud' },
    '/system-center': { componentKey: 'SystemCenter', titleKey: 'layout.systemCenter' },
    '/system-management': {
      componentKey: 'SystemManagement',
      titleKey: 'layout.systemManagement',
    },
    '/live/domains': { componentKey: 'LiveDomain', titleKey: 'layout.liveDomain' },
    '/live/push-domains': { componentKey: 'PushDomain', titleKey: 'layout.pushDomains' },
    '/live/play-domains': { componentKey: 'PlayDomain', titleKey: 'layout.playDomains' },
    '/live/streams': { componentKey: 'LiveStream', titleKey: 'layout.liveStreams' },
    '/live/pull-stream': { componentKey: 'PullStreamTask', titleKey: 'layout.pullStream' },
    '/live/distribution': { componentKey: 'PullStreamTask', titleKey: 'layout.pullStream' },
    '/live/pull-stream/create': {
      componentKey: 'PullStreamTaskForm',
      titleKey: 'layout.createTask',
    },
    '/live/highlight-clips': {
      componentKey: 'LiveHighlightClips',
      titleKey: 'layout.highlightClips',
    },
    '/live/recordings': { componentKey: 'LiveRecordings', titleKey: 'layout.recordings' },
    '/live/rooms': { componentKey: 'LiveRoomList', titleKey: 'layout.rooms' },
    '/live/rooms/create': { componentKey: 'LiveRoomForm', titleKey: 'layout.createRoom' },
    '/user/profile': { componentKey: 'UserProfile', titleKey: 'layout.userProfile' },
  }

  /**
   * 处理需要 query 参数的路径
   */
  function handleDynamicPath(path: string): boolean {
    const url = new URLSearchParams(window.location.search)

    switch (path) {
      case '/live/domains/detail': {
        const domainName = url.get('domain') || ''
        currentComponent.value = getRegistryComponent('LiveDomainDetail')
        navigationStore.navigateTo(
          'LiveDomainDetail',
          `${t('layout.domainDetail')} - ${domainName}`,
          { domainName },
          false
        )
        return true
      }
      case '/live/pull-stream/edit': {
        const taskId = url.get('id') || ''
        currentComponent.value = getRegistryComponent('PullStreamTaskForm')
        navigationStore.navigateTo(
          'PullStreamTaskForm',
          t('layout.editTask'),
          { taskId },
          false
        )
        return true
      }
      case '/live/rooms/edit': {
        const roomId = url.get('id') || ''
        currentComponent.value = getRegistryComponent('LiveRoomForm')
        navigationStore.navigateTo('LiveRoomForm', t('layout.editRoom'), { roomId }, false)
        return true
      }
      case '/live/rooms/detail': {
        const detailRoomId = url.get('id') || ''
        currentComponent.value = getRegistryComponent('LiveRoomDetail')
        navigationStore.navigateTo(
          'LiveRoomDetail',
          t('layout.roomDetail'),
          { id: detailRoomId },
          false
        )
        return true
      }
    }
    return false
  }

  /**
   * 处理根路径（按登录类型决定默认页面）
   */
  function handleRootPath() {
    const loginType = authStore.loginType
    if (loginType === 'cloud') {
      currentComponent.value = getRegistryComponent('CloudDashboard')
      navigationStore.navigateTo('CloudDashboard', t('cloudDash.title'), {}, false)
    } else if (loginType === 'system') {
      currentComponent.value = getRegistryComponent('SystemDashboard')
      navigationStore.navigateTo('SystemDashboard', t('sysDash.title'), {}, false)
    } else {
      // live 或默认
      currentComponent.value = getRegistryComponent('LiveDashboard')
      navigationStore.navigateTo('LiveDashboard', t('dashboard.title'), {}, false)
    }
  }

  /**
   * 加载元数据列表视图（/metadata/list/{id} 或 /metadata/browse/{id}）
   */
  async function loadMetadataView(path: string): Promise<boolean> {
    const match = path.match(/\/metadata\/(?:list|browse)\/(\d+)/)
    if (!match) {
      console.warn(`元数据路径格式不正确: ${path}`)
      Message.error(t('error.pagePathError'))
      showEmptyPage()
      return true // 已处理（即使是错误情况）
    }

    const tableId = match[1]
    let title = '数据列表'
    const foundTitle = findMenuTitle(navItems.value, path)
    if (foundTitle) title = foundTitle

    const MetadataListView = (
      await import('../../modules/metadata/views/MetadataListView.vue')
    ).default
    currentComponent.value = MetadataListView
    navigationStore.navigateTo(
      'MetadataListView',
      title,
      { tableId: Number(tableId) },
      false
    )
    return true
  }

  /**
   * 加载 TableView（/tables/xxx）
   */
  async function loadTableView(path: string): Promise<boolean> {
    if (!path.startsWith('/tables/')) return false

    const TableView = (await import('@/pages/system/TableView.vue')).default
    currentComponent.value = TableView
    let title = '表单'
    const foundTitle = findMenuTitle(navItems.value, path)
    if (foundTitle) title = foundTitle
    navigationStore.navigateTo('TableView', title, { tablePath: path }, false)
    return true
  }

  /**
   * 主加载函数：根据路径加载对应的组件
   */
  async function loadComponent(path: string) {
    // 顶级导航清空历史栈
    navigationStore.clearHistory()

    try {
      // 1. 元数据路径
      if (path.startsWith('/metadata/')) {
        await loadMetadataView(path)
        return
      }

      // 2. 根路径
      if (path === '/') {
        handleRootPath()
        return
      }

      // 3. 静态路径映射
      const staticRoute = staticRouteMap[path]
      if (staticRoute) {
        currentComponent.value = getRegistryComponent(staticRoute.componentKey)
        navigationStore.navigateTo(
          staticRoute.componentKey,
          t(staticRoute.titleKey),
          {},
          false
        )
        return
      }

      // 4. 带 query 参数的动态路径
      if (handleDynamicPath(path)) return

      // 5. /tables/xxx 动态表单路由
      if (await loadTableView(path)) return

      // 6. 未匹配任何规则
      console.warn(`未匹配的路径: ${path}`)
    } catch (e) {
      console.error(`页面加载失败: ${path}`, e)
      Message.error(t('error.pageLoadError'))
      showEmptyPage()
    }
  }

  return {
    loadComponent,
    showEmptyPage,
  }
}
