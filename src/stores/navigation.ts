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
  isFixed?: boolean        // 是否固定（没有固定标签）
}

export const useNavigationStore = defineStore('navigation', () => {
  // 当前导航状态 - 初始为空，由 BasicLayout 根据登录类型初始化
  const current = ref<NavigationState>({
    componentName: '',
    title: '',
    params: {}
  })

  // 导航历史栈
  const history = ref<NavigationState[]>([])

  // 标签页状态 - 没有默认标签
  const tabs = ref<TabItem[]>([])
  const activeTabKey = ref<string>('')
  const keepAliveIncludes = ref<string[]>([])

  // 从localStorage恢复标签页状态
  const loadTabsFromStorage = () => {
    const savedTabs = localStorage.getItem('navigation_tabs')
    const savedActiveKey = localStorage.getItem('navigation_active_tab')

    if (savedTabs) {
      try {
        const parsedTabs = JSON.parse(savedTabs)
        // 移除旧的首页标签
        const processedTabs = parsedTabs
          .filter((tab: TabItem) => tab.key !== 'HomeDashboard-{}')
          .map((tab: TabItem) => ({
            ...tab,
            isFixed: false // 没有固定标签
          }))

        tabs.value = processedTabs

        // 如果没有标签，则为空
        if (tabs.value.length === 0) {
          activeTabKey.value = ''
        }
      } catch (e) {
        console.error('Failed to load tabs from localStorage', e)
        // 加载失败，使用空标签
        tabs.value = []
      }
    } else {
      // 没有保存的标签，使用空标签
      tabs.value = []
    }

    if (savedActiveKey) {
      // 确保激活的标签存在且不是首页
      const tabExists = tabs.value.some(tab => tab.key === savedActiveKey && tab.key !== 'HomeDashboard-{}')
      if (tabExists) {
        activeTabKey.value = savedActiveKey
      } else {
        activeTabKey.value = tabs.value.length > 0 ? tabs.value[0].key : ''
      }
    } else {
      activeTabKey.value = tabs.value.length > 0 ? tabs.value[0].key : ''
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
      if (tabs.value.length > 0) {
        let newActiveKey: string
        if (index < tabs.value.length) {
          newActiveKey = tabs.value[index].key
        } else {
          newActiveKey = tabs.value[tabs.value.length - 1].key
        }
        switchTab(newActiveKey)
      } else {
        activeTabKey.value = ''
        current.value = {
          componentName: '',
          title: '',
          params: {}
        }
      }
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
    // 没有固定标签，直接清空
    tabs.value = []
    activeTabKey.value = ''
    current.value = {
      componentName: '',
      title: '',
      params: {}
    }

    // 清理缓存
    keepAliveIncludes.value = []
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
    if (pushToHistory && current.value.componentName) {
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
