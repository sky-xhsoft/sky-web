import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import BasicLayout from '../layouts/BasicLayout.vue'
import Dashboard from '../pages/Dashboard.vue'
import Welcome from '../pages/Welcome.vue'
import Login from '../pages/Login.vue'
import Share from '../pages/Share.vue'
import LiveDomain from '../pages/LiveDomain.vue'
import PushDomain from '../pages/PushDomain.vue'
import PlayDomain from '../pages/PlayDomain.vue'
import LiveRoomList from '../pages/LiveRoomList.vue'
import LiveRoomForm from '../pages/LiveRoomForm.vue'
import { useAuthStore } from '../stores/auth'
import { useMenuStore } from '../stores/menu'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
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
    path: '/share/:code',
    name: 'share',
    component: Share,
    meta: { title: '文件分享', requiresAuth: false },
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
        component: LiveRoomList,  // 默认显示直播间管理页面
        meta: { title: '应用', requiresAuth: true },
      },
      // 直播域名管理页面
      {
        path: 'live/domains',
        name: 'live-domains',
        component: LiveDomain,
        meta: { title: '直播域名管理', requiresAuth: true },
      },
      // 推流域名管理页面
      {
        path: 'live/push-domains',
        name: 'push-domains',
        component: PushDomain,
        meta: { title: '推流域名管理', requiresAuth: true },
      },
      // 播放域名管理页面
      {
        path: 'live/play-domains',
        name: 'play-domains',
        component: PlayDomain,
        meta: { title: '播放域名管理', requiresAuth: true },
      },
      // 直播间列表页面
      {
        path: 'live/rooms',
        name: 'live-rooms',
        component: LiveRoomList,
        meta: { title: '直播间管理', requiresAuth: true },
      },
      // 创建直播间页面
      {
        path: 'live/rooms/create',
        name: 'live-room-create',
        component: LiveRoomForm,
        meta: { title: '创建直播间', requiresAuth: true },
      },
      // 编辑直播间页面
      {
        path: 'live/rooms/edit/:id',
        name: 'live-room-edit',
        component: LiveRoomForm,
        meta: { title: '编辑直播间', requiresAuth: true },
      },
      // 云盘系统
      {
        path: 'cloud',
        name: 'cloud',
        component: () => import('../pages/Cloud.vue'),
        meta: { title: '云盘系统', requiresAuth: true },
      },
      // 直播功能说明页面
      {
        path: 'LiveGuide',
        name: 'live-guide',
        component: () => import('../pages/LiveGuide.vue'),
        meta: { title: '视频直播功能说明', requiresAuth: true },
      },
      // 直播管理详情页面
      {
        path: 'live/rooms/detail/:id',
        name: 'live-room-detail',
        component: () => import('../pages/LiveRoomDetail.vue'),
        meta: { title: '直播间详情', requiresAuth: true },
      },
    ],
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

  // 如果已经登录且 URL 中有 type 参数，访问任何路径都直接跳转到对应系统页面
  if (auth.isAuthenticated && hasTypeParam) {
    const loginType = (to.query.type as string) || 'live'
    // 只有当目标路径不是对应系统页面时才跳转
    const targetPath = loginType === 'live' ? '/LiveGuide' : '/cloud'
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
    next({ path: loginType === 'live' ? '/LiveGuide' : '/cloud' })
    return
  }

  if (isLoginRoute && auth.isAuthenticated) {
    const loginType = (to.query.type as string) || 'live'
    next({ path: loginType === 'live' ? '/LiveGuide' : '/cloud' })
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
      } catch (e) {
        Message.error('加载菜单失败')
      }
    }
  }

  next()
})

export default router
