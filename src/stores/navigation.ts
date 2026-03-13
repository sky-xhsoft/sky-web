/**
 * 导航状态管理 - 隐式路由方案
 * 切换菜单时不改变 URL，通过状态管理控制显示的组件
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface NavigationState {
  componentName: string     // 当前显示的组件名
  title: string            // 当前标题
  params?: Record<string, any>  // 传递给组件的参数
}

export interface TabItem {
  key: string              // 唯一标识：componentName + JSON.stringify(params)
  title: string            // 标签显示标题
  componentName: string    // 组件名称
  params: Record<string, any> // 组件参数
  isFixed?: boolean        // 是否固定（首页固定不可关闭）
}

export const useNavigationStore = defineStore('navigation', () => {
  // 当前导航状态
  const current = ref<NavigationState>({
    componentName: 'HomeDashboard',
    title: '首页',
    params: {}
  })

  // 导航历史栈
  const history = ref<NavigationState[]>([])

  // 标签页状态
  const tabs = ref<TabItem[]>([
    {
      key: 'HomeDashboard-{}',
      title: '首页',
      componentName: 'HomeDashboard',
      params: {},
      isFixed: true
    }
  ])
  const activeTabKey = ref<string>('HomeDashboard-{}')
  const keepAliveIncludes = ref<string[]>(['HomeDashboard'])

  // 从localStorage恢复标签页状态
  const loadTabsFromStorage = () => {
    const savedTabs = localStorage.getItem('navigation_tabs')
    const savedActiveKey = localStorage.getItem('navigation_active_tab')

    // 确保首页标签始终存在
    const homeTab: TabItem = {
      key: 'HomeDashboard-{}',
      title: '首页',
      componentName: 'HomeDashboard',
      params: {},
      isFixed: true
    }

    if (savedTabs) {
      try {
        const parsedTabs = JSON.parse(savedTabs)
        // 处理旧数据：确保只有首页是固定标签，其他标签都可关闭
        const processedTabs = parsedTabs
          .filter((tab: TabItem) => tab.key !== 'LiveRoomList-{}') // 移除旧的默认固定标签
          .map((tab: TabItem) => ({
            ...tab,
            isFixed: false // 其他标签都不是固定的
          }))

        // 检查是否已经有首页标签
        const hasHomeTab = processedTabs.some((tab: TabItem) => tab.key === 'HomeDashboard-{}')
        if (!hasHomeTab) {
          // 没有首页标签，添加到最前面
          tabs.value = [homeTab, ...processedTabs]
        } else {
          // 确保首页标签是固定的
          tabs.value = processedTabs.map((tab: TabItem) =>
            tab.key === 'HomeDashboard-{}' ? { ...tab, isFixed: true } : tab
          )
        }

        // 如果处理后没有其他标签，只保留首页
        if (tabs.value.length === 0) {
          tabs.value = [homeTab]
        }
      } catch (e) {
        console.error('Failed to load tabs from localStorage', e)
        // 加载失败，使用默认标签
        tabs.value = [homeTab]
      }
    } else {
      // 没有保存的标签，使用默认标签
      tabs.value = [homeTab]
    }

    if (savedActiveKey) {
      // 确保激活的标签存在
      const tabExists = tabs.value.some(tab => tab.key === savedActiveKey)
      // 如果之前的激活标签是旧默认的直播间管理，现在默认改为首页
      if (tabExists && savedActiveKey !== 'LiveRoomList-{}') {
        activeTabKey.value = savedActiveKey
      } else {
        // 激活的标签不存在或者是旧默认页，默认激活首页
        activeTabKey.value = 'HomeDashboard-{}'
      }
    } else {
      activeTabKey.value = 'HomeDashboard-{}'
    }

    // 同步当前导航状态到激活的标签
    const activeTab = tabs.value.find(tab => tab.key === activeTabKey.value)
    if (activeTab) {
      current.value = {
        componentName: activeTab.componentName,
        title: activeTab.title,
        params: activeTab.params
      }
    }
  }

  // 保存标签页状态到localStorage
  const saveTabsToStorage = () => {
    localStorage.setItem('navigation_tabs', JSON.stringify(tabs.value))
    localStorage.setItem('navigation_active_tab', activeTabKey.value)
  }

  // 初始化时加载保存的状态
  loadTabsFromStorage()

  // 监听标签页变化，自动保存
  watch([tabs, activeTabKey], () => {
    saveTabsToStorage()
  }, { deep: true })

  /**
   * 生成标签唯一key
   */
  function generateTabKey(componentName: string, params?: Record<string, any>): string {
    return `${componentName}-${JSON.stringify(params || {})}`
  }

  /**
   * 添加新标签页或切换到已存在的标签
   */
  function addTab(componentName: string, title: string, params?: Record<string, any>): void {
    const key = generateTabKey(componentName, params)
    const existingTab = tabs.value.find(tab => tab.key === key)

    if (existingTab) {
      // 标签已存在，直接切换
      switchTab(key)
      return
    }

    // 添加新标签
    const newTab: TabItem = {
      key,
      title,
      componentName,
      params: params || {},
      isFixed: false
    }
    tabs.value.push(newTab)

    // 添加到keep-alive缓存
    if (!keepAliveIncludes.value.includes(componentName)) {
      keepAliveIncludes.value.push(componentName)
    }

    // 切换到新标签
    switchTab(key)
  }

  /**
   * 关闭指定标签页
   */
  function removeTab(key: string): void {
    const index = tabs.value.findIndex(tab => tab.key === key)
    if (index === -1) return

    const tab = tabs.value[index]
    if (tab.isFixed) return // 固定标签不可关闭

    // 从标签列表中移除
    tabs.value.splice(index, 1)

    // 如果关闭的是当前激活的标签，切换到相邻标签
    if (key === activeTabKey.value) {
      let newActiveKey: string
      if (index < tabs.value.length) {
        newActiveKey = tabs.value[index].key
      } else {
        newActiveKey = tabs.value[tabs.value.length - 1].key
      }
      switchTab(newActiveKey)
    }

    // 检查是否还有其他页面使用该组件，没有则从缓存中移除
    const componentName = tab.componentName
    const hasOtherTab = tabs.value.some(t => t.componentName === componentName)
    if (!hasOtherTab) {
      const cacheIndex = keepAliveIncludes.value.indexOf(componentName)
      if (cacheIndex > -1) {
        keepAliveIncludes.value.splice(cacheIndex, 1)
      }
    }
  }

  /**
   * 切换到指定标签页
   */
  function switchTab(key: string): void {
    const tab = tabs.value.find(tab => tab.key === key)
    if (!tab) return

    activeTabKey.value = key
    current.value = {
      componentName: tab.componentName,
      title: tab.title,
      params: tab.params
    }
  }

  /**
   * 关闭其他标签页
   */
  function closeOtherTabs(key: string): void {
    const currentTab = tabs.value.find(tab => tab.key === key)
    if (!currentTab) return

    tabs.value = tabs.value.filter(tab => tab.isFixed || tab.key === key)

    // 清理缓存
    const usedComponents = new Set(tabs.value.map(t => t.componentName))
    keepAliveIncludes.value = keepAliveIncludes.value.filter(c => usedComponents.has(c))

    // 切换到当前标签
    switchTab(key)
  }

  /**
   * 关闭所有可关闭的标签页
   */
  function closeAllTabs(): void {
    // 只保留固定标签
    tabs.value = tabs.value.filter(tab => tab.isFixed)

    // 清理缓存
    const usedComponents = new Set(tabs.value.map(t => t.componentName))
    keepAliveIncludes.value = keepAliveIncludes.value.filter(c => usedComponents.has(c))

    // 切换到第一个标签
    if (tabs.value.length > 0) {
      switchTab(tabs.value[0].key)
    }
  }

  /**
   * 更新指定标签的标题
   */
  function updateTabTitle(key: string, newTitle: string): void {
    const tab = tabs.value.find(t => t.key === key)
    if (tab) {
      tab.title = newTitle
    }
  }

  /**
   * 更新当前激活标签的标题
   */
  function updateCurrentTabTitle(newTitle: string): void {
    updateTabTitle(activeTabKey.value, newTitle)
  }

  /**
   * 导航到指定组件
   * @param pushToHistory 是否将当前页面推入历史栈（默认true）
   */
  function navigateTo(componentName: string, title: string, params?: Record<string, any>, pushToHistory: boolean = true) {
    // 将当前页面推入历史栈
    if (pushToHistory) {
      history.value.push({ ...current.value })
    }

    current.value = {
      componentName,
      title,
      params: params || {}
    }

    // 自动添加到标签页
    addTab(componentName, title, params)
  }

  /**
   * 返回上一页
   * @returns 是否成功返回（如果历史栈为空则返回false）
   */
  function goBack(): boolean {
    if (history.value.length > 0) {
      const previous = history.value.pop()!
      // 不推入历史栈，避免循环
      current.value = previous

      // 切换到对应的标签页
      const key = generateTabKey(previous.componentName, previous.params)
      switchTab(key)

      return true
    }
    return false
  }

  /**
   * 清空历史栈
   */
  function clearHistory() {
    history.value = []
  }

  /**
   * 获取历史栈长度
   */
  function getHistoryLength(): number {
    return history.value.length
  }

  return {
    current,
    history,
    tabs,
    activeTabKey,
    keepAliveIncludes,
    navigateTo,
    goBack,
    clearHistory,
    getHistoryLength,
    addTab,
    removeTab,
    switchTab,
    closeOtherTabs,
    closeAllTabs,
    updateTabTitle,
    updateCurrentTabTitle
  }
})
