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

// ---------- 计费二期：金额与单价 ----------

/** 金额（厘）→「¥ 1,234.56」；负数为「-¥ 12.00」 */
export const formatMoney = (li: number) => {
  const v = (li || 0) / 1000
  const s = Math.abs(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${v < 0 ? '-' : ''}¥ ${s}`
}

/** 带符号的金额：收入为「+¥」，支出为「-¥」 */
export const formatSigned = (li: number) => (li > 0 ? `+${formatMoney(li)}` : formatMoney(li))

/** 元 → 厘（输入框中的金额，最多 3 位小数） */
export const yuanToLi = (yuan: number | undefined) => Math.round((yuan || 0) * 1000)

/** 单价（0.0001 元）→ 元 */
export const unitPriceYuan = (p: number) => (p || 0) / 10000

/** 元 → 单价（0.0001 元） */
export const yuanToUnitPrice = (yuan: number | undefined) => Math.round((yuan || 0) * 10000)

/** 计费点的名称、计价单位、数量单位 */
export const METERS: Record<string, { label: string; priceUnit: string; qtyUnit: string }> = {
  live_duration: { label: '直播时长', priceUnit: '分钟', qtyUnit: '分钟' },
  play_flux: { label: '播放流量', priceUnit: 'GB', qtyUnit: 'GB' },
  storage: { label: '存储空间', priceUnit: 'GB·月', qtyUnit: 'GB' },
}

/** 单价文案：「¥ 0.05 / 分钟」 */
export const formatUnitPrice = (meter: string, p: number) =>
  `¥ ${unitPriceYuan(p).toLocaleString('zh-CN', { maximumFractionDigits: 4 })} / ${METERS[meter]?.priceUnit || ''}`

/** 用量数量：分钟取整，GB 保留 3 位 */
export const formatQty = (meter: string, v: number) =>
  meter === 'live_duration'
    ? `${Math.round(v || 0).toLocaleString('zh-CN')} 分钟`
    : `${(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 3 })} GB`

/** 余额流水类型 */
export const TXN_TYPES: Record<string, { label: string; color: string }> = {
  recharge: { label: '充值', color: 'green' },
  gift: { label: '赠送', color: 'cyan' },
  usage: { label: '用量扣费', color: 'arcoblue' },
  usage_adjust: { label: '补扣 / 退还', color: 'orange' },
  plan_fee: { label: '套餐费', color: 'purple' },
  pack_fee: { label: '资源包', color: 'purple' },
  adjust: { label: '调账', color: 'red' },
}

/** 额度使用比例（0–100） */
export const quotaPercent = (used: number, quota: number) => (quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0)

/** 月份选项：当月起往前 n 个月（YYYY-MM） */
export const recentMonths = (now: Date, n = 12) => {
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}
