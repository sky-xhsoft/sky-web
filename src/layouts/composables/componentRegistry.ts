/**
 * 组件加载器注册表
 * 集中管理所有页面的动态导入，用于 BasicLayout 的代码分割
 */
import { h, type Component, defineAsyncComponent } from 'vue'

const componentLoaders: Record<string, () => Promise<any>> = {
  HomeDashboard: () => import('@/pages/common/HomeDashboard.vue'),
  Dashboard: () => import('@/pages/common/Dashboard.vue'),
  Cloud: () => import('@/pages/cloud/Cloud.vue'),
  CloudShareManager: () => import('@/pages/cloud/CloudShareManager.vue'),
  SystemManagement: () => import('@/pages/system/SystemManagement.vue'),
  TableView: () => import('@/pages/system/TableView.vue'),
  LiveDomain: () => import('@/pages/live/LiveDomain.vue'),
  PushDomain: () => import('@/pages/live/PushDomain.vue'),
  PlayDomain: () => import('@/pages/live/PlayDomain.vue'),
  LiveDomainDetail: () => import('@/pages/live/LiveDomainDetail.vue'),
  LiveStream: () => import('@/pages/live/LiveStream.vue'),
  LivePreview: () => import('@/pages/live/LivePreview.vue'),
  PullStreamTask: () => import('@/pages/live/PullStreamTask.vue'),
  LiveTemplates: () => import('@/pages/live/LiveTemplates.vue'),
  LiveSpeechTasks: () => import('@/pages/live/LiveSpeechTasks.vue'),
  LiveBilling: () => import('@/pages/live/LiveBilling.vue'),
  BillingAdmin: () => import('@/pages/system/BillingAdmin.vue'),
  PullStreamTaskForm: () => import('@/pages/live/PullStreamTaskForm.vue'),
  LiveHighlightClips: () => import('@/pages/live/LiveHighlightClips.vue'),
  LiveHighlightClipPreview: () => import('@/pages/live/LiveHighlightClipPreview.vue'),
  LiveRecordings: () => import('@/pages/live/LiveRecordings.vue'),
  LiveRecordingPreview: () => import('@/pages/live/LiveRecordingPreview.vue'),
  LiveRoomList: () => import('@/pages/live/LiveRoomList.vue'),
  LiveRoomForm: () => import('@/pages/live/LiveRoomForm.vue'),
  LiveRoomDetail: () => import('@/pages/live/LiveRoomDetail.vue'),
  LiveTranslation: () => import('@/pages/live/LiveTranslation.vue'),
  UserProfile: () => import('@/pages/system/UserProfile.vue'),
  UserCenterPage: () => import('@/pages/system/UserCenterPage.vue'),
  BatchEditPage: () =>
    import('../../modules/metadata/components/DynamicTable/BatchEditPage.vue'),
  SystemCenter: () => import('@/pages/system/SystemCenter.vue'),
  LiveDashboard: () => import('@/pages/live/LiveDashboard.vue'),
  CloudDashboard: () => import('@/pages/cloud/CloudDashboard.vue'),
  SystemDashboard: () => import('@/pages/system/SystemDashboard.vue'),
}

// 使用 defineAsyncComponent 包装所有组件加载器，实现按需代码分割
const componentRegistry: Record<string, Component> = {}

for (const [name, loader] of Object.entries(componentLoaders)) {
  componentRegistry[name] = defineAsyncComponent({
    loader,
    delay: 0,
    loadingComponent: { render: () => h('div', { class: 'component-loading' }, '') },
    errorComponent: { render: () => h('div', { class: 'component-loading' }, '') },
    timeout: 30000,
  })
}

export { componentRegistry, componentLoaders }
