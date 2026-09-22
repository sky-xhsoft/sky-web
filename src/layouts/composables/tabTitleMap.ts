/**
 * 组件名称到 i18n 标题的映射 — 替代 updateTabTitles 中的 switch 语句
 */

type TitleResolver = (t: any, params?: Record<string, any>) => string

const componentTitleMap: Record<string, string | TitleResolver> = {
  Cloud:              'layout.cloud',
  SystemManagement:   'layout.systemManagement',
  LiveDomain:         'layout.liveDomain',
  PushDomain:         'layout.pushDomains',
  PlayDomain:         'layout.playDomains',
  LiveStream:         'layout.liveStreams',
  PullStreamTask:     'layout.pullStream',
  PullStreamTaskForm: (t, p) => p?.taskId ? t('layout.editTask') : t('layout.createTask'),
  LiveHighlightClips: 'layout.highlightClips',
  LiveRecordings:     'layout.recordings',
  LiveRoomList:       'layout.rooms',
  LiveRoomForm:       (t, p) => p?.id ? t('layout.editRoom') : t('layout.createRoom'),
  UserProfile:        'layout.userProfile',
}

export function getTabTitle(
  componentName: string,
  t: any,
  params?: Record<string, any>,
  fallback?: string
): string | null {
  const entry = componentTitleMap[componentName]
  if (!entry) return fallback ?? null
  if (typeof entry === 'string') return t(entry)
  return entry(t, params)
}
