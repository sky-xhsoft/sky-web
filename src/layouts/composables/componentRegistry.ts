/**
 * 组件加载器注册表
 * 集中管理所有页面的动态导入，用于 BasicLayout 的代码分割
 */
import { h, type Component, defineAsyncComponent } from 'vue'

const componentLoaders: Record<string, () => Promise<any>> = {
  HomeDashboard: () => import('../../pages/HomeDashboard.vue'),
  Dashboard: () => import('../../pages/Dashboard.vue'),
  Cloud: () => import('../../pages/Cloud.vue'),
  CloudShareManager: () => import('../../pages/CloudShareManager.vue'),
  SystemManagement: () => import('../../pages/SystemManagement.vue'),
  LiveGuide: () => import('../../pages/LiveGuide.vue'),
  TableView: () => import('../../pages/TableView.vue'),
  LiveDomain: () => import('../../pages/LiveDomain.vue'),
  PushDomain: () => import('../../pages/PushDomain.vue'),
  PlayDomain: () => import('../../pages/PlayDomain.vue'),
  LiveDomainDetail: () => import('../../pages/LiveDomainDetail.vue'),
  LiveStream: () => import('../../pages/LiveStream.vue'),
  LivePreview: () => import('../../pages/LivePreview.vue'),
  PullStreamTask: () => import('../../pages/PullStreamTask.vue'),
  PullStreamTaskForm: () => import('../../pages/PullStreamTaskForm.vue'),
  LiveHighlightClips: () => import('../../pages/LiveHighlightClips.vue'),
  LiveHighlightClipPreview: () => import('../../pages/LiveHighlightClipPreview.vue'),
  LiveRecordings: () => import('../../pages/LiveRecordings.vue'),
  LiveRecordingPreview: () => import('../../pages/LiveRecordingPreview.vue'),
  LiveRoomList: () => import('../../pages/LiveRoomList.vue'),
  LiveRoomForm: () => import('../../pages/LiveRoomForm.vue'),
  LiveRoomDetail: () => import('../../pages/LiveRoomDetail.vue'),
  UserProfile: () => import('../../pages/UserProfile.vue'),
  BatchEditPage: () =>
    import('../../modules/metadata/components/DynamicTable/BatchEditPage.vue'),
  PermissionConfig: () => import('../../pages/PermissionConfig.vue'),
  GroupPermissionView: () => import('../../pages/GroupPermissionView.vue'),
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
