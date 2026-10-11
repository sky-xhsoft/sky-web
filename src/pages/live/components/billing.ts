// 费用中心（计费一期：用量）的显示规则

/** 直播时长：「3 小时 05 分」；不足 1 小时为「45 分钟」 */
export const formatMinutes = (minutes: number) => {
  const m = Math.round(minutes || 0)
  if (m < 60) return `${m} 分钟`
  const h = Math.floor(m / 60)
  return `${h.toLocaleString('zh-CN')} 小时 ${String(m % 60).padStart(2, '0')} 分`
}

/** 推流时长（秒）：「1:02:05」或「12:05」 */
export const formatSeconds = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds || 0))
  const h = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0')
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** 流量、存储：≥ 1 GB 保留 2 位，< 1 GB 换算为 MB */
export const formatGB = (gb: number) => {
  const v = gb || 0
  if (v <= 0) return '0 GB'
  const mb = v * 1024
  if (mb < 0.1) return '< 0.1 MB'
  if (v < 1) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
  return `${v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GB`
}

/** 推流段落的结束方式 */
export const END_SOURCE: Record<string, string> = {
  callback: '断流回调',
  patrol: '巡检判定断流',
  cap: '超过 24 小时自动结束',
}

/** 存储细项 */
export const STORAGE_ITEMS: { key: string; label: string }[] = [
  { key: 'record', label: '直播录制' },
  { key: 'clip', label: '高光切片' },
  { key: 'disk', label: '云盘文件' },
]

/** 对账账号：平台账号 / 公司自有账号 */
export const accountLabel = (account: string) => (account === 'global' ? '平台账号' : `自有账号 ${account.replace(/^tc:/, '')}`)

/** 月份选项：当月起往前 n 个月（YYYY-MM） */
export const recentMonths = (now: Date, n = 12) => {
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}
