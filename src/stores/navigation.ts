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
    componentName: 'Dashboard',
    title: '首页',
    params: {}
  })

  /**
   * 导航到指定组件
   */
  function navigateTo(componentName: string, title: string, params?: Record<string, any>) {
    current.value = {
      componentName,
      title,
      params: params || {}
    }
  }

  return {
    current,
    navigateTo
  }
})
