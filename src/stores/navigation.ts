/**
 * 导航状态管理 - 隐式路由方案
 * 切换菜单时不改变 URL，通过状态管理控制显示的组件
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface NavigationState {
  componentName: string     // 当前显示的组件名
  title: string            // 当前标题
  params?: Record<string, any>  // 传递给组件的参数
}

export const useNavigationStore = defineStore('navigation', () => {
  // 当前导航状态
  const current = ref<NavigationState>({
    componentName: 'LiveRoomList',
    title: '直播间管理',
    params: {}
  })

  // 导航历史栈
  const history = ref<NavigationState[]>([])

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
    navigateTo,
    goBack,
    clearHistory,
    getHistoryLength
  }
})
