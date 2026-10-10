/**
 * 最新动态的展示文案：审计日志的操作（create / upload …）与资源（cloud_file / live_room …）转为可读描述，
 * 如「张三 上传了 云盘文件 报告.pdf」。未收录的操作统一显示「操作了」，不再出现 create / unknown 等原始值
 */
import type { Activity } from '@/api/dashboard'

type Translate = (key: string) => string

export interface ActivityText {
  user: string
  action: string
  target: string
}

function label(t: Translate, key: string, fallback: string): string {
  const text = t(key)
  return text && text !== key ? text : fallback
}

export function describeActivity(a: Pick<Activity, 'username' | 'action' | 'resource' | 'resourceName'>, t: Translate): ActivityText {
  const action = label(t, `activity.actions.${a.action}`, t('activity.fallbackAction'))
  // 登录 / 退出只显示动作（「admin 退出登录」），不带资源「用户」
  const selfAction = a.action === 'login' || a.action === 'logout'
  const resource = !selfAction && a.resource && a.resource !== 'unknown' ? label(t, `activity.resources.${a.resource}`, '') : ''
  const target = selfAction ? '' : [resource, a.resourceName].filter(Boolean).join(' ')
  return { user: a.username || '-', action, target }
}
