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

/** 系统中心概览（当前公司） */
export interface SystemOverview {
  users: number
  groups: number
  tables: number
  companies: number
  trend: { dates: string[]; logins: number[]; ops: number[] }
  recentOps: { id: number; user: string; action: string; target: string; time: string }[]
}

/** 云盘概览（当前用户） */
export interface CloudOverview {
  usedStorage: number
  fileCount: number
  folderCount: number
  shareCount: number
  trend: { dates: string[]; uploads: number[]; files: number[] }
  recentFiles: { id: number; name: string; fileType: string; fileExt: string; size: number; time: string }[]
  activities: { action: 'uploaded' | 'createdFolder' | 'createdShare'; target: string; time: string }[]
}

export async function getSystemOverview(): Promise<SystemOverview> {
  const res = await api.get<ApiResponse<SystemOverview>>('/dashboard/system')
  return res.data.data
}

export async function getCloudOverview(): Promise<CloudOverview> {
  const res = await api.get<ApiResponse<CloudOverview>>('/dashboard/cloud')
  return res.data.data
}
