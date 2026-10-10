/**
 * 子系统：视频系统（直播）/ 云盘系统 / 系统中心。登录页与主页右上角切换使用
 */
export type SubSystem = 'live' | 'cloud' | 'system'

export interface SubSystemOption {
  key: SubSystem
  /** 显示名称的语言包键 */
  labelKey: string
  /** 进入该系统后的主页 */
  homePath: string
}

export const SUBSYSTEMS: SubSystemOption[] = [
  { key: 'live', labelKey: 'login.platforms.live', homePath: '/LiveDashboard' },
  { key: 'cloud', labelKey: 'login.platforms.cloud', homePath: '/CloudDashboard' },
  { key: 'system', labelKey: 'login.platforms.system', homePath: '/SystemDashboard' },
]

export function isSubSystem(value: unknown): value is SubSystem {
  return SUBSYSTEMS.some((s) => s.key === value)
}

/** 子系统主页；未知时进入视频系统 */
export function subsystemHomePath(type: string | null | undefined): string {
  return SUBSYSTEMS.find((s) => s.key === type)?.homePath || '/LiveDashboard'
}
