import api from './http'
import type { ApiResponse } from './types'

export interface DashboardStats {
  totalRooms: number
  todayLiveSessions: number
  recordingStorage: number
  usedStorage: number
  groupCount: number
}

export interface DashboardTrend {
  dates: string[]
  liveSessions: number[]
  recordings: number[]
}

export interface RecentRoom {
  id: number
  roomName: string
  status: string
  startTime: string | null
  viewerCount: number
}

export interface Activity {
  id: number
  username: string
  action: string
  resource: string
  resourceName: string
  createdAt: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats')
  return res.data.data
}

export async function getDashboardTrend(days = 7): Promise<DashboardTrend> {
  const res = await api.get<ApiResponse<DashboardTrend>>('/dashboard/trend', { params: { days } })
  return res.data.data
}

export async function getRecentRooms(limit = 5): Promise<RecentRoom[]> {
  const res = await api.get<ApiResponse<RecentRoom[]>>('/dashboard/recent-rooms', { params: { limit } })
  return res.data.data
}

export async function getActivities(limit = 10): Promise<Activity[]> {
  const res = await api.get<ApiResponse<Activity[]>>('/dashboard/activities', { params: { limit } })
  return res.data.data
}
