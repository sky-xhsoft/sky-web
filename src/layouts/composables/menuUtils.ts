/**
 * 菜单工具函数
 */

export interface NavItem {
  key: string
  title: string
  path?: string
  children?: NavItem[]
}

export function findMenuTitle(items: NavItem[], path: string): string | null {
  for (const item of items) {
    if (item.path === path) return item.title
    if (item.children?.length) {
      const childTitle = findMenuTitle(item.children, path)
      if (childTitle) return childTitle
    }
  }
  return null
}
