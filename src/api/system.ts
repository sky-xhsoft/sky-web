import api from './http'

export interface Subsystem {
  id: number
  name: string
  EName: string
  orderno: number
  url: string
  icon: string
  description: string
  key: string
  isActive: string
}

// 公开接口：获取全部启用的子系统（登录/欢迎页渲染系统入口用，无需鉴权）
export async function getSubsystems(): Promise<Subsystem[]> {
  const res = await api.get<any>('/subsystems')
  return res?.data?.data ?? []
}