import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import BasicLayout from '../layouts/BasicLayout.vue'
import Dashboard from '../pages/Dashboard.vue'
import Login from '../pages/Login.vue'
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
    path: '/',
    name: 'root',
    component: BasicLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: Dashboard,
        meta: { title: '首页', requiresAuth: true },
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
    // 确保动态路由已注册
    menuStore.ensureRoutes(router)

    // 刷新后访问动态路由时，可能初始未匹配到；重新导航一次以匹配新注册的路由
    if (to.matched.length === 0) {
      next({ ...to, replace: true })
      return
    }
  }

  next()
})

export default router

