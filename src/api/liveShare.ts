import api from './http'

/** 直播间分享设置（管理端） */
export interface RoomShare {
  enabled: boolean
  code: string // 未生成时为空
}

export type ShareStatus = 'live' | 'upcoming' | 'ended' | 'invalid'

/** 分享页看到的直播间（无需登录） */
export interface PublicShare {
  status: ShareStatus
  roomName?: string
  companyName?: string
  coverImage?: string
  description?: string
  displayMode?: string
  startTime?: string // 计划开始时间
  endedAt?: string // 实际结束时间
  playUrls?: { flv?: string; hls?: string }
  serverTime: string
}

const unwrap = <T>(res: any): T => res.data?.data as T

export const getRoomShare = async (roomId: number | string) => unwrap<RoomShare>(await api.get(`/live/rooms/${roomId}/share`))

/** 开启 / 关闭分享；reset 为 true 时重新生成链接，旧链接失效 */
export const updateRoomShare = async (roomId: number | string, data: { enabled: boolean; reset?: boolean }) =>
  unwrap<RoomShare>(await api.put(`/live/rooms/${roomId}/share`, data))

export const getPublicShare = async (code: string) => unwrap<PublicShare>(await api.get(`/live/share/${encodeURIComponent(code)}`))

/** 分享链接 */
export const shareLink = (code: string) => `${window.location.origin}/live-share/${code}`
