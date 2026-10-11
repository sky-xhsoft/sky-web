<template>
  <div class="ls">
    <!-- 链接失效：分享关闭、直播间删除、直播结束超过 1 小时 -->
    <div v-if="view?.status === 'invalid'" class="ls-invalid">
      <div class="ls-invalid-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" /><path d="M4 4l16 16" /></svg>
      </div>
      <h1 class="ls-invalid-title">分享链接已失效</h1>
      <p class="ls-invalid-text">直播已结束超过 1 小时、分享已关闭，或直播间已删除。<br>请联系分享者获取新的链接。</p>
      <div class="ls-brand">由 Zigebo 提供直播服务</div>
    </div>

    <div v-else-if="!view" class="ls-loading">
      <span v-if="loadError">{{ loadError }}<button class="ls-retry" @click="load">重试</button></span>
      <span v-else>加载中…</span>
    </div>

    <template v-else>
      <header class="ls-head">
        <div class="ls-company">
          <span class="ls-logo" aria-hidden="true">{{ (view.companyName || 'Z').slice(0, 1) }}</span>
          <span class="ls-company-name">{{ view.companyName }}</span>
        </div>
        <button class="ls-copy" aria-label="复制分享链接" @click="copyLink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h8" /></svg>
          <span class="ls-copy-text">复制链接</span>
        </button>
      </header>

      <main class="ls-main">
        <div class="ls-primary">
          <div class="ls-player" :style="coverStyle">
            <template v-if="view.status === 'live'">
              <div :key="playerKey" class="ls-video-box">
                <video id="ls-player" class="ls-video" preload="auto" playsinline webkit-playsinline />
              </div>
              <span class="ls-badge ls-badge-live"><span class="ls-dot" />直播中</span>
              <div v-if="!playUrl" class="ls-overlay">暂时无法播放，请稍后刷新</div>
            </template>
            <template v-else-if="view.status === 'upcoming'">
              <span class="ls-badge ls-badge-light">未开始</span>
              <div class="ls-overlay">
                <template v-if="countdown">
                  <span class="ls-overlay-sub">距离开播还有</span>
                  <div class="ls-countdown" role="timer" :aria-label="`距离开播还有${countdown.text}`">
                    <div v-for="u in countdown.units" :key="u.label" class="ls-cd-unit">
                      <span class="ls-cd-num">{{ u.value }}</span>
                      <span class="ls-cd-label">{{ u.label }}</span>
                    </div>
                  </div>
                </template>
                <span v-else class="ls-overlay-title">直播即将开始</span>
              </div>
            </template>
            <template v-else>
              <span class="ls-badge ls-badge-gray">已结束</span>
              <div class="ls-overlay">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /><path d="M3 3l18 18" /></svg>
                <span class="ls-overlay-title">直播已结束</span>
                <span class="ls-overlay-sub">感谢观看</span>
              </div>
            </template>
          </div>

          <section class="ls-card ls-info">
            <h1 class="ls-title">{{ view.roomName }}</h1>
            <div class="ls-meta">
              <!-- 计划开始时间可能与实际开播不同，已结束只显示实际结束时间 -->
              <span v-if="view.status === 'ended'"><template v-if="view.endedAt">结束于 {{ fmt(view.endedAt) }}</template></span>
              <span v-else-if="view.startTime">开播时间 {{ fmt(view.startTime) }}</span>
              <span v-if="displayModeText">{{ displayModeText }}</span>
            </div>
            <div v-if="view.status === 'upcoming'" class="ls-tip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              开播后页面会自动开始播放，无需刷新
            </div>
          </section>
        </div>

        <aside v-if="view.description" class="ls-aside">
          <section class="ls-card">
            <h2 class="ls-card-title">直播简介</h2>
            <p class="ls-desc">{{ view.description }}</p>
          </section>
        </aside>
      </main>

      <footer class="ls-foot">无需登录即可观看 · 由 Zigebo 提供直播服务</footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { getPublicShare, type PublicShare } from '@/api/liveShare'
import { TCPLAYER_LICENSE_URL } from '@/utils/tcplayer'

// 直播间分享页：无需登录，直播中播放直播流；未开始显示倒计时；结束 1 小时内显示已结束，之后链接失效
const POLL_MS = 15000

const route = useRoute()
const code = computed(() => String(route.params.code || ''))
const view = ref<PublicShare | null>(null)
const loadError = ref('')
const playUrl = ref('')
const playerKey = ref(0)
let player: any = null
let pollTimer: number | undefined
let tickTimer: number | undefined
// 服务器时间与本机时间的差（毫秒），倒计时按服务器时间算
const clockOffset = ref(0)
const nowMs = ref(Date.now())

const isMobile = () => /Android|iPhone|iPad|iPod|Mobile|MicroMessenger/i.test(navigator.userAgent)

const fmt = (v?: string, f = 'MM-DD HH:mm') => (v ? dayjs(v).format(f) : '')
const displayModeText = computed(() => ({ landscape: '横屏直播', portrait: '竖屏直播', three_screen: '三分屏直播' } as Record<string, string>)[view.value?.displayMode || ''] || '')
const coverStyle = computed(() => (view.value?.status !== 'live' && view.value?.coverImage ? { backgroundImage: `url(${view.value.coverImage})` } : {}))

const countdown = computed(() => {
  const start = view.value?.startTime ? dayjs(view.value.startTime).valueOf() : 0
  const left = Math.floor((start - (nowMs.value + clockOffset.value)) / 1000)
  if (!start || left <= 0) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  const d = Math.floor(left / 86400)
  const h = Math.floor((left % 86400) / 3600)
  const m = Math.floor((left % 3600) / 60)
  const s = left % 60
  return {
    text: `${d}天${h}时${m}分${s}秒`,
    units: [
      { label: '天', value: pad(d) },
      { label: '时', value: pad(h) },
      { label: '分', value: pad(m) },
      { label: '秒', value: pad(s) },
    ],
  }
})

const destroyPlayer = () => {
  if (!player) return
  try {
    player.dispose?.()
  } catch {
    // 忽略
  }
  player = null
}

// 手机浏览器（含微信）不支持 FLV，用 HLS
const initPlayer = async () => {
  destroyPlayer()
  const urls = view.value?.playUrls || {}
  playUrl.value = (isMobile() ? urls.hls || urls.flv : urls.flv || urls.hls) || ''
  playerKey.value++
  await nextTick()
  const TCPlayer = (window as any).TCPlayer
  if (!playUrl.value || typeof TCPlayer === 'undefined') return
  player = TCPlayer('ls-player', {
    sources: [{ src: playUrl.value }],
    licenseUrl: TCPLAYER_LICENSE_URL,
    autoplay: true,
    controls: true,
    width: '100%',
    height: '100%',
    fluid: false,
    language: 'zh-CN',
  })
}

const load = async () => {
  try {
    const next = await getPublicShare(code.value)
    loadError.value = ''
    clockOffset.value = dayjs(next.serverTime).valueOf() - Date.now()
    const wasLive = view.value?.status === 'live'
    view.value = next
    if (next.roomName) document.title = next.roomName
    // 只在进入直播时创建播放器，直播中定时刷新不打断播放
    if (next.status === 'live' && !wasLive) await initPlayer()
    if (next.status !== 'live' && wasLive) destroyPlayer()
    if (next.status === 'invalid') stopPolling()
  } catch (e: any) {
    if (!view.value) loadError.value = e?.response?.data?.message || '加载失败，请检查网络'
  }
}

const stopPolling = () => {
  if (pollTimer) window.clearInterval(pollTimer)
  pollTimer = undefined
}

const copyLink = async () => {
  const text = window.location.href
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    Message.success('链接已复制')
  } catch {
    Message.error('复制失败，请手动复制地址栏中的链接')
  }
}

onMounted(() => {
  load()
  pollTimer = window.setInterval(load, POLL_MS)
  tickTimer = window.setInterval(() => (nowMs.value = Date.now()), 1000)
})
onBeforeUnmount(() => {
  stopPolling()
  if (tickTimer) window.clearInterval(tickTimer)
  destroyPlayer()
})

defineExpose({ view, countdown, playUrl, load })
</script>

<style scoped>
.ls {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
  color: #1d2129;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
}
.ls-head {
  height: 52px;
  box-sizing: border-box;
  padding: 0 12px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
}
.ls-company { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ls-logo {
  width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; background: #1d5fd6; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;
}
.ls-company-name { font-size: 15px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ls-copy {
  min-width: 44px; height: 44px; padding: 0 8px; border: none; border-radius: 8px; background: transparent;
  display: flex; align-items: center; justify-content: center; gap: 6px; color: #1d2129; font: inherit; font-size: 14px; cursor: pointer;
}
.ls-copy-text { display: none; }

.ls-main { flex: 1; display: flex; flex-direction: column; }
.ls-primary { display: flex; flex-direction: column; }
.ls-player {
  position: relative; width: 100%; aspect-ratio: 16 / 9; background: #1e2633 center / cover no-repeat;
  display: flex; align-items: center; justify-content: center; overflow: hidden; color: #fff;
}
.ls-video-box { position: absolute; inset: 0; background: #0b0d12; }
.ls-video { width: 100%; height: 100%; }
.ls-badge {
  position: absolute; top: 12px; left: 12px; z-index: 2; display: flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; pointer-events: none;
}
.ls-badge-live { background: #d92d20; color: #fff; }
.ls-badge-light { background: #fff; color: #1d2129; }
.ls-badge-gray { background: #4b5563; color: #fff; }
.ls-dot { width: 6px; height: 6px; border-radius: 3px; background: #fff; }
.ls-overlay {
  position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 16px 24px; border-radius: 12px; background: rgba(15, 20, 30, 0.55); text-align: center;
}
.ls-overlay-title { font-size: 16px; font-weight: 500; }
.ls-overlay-sub { font-size: 13px; color: #e5e7eb; }
.ls-countdown { display: flex; gap: 8px; }
.ls-cd-unit { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ls-cd-num {
  min-width: 48px; padding: 6px 0; border-radius: 8px; background: rgba(255, 255, 255, 0.16);
  font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums;
}
.ls-cd-label { font-size: 11px; color: #c9ced6; }

.ls-card { background: #fff; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.ls-info { margin: 12px 12px 0; }
.ls-title { margin: 0; font-size: 19px; line-height: 1.4; font-weight: 700; word-break: break-word; }
.ls-meta { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; color: #4e5969; }
.ls-tip {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px;
  background: #eef4ff; color: #1d4fb0; font-size: 13px; line-height: 1.5;
}
.ls-aside { margin: 12px 12px 0; }
.ls-card-title { margin: 0; font-size: 15px; font-weight: 500; }
.ls-desc { margin: 0; font-size: 14px; line-height: 1.7; color: #4e5969; white-space: pre-line; word-break: break-word; }
.ls-foot { padding: 20px 16px; text-align: center; font-size: 12px; color: #6b7280; }

.ls-loading { flex: 1; display: flex; align-items: center; justify-content: center; color: #4e5969; font-size: 14px; }
.ls-retry { margin-left: 12px; height: 32px; padding: 0 12px; border: 1px solid #c9cdd4; border-radius: 6px; background: #fff; font: inherit; cursor: pointer; }

.ls-invalid {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  padding: 24px; text-align: center;
}
.ls-invalid-icon {
  width: 72px; height: 72px; border-radius: 36px; background: #e5e7eb; color: #4b5563;
  display: flex; align-items: center; justify-content: center;
}
.ls-invalid-title { margin: 4px 0 0; font-size: 20px; font-weight: 700; }
.ls-invalid-text { margin: 0; font-size: 14px; line-height: 1.7; color: #4e5969; }
.ls-brand { margin-top: 40px; font-size: 12px; color: #6b7280; }

/* 电脑：播放器与标题在左，简介在右 */
@media (min-width: 900px) {
  .ls-head { height: 60px; padding: 0 24px; border-bottom: 1px solid #e5e7eb; }
  .ls-logo { width: 32px; height: 32px; font-size: 16px; }
  .ls-company-name { font-size: 16px; }
  .ls-copy { height: 36px; padding: 0 14px; border: 1px solid #c9cdd4; }
  .ls-copy-text { display: inline; }
  .ls-main {
    width: 100%; max-width: 1200px; margin: 0 auto; box-sizing: border-box; padding: 24px;
    flex-direction: row; align-items: flex-start; gap: 24px;
  }
  .ls-primary { flex: 1 1 auto; min-width: 0; gap: 16px; }
  .ls-player { border-radius: 12px; }
  .ls-card.ls-info { margin: 0; padding: 0; background: transparent; }
  .ls-title { font-size: 24px; }
  .ls-meta { font-size: 14px; }
  .ls-aside { flex: 0 0 320px; margin: 0; }
  .ls-card { padding: 20px; }
}
</style>
