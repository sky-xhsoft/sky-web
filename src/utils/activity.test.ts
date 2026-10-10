import { describe, it, expect } from 'vitest'
import { describeActivity } from './activity'
import { subsystemHomePath, isSubSystem } from '@/constants/subsystems'
import zh from '@/locales/zh-CN'

// 按中文语言包取文案（找不到返回键本身，与 vue-i18n 一致）
const t = (key: string) => key.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), zh) ?? key

describe('最新动态文案', () => {
  it('操作与资源转为中文描述', () => {
    expect(describeActivity({ username: 'CLX', action: 'upload', resource: 'cloud_file', resourceName: '报告.pdf' }, t))
      .toEqual({ user: 'CLX', action: '上传了', target: '云盘文件 报告.pdf' })
    expect(describeActivity({ username: 'admin', action: 'start_live', resource: 'live_room', resourceName: '' }, t))
      .toEqual({ user: 'admin', action: '开始了', target: '直播间' })
  })

  it('登录 / 退出只显示动作', () => {
    expect(describeActivity({ username: 'admin', action: 'logout', resource: 'user', resourceName: '' }, t))
      .toEqual({ user: 'admin', action: '退出登录', target: '' })
  })

  it('不再显示 unknown 与原始操作名', () => {
    const r = describeActivity({ username: '', action: 'weird_action', resource: 'unknown', resourceName: '' }, t)
    expect(r).toEqual({ user: '-', action: '操作了', target: '' })
    expect(JSON.stringify(r)).not.toContain('unknown')
  })
})

describe('子系统', () => {
  it('主页路径与类型判断', () => {
    expect(subsystemHomePath('cloud')).toBe('/CloudDashboard')
    expect(subsystemHomePath('system')).toBe('/SystemDashboard')
    expect(subsystemHomePath(null)).toBe('/LiveDashboard')
    expect(isSubSystem('live')).toBe(true)
    expect(isSubSystem('admin')).toBe(false)
  })
})
