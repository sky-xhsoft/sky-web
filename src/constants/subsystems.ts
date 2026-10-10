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

/** 系统中心仅对该公司（平台运营方）的用户开放 */
export const SYSTEM_CENTER_COMPANY_ID = 1

/** 是否可使用该子系统：系统中心仅 SYSTEM_CENTER_COMPANY_ID 公司的用户可用 */
export function canUseSubsystem(type: SubSystem, companyId: number | null | undefined): boolean {
  return type !== 'system' || companyId === SYSTEM_CENTER_COMPANY_ID
}

/** 用户可切换的子系统 */
export function availableSubsystems(companyId: number | null | undefined): SubSystemOption[] {
  return SUBSYSTEMS.filter((s) => canUseSubsystem(s.key, companyId))
}

/** 子系统主页；未知时进入视频系统 */
export function subsystemHomePath(type: string | null | undefined): string {
  return SUBSYSTEMS.find((s) => s.key === type)?.homePath || '/LiveDashboard'
}
