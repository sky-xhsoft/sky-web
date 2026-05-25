/**
 * 直播间数据格式转换工具
 * 从后端大写下划线格式转换为前端驼峰格式
 */

export interface LiveRoomFrontendData {
  id: string
  roomName: string
  roomType: string
  broadcastFormat: string
  roomStage: string
  displayMode: string
  startTime: string
  endTime: string
  coverImage: string
  viewingMethod: string
  viewingPassword: string
  viewingPrice: number
  playbackMethod: string
  playbackValidity: string
  playbackStartTime: string
  playbackEndTime: string
  status: string
  viewerCount: number
  peakViewerCount: number
  duration: number
  description: string
  streamName: string
  pushUrl: string
  playUrl: string
  channel: string
}

export function convertLiveRoomToFrontend(data: any): LiveRoomFrontendData {
  return {
    id: data.ID,
    roomName: data.ROOM_NAME || '',
    roomType: data.ROOM_TYPE || 'video',
    broadcastFormat: data.BROADCAST_FORMAT || 'live',
    roomStage: data.ROOM_STAGE || 'formal',
    displayMode: data.DISPLAY_MODE || 'landscape',
    startTime: data.START_TIME || '',
    endTime: data.END_TIME || '',
    coverImage: data.COVER_IMAGE || '',
    viewingMethod: data.VIEWING_METHOD || 'public',
    viewingPassword: data.VIEWING_PASSWORD || '',
    viewingPrice: data.VIEWING_PRICE || 0,
    playbackMethod: data.PLAYBACK_METHOD || 'post_end',
    playbackValidity: data.PLAYBACK_VALIDITY || 'unlimited',
    playbackStartTime: data.PLAYBACK_START_TIME || '',
    playbackEndTime: data.PLAYBACK_END_TIME || '',
    status: data.STATUS || 'draft',
    viewerCount: data.VIEWER_COUNT || 0,
    peakViewerCount: data.PEAK_VIEWER_COUNT || 0,
    duration: data.DURATION || 0,
    description: data.DESCRIPTION || '',
    streamName: data.STREAM_NAME || '',
    pushUrl: data.PUSH_URL || '',
    playUrl: data.PLAY_URL || '',
    channel: data.CHANNEL || '--',
  }
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'gray',
    ready: 'orange',
    live: 'red',
    ended: 'green',
    archived: 'gray',
  }
  return map[status] || 'gray'
}
