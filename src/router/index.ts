import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import BasicLayout from '../layouts/BasicLayout.vue'
import Dashboard from '../pages/Dashboard.vue'
import Login from '../pages/Login.vue'
import Cloud from '../pages/Cloud.vue'
import Share from '../pages/Share.vue'
import { useAuthStore } from '../stores/auth'
import { useMenuStore } from '../stores/menu'

const routes: RouteRecordRaw[] = [
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
        component: Dashboard,  // 默认组件，实际不会用到
        meta: { title: '应用', requiresAuth: true },
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

  if (isLoginRoute && auth.isAuthenticated) {
    next({ path: '/' })
    return
  }

  if (requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (!isLoginRoute && auth.isAuthenticated) {
    const menuStore = useMenuStore()
    if (!menuStore.menus.length && !menuStore.loading) {
      try {
        await menuStore.loadMenus()
      } catch (e) {
        Message.error('加载菜单失败')
      }
    }
    // 仍然需要注册路由，但不会真正使用它们（用于兼容性）
    menuStore.ensureRoutes(router)
  }

  next()
})

export default router

