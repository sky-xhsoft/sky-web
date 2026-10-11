import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { canUseSubsystem, subsystemHomePath } from '@/constants/subsystems'
import { Message } from '@arco-design/web-vue'
import BasicLayout from '../layouts/BasicLayout.vue'
import Welcome from '@/pages/common/Welcome.vue'
import Login from '@/pages/common/Login.vue'
import CompanyRegister from '@/pages/common/CompanyRegister.vue'
import { useAuthStore } from '../stores/auth'
import { useMenuStore } from '../stores/menu'

const routes: RouteRecordRaw[] = [
  {
      path: '/welcome',
      name: 'welcome',
      component: Welcome,
      meta: { title: '欢迎使用', requiresAuth: false },
    },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/company-register',
    name: 'company-register',
    component: CompanyRegister,
    meta: { title: '企业注册', requiresAuth: false },
  },
  {
    path: '/share/:code',
    name: 'share',
    component: () => import('@/pages/cloud/Share.vue'),
    meta: { title: '文件分享', requiresAuth: false },
  },
  {
    // 直播间分享：无需登录观看
    path: '/live-share/:code',
    name: 'live-share',
    component: () => import('@/pages/live/LiveShare.vue'),
    meta: { title: '直播', requiresAuth: false },
  },
  {
    path: '/',
    name: 'root',
    component: BasicLayout,
    meta: { requiresAuth: true },
    children: [
      // 使用隐式路由方案，所有页面都在这个路由下
      // 实际的页面切换由 BasicLayout 中的动态组件控制
      {
              path: '',
              name: 'app',
              component: {  // 空组件，完全由 BasicLayout 控制显示
                render: (h: any) => h('div')
              },
              meta: { title: '应用', requiresAuth: true },
            },
            // 三子系统 Dashboard 独立路由（由 BasicLayout 按路径渲染对应 Dashboard）
            {
              path: 'LiveDashboard',
              name: 'live-dashboard',
              component: { render: (h: any) => h('div') },
              meta: { title: '直播中心', requiresAuth: true },
            },
            {
              path: 'CloudDashboard',
              name: 'cloud-dashboard',
              component: { render: (h: any) => h('div') },
              meta: { title: '云盘中心', requiresAuth: true },
            },
            {
              path: 'SystemDashboard',
              name: 'system-dashboard',
              component: { render: (h: any) => h('div') },
              meta: { title: '系统中心', requiresAuth: true },
            },
      // 直播域名管理页面
      {
        path: 'live/domains',
        name: 'live-domains',
        component: () => import('@/pages/live/LiveDomain.vue'),
        meta: { title: '直播域名管理', requiresAuth: true },
      },
      // 推流域名管理页面
      {
        path: 'live/push-domains',
        name: 'push-domains',
        component: () => import('@/pages/live/PushDomain.vue'),
        meta: { title: '推流域名管理', requiresAuth: true },
      },
      // 播放域名管理页面
      {
        path: 'live/play-domains',
        name: 'play-domains',
        component: () => import('@/pages/live/PlayDomain.vue'),
        meta: { title: '播放域名管理', requiresAuth: true },
      },
      // 直播间列表页面
      {
        path: 'live/rooms',
        name: 'live-rooms',
        component: () => import('@/pages/live/LiveRoomList.vue'),
        meta: { title: '直播间管理', requiresAuth: true },
      },
      // 创建直播间页面
      {
        path: 'live/rooms/create',
        name: 'live-room-create',
        component: () => import('@/pages/live/LiveRoomForm.vue'),
        meta: { title: '创建直播间', requiresAuth: true },
      },
      // 编辑直播间页面
      {
        path: 'live/rooms/edit/:id',
        name: 'live-room-edit',
        component: () => import('@/pages/live/LiveRoomForm.vue'),
        meta: { title: '编辑直播间', requiresAuth: true },
      },
      // 云盘系统
      {
        path: 'cloud',
        name: 'cloud',
        component: () => import('@/pages/cloud/Cloud.vue'),
        meta: { title: '云盘系统', requiresAuth: true },
      },
      // 直播管理详情页面
      {
        path: 'live/rooms/detail/:id',
                name: 'live-room-detail',
                component: () => import('@/pages/live/LiveRoomDetail.vue'),
                meta: { title: '直播间详情', requiresAuth: true },
              },
              {
                path: 'live/rooms/detail/:id/translation',
                name: 'live-room-translation',
                component: () => import('@/pages/live/LiveTranslation.vue'),
                meta: { title: '同传/字幕', requiresAuth: true },
              },
      // 分享管理页面
      {
        path: 'cloud/shares',
        name: 'cloud-shares',
        component: () => import('@/pages/cloud/CloudShareManager.vue'),
        meta: { title: '我的分享', requiresAuth: true },
      },
      // 系统中心首页
      {
        path: 'system-center',
        name: 'system-center',
        component: () => import('@/pages/system/SystemCenter.vue'),
        meta: { title: '系统中心', requiresAuth: true },
      },
      // 个人中心页面
      {
        path: 'user/profile',
        name: 'user-profile',
        component: () => import('@/pages/system/UserProfile.vue'),
        meta: { title: '个人中心', requiresAuth: true },
      },
    ],
  },
  // 404 通配路由
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../components/NotFoundPage.vue'),
    meta: { title: '页面不存在', requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false)
  const isLoginRoute = to.name === 'login'
  const isWelcomeRoute = to.name === 'welcome'
  const hasTypeParam = to.query.type !== undefined && to.query.type !== null && to.query.type !== ''

  // 登录类型 → Dashboard 首页路径（子系统独立路由，按登录类型加载对应 Dashboard）
  const systemHomePath = (type: string) => subsystemHomePath(type)

  // 系统中心仅公司 1 的用户可用：其他公司访问系统中心（直接输入地址、旧书签、旧会话记录的系统）时改为进入视频系统
  if (auth.isAuthenticated && !canUseSubsystem('system', auth.currentCompanyId())) {
    const wantsSystem = to.path === subsystemHomePath('system') || to.query.type === 'system' || auth.loginType === 'system'
    if (wantsSystem) {
      auth.switchSystem('live')
      next({ path: subsystemHomePath('live') })
      return
    }
  }

  // 如果已经登录且 URL 中有 type 参数，访问任何路径都直接跳转到对应系统页面
  if (auth.isAuthenticated && hasTypeParam) {
    const loginType = (to.query.type as string) || 'live'
    // 只有当目标路径不是对应系统页面时才跳转
    const targetPath = systemHomePath(loginType)
    if (to.path !== targetPath) {
      next({ path: targetPath })
      return
    }
  }

  // 当欢迎页面且有 type 参数时，直接跳转到登录页面，不显示首页
    if (isWelcomeRoute && hasTypeParam && !auth.isAuthenticated) {
    next({ name: 'login', query: { type: to.query.type } })
    return
  }

  if (isWelcomeRoute && auth.isAuthenticated) {
    const loginType = (to.query.type as string) || 'live'
    const targetPath = systemHomePath(loginType)
    next({ path: targetPath })
    return
  }

  if (isLoginRoute && auth.isAuthenticated) {
    const loginType = (to.query.type as string) || 'live'
    const targetPath = systemHomePath(loginType)
    next({ path: targetPath })
    return
  }

  if (requiresAuth && !auth.isAuthenticated) {
    if (to.name === 'app' || to.fullPath === '/') {
      // 默认路由访问需要认证时，重定向到欢迎页面
      next({ name: 'welcome' })
    } else {
      next({ name: 'login', query: { redirect: to.fullPath } })
    }
    return
  }

  if (!isLoginRoute && !isWelcomeRoute && auth.isAuthenticated) {
      const menuStore = useMenuStore()
      if (!menuStore.menus.length && !menuStore.loading) {
        try {
          await menuStore.loadMenus()
        } catch {
          Message.error('加载菜单失败')
        }
      }
    }

  next()
})

export default router