import type { APIRequestContext } from '@playwright/test'
import { BACKEND_API, CREDENTIALS } from './auth'

/**
 * 可达页面清单生成
 * 登录后真实可访问页面 = 静态路由(src/router/index.ts) ∪ 动态菜单路由(菜单接口返回的叶子 table 项)。
 * 动态注册逻辑与 src/stores/menu.ts 的 buildRoutesFromMenus 保持一致。
 */

/** 静态受保护路由(router/index.ts BasicLayout children)。参数路由单独处理。 */
export const STATIC_AUTH_URLS: string[] = [
  '/LiveGuide',
  '/live/domains',
  '/live/push-domains',
  '/live/play-domains',
  '/live/rooms',
  '/live/rooms/create',
  '/cloud',
  '/cloud/shares',
  '/user/profile',
]

/** 未登录公开页。 */
export const PUBLIC_URLS = [
  { url: '/', name: '欢迎页' },
  { url: '/login', name: '登录页' },
  { url: '/company-register', name: '企业注册' },
  { url: '/share/demo123', name: '文件分享(空态)' },
  { url: '/non-existent-route', name: '404' },
]

type MenuNode = { id?: number; type?: string; url?: string; children?: MenuNode[] }

/** 拉取某 type 的菜单树，返回登录后可达的叶子 URL 列表。 */
async function menuLeafUrls(request: APIRequestContext, token: string, type: 'live' | 'cloud'): Promise<string[]> {
  const res = await request.get(`${BACKEND_API}/menus/user/tree`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { type },
  })
  if (!res.ok()) return []
  const body = await res.json()
  const tree: MenuNode[] = body?.data ?? []

  const urls: string[] = []
  const walk = (nodes?: MenuNode[]) => {
    for (const node of nodes ?? []) {
      if (node.children?.length) {
        // 有子节点的子系统/分类不注册为可访问路由，但递归收集他们的叶子
        walk(node.children)
      } else if (node.url) {
        // 叶子 → 注册为可访问路由(TableView 通用列表页)
        urls.push(node.url)
      }
    }
  }
  walk(tree)
  return urls
}

/**
 * 动态拉取登录后可达 URL:live + cloud 两份菜单的叶子,合并静态受保护路由,去重。
 * 若菜单接口失败(后端未起)，退回静态清单，保证套件可跑。
 */
export async function getReachableUrls(request: APIRequestContext): Promise<string[]> {
  let token = ''
  try {
    const login = await request.post(`${BACKEND_API}/auth/login`, {
      data: {
        username: CREDENTIALS.username,
        password: CREDENTIALS.password,
        companyId: CREDENTIALS.companyId,
        clientType: 'live-web',
        deviceId: 'e2e-urlprobe-1',
      },
    })
    if (login.ok()) token = ((await login.json())?.data?.token) ?? ''
  } catch {
    // 后端不可达，走静态兜底
  }

  let dynamic: string[] = []
  if (token) {
    const [live, cloud] = await Promise.all([
      menuLeafUrls(request, token, 'live'),
      menuLeafUrls(request, token, 'cloud'),
    ])
    dynamic = [...live, ...cloud]
  }

  return Array.from(new Set([...STATIC_AUTH_URLS, ...dynamic])).sort()
}

export type NavLeaf = { url: string; title: string; path: string[] }

/** 顶层的标题（displayName || name），用于跟侧栏文本匹配。 */
function nodeTitle(node: MenuNode): string {
  return (node as { displayName?: string; name?: string }).displayName || (node as { name?: string }).name || ''
}

/**
 * 返回登录后可经侧栏导航到达的功能页叶子清单(path: 从 header root 到叶子的标题链)。
 * 与 sideview 点击导航到 loadComponent(path) 一一对应。
 */
/** 按登录类型拉取功能页叶子(live/cloud 是不同登录类型 → 不同菜单，需分开会话)。 */
export async function getNavLeaves(request: APIRequestContext, type: 'live' | 'cloud' = 'live'): Promise<NavLeaf[]> {
  let token = ''
  try {
    const login = await request.post(`${BACKEND_API}/auth/login`, {
      data: {
        username: CREDENTIALS.username,
        password: CREDENTIALS.password,
        companyId: CREDENTIALS.companyId,
        clientType: type === 'cloud' ? 'cloud-web' : 'live-web',
        deviceId: 'e2e-navleaves-1',
      },
    })
    if (login.ok()) token = ((await login.json())?.data?.token) ?? ''
  } catch {
    return []
  }
  if (!token) return []

  const r = await request.get(`${BACKEND_API}/menus/user/tree`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { type },
  })
  const tree: MenuNode[] | null = r.ok() ? (await r.json())?.data ?? null : null

  const leaves: NavLeaf[] = []
  const seen = new Set<string>()

  const walk = (nodes: MenuNode[] | null | undefined, ancestors: string[]) => {
    for (const node of nodes ?? []) {
      const title = nodeTitle(node)
      const isLeaf = node.type === 'table' || !node.children?.length
      if (isLeaf && node.url) {
        if (!seen.has(node.url)) {
          seen.add(node.url)
          leaves.push({ url: node.url, title, path: [...ancestors, title].filter(Boolean) })
        }
      }
      walk(node.children, [...ancestors, title].filter(Boolean))
    }
  }

  walk(tree, [])
  return leaves.sort((a, b) => a.url.localeCompare(b.url))
}