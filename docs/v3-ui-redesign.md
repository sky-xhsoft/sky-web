# Sky-Web v3 UI 改造方案

> 目标：将现有 `sky-web` 前端视觉与交互对齐 `design/v2`（ZiGeBo 数据中心 · 设计原型 v2），建立统一的设计系统，提升产品一致性与品牌识别度。
>
> 状态：方案文档  
> 关联原型：`/f/work/golang/src/github.com/sky-xhsoft/design/v2`

---

## 1. 改造目标

1. **统一视觉语言**：收敛散落在各页面的硬编码色值、圆角、阴影，建立全局设计令牌。
2. **对齐设计原型**：页面布局、组件形态、动效与 `design/v2` 保持一致。
3. **提升可维护性**：通过公共组件和样式类减少重复代码。
4. **支持暗色主题**：设计令牌需覆盖浅色/暗色两套语义。
5. **保留功能完整**：改造以视觉和交互为主，不改动业务逻辑与接口契约。

---

## 2. 现状分析

### 2.1 技术栈

- 框架：Vue 3 + TypeScript + Vite
- UI 库：Arco Design Vue v2.57.0
- 状态：Pinia
- 国际化：vue-i18n
- 图标：@arco-design/web-vue/es/icon

### 2.2 主要问题

| 问题 | 说明 | 影响 |
|---|---|---|
| 无集中式设计令牌 | 颜色、圆角、阴影分散在各 `.vue` 的 `scoped` 样式中 | 视觉不统一，改一处需全局搜索替换 |
| 品牌色使用混乱 | 页面渐变、模块图标色各自为政 | 品牌识别度弱 |
| 页面头部不统一 | 有的页面有 `page-toolbar`，有的直接放内容 | 用户认知不一致 |
| 组件形态不统一 | 按钮、Tag、表格、卡片在不同页面呈现不同细节 | 体验割裂 |
| 缺少暗色主题 | 当前只有浅色默认主题 | 无法满足夜间/护眼场景 |
| 动效缺失或不一致 | 只有部分页面有 hover/入场动画 | 产品质感不足 |

### 2.3 已有优势

- 项目已具备完整的模块划分（`pages/`、`modules/cloud/`、`modules/metadata/`）。
- 已使用 `vue-i18n`，改造时可同步处理文案。
- `BasicLayout.vue` 已实现标签页、keep-alive、动态组件切换，改造时导航架构可复用。

---

## 3. 改造范围

### 3.1 本次改造覆盖的模块

按原型批次映射：

| 原型批次 | 原型页面 | 现有页面 | 优先级 |
|---|---|---|---|
| P0 框架 | 全部页面公共外壳 | `layouts/BasicLayout.vue`、`layouts/components/*` | P0 |
| P0 首页 | `pages/dashboard.html` | `src/pages/Dashboard.vue`、`src/pages/HomeDashboard.vue` | P0 |
| P2 直播 | `live/domains.html` | `src/pages/LiveDomain.vue`、`PushDomain.vue`、`PlayDomain.vue` | P0 |
| P2 直播 | `live/rooms.html` / `room-form.html` / `room-detail.html` | `src/pages/LiveRoomList.vue`、`LiveRoomForm.vue`、`LiveRoomDetail.vue` | P1 |
| P2 直播 | `live/streams.html` | `src/pages/LiveStream.vue` | P1 |
| P2 直播 | `live/pull-stream.html` / `pull-stream-form.html` | `src/pages/PullStreamTask.vue`、`PullStreamTaskForm.vue` | P1 |
| P2 直播 | `live/clips.html` / `recordings.html` | `src/pages/LiveHighlightClips.vue`、`LiveRecordings.vue` | P1 |
| P2 直播 | `live/guide.html` / `preview.html` | `src/pages/LiveGuide.vue`、`LivePreview.vue` | P1 |
| P3 云盘 | `cloud/drive.html` / `share-manage.html` / `my-shares.html` | `src/pages/Cloud.vue`、`modules/cloud/views/CloudView.vue`、`CloudShareManager.vue` | P1 |
| P3 云盘 | `cloud/share-access.html` | `src/pages/Share.vue` | P2 |
| P4 权限 | `permission/groups.html` / `config.html` | `src/pages/PermissionConfig.vue`、`GroupPermissionView.vue` | P2 |
| P4 系统 | `system/login.html` / `welcome.html` / `register.html` | `src/pages/Login.vue`、`Welcome.vue`、`CompanyRegister.vue` | P1 |
| P4 系统 | `system/profile.html` / `management.html` / `translation.html` | `src/pages/UserProfile.vue`、`SystemManagement.vue`、`SystemManagement/TranslationManagement.vue` | P2 |

### 3.2 不在本次改造范围

- 元数据动态表格/表单（`metadata/table-list.html`、`metadata/table-form.html`）原型标注为「本期不实现」，保持现有实现。
- 后端接口与业务逻辑不变。
- 路由结构与权限控制逻辑不变。

---

## 4. 设计系统

### 4.1 设计令牌（Design Tokens）

新建文件：`src/styles/tokens.css`

```css
:root {
  /* 品牌色 */
  --brand-blue: #165dff;
  --brand-blue-hover: #0e4bdb;
  --brand-green: #34c759;
  --brand-gradient: linear-gradient(135deg, #165dff, #34c759);
  --brand-gradient-soft: linear-gradient(90deg, rgba(22, 93, 255, .10), transparent);

  /* 中性色 */
  --gray-50: #f9fafb;
  --gray-100: #f5f6fa;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-700: #374151;
  --gray-900: #1f2937;

  /* 功能色 */
  --success: #34c759;
  --warning: #ff9500;
  --error: #f53f3f;
  --info: #165dff;
  --success-bg: #e8f9f0;
  --warning-bg: #fff4e5;
  --error-bg: #ffece8;
  --info-bg: #e8f0ff;

  /* 语义令牌 */
  --bg-page: var(--gray-100);
  --bg-card: #ffffff;
  --bg-hover: var(--gray-50);
  --border: var(--gray-200);
  --border-light: #f0f0f0;
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-500);
  --text-tertiary: var(--gray-400);

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, .04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, .06);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, .08);

  /* 动效 */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
  --ease-out: cubic-bezier(.16, 1, .3, 1);

  /* 字体 */
  --font-family: Inter, 'PingFang SC', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* 布局尺寸 */
  --sidebar-w: 220px;
  --tabbar-h: 44px;
  --logo-h: 56px;
}

[data-theme="dark"] {
  --bg-page: #141414;
  --bg-card: #1f1f1f;
  --bg-hover: #2a2a2a;
  --border: #333333;
  --border-light: #2a2a2a;
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, .3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, .35);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, .4);
  --success-bg: rgba(52, 199, 89, .15);
  --warning-bg: rgba(255, 149, 0, .15);
  --error-bg: rgba(245, 63, 63, .15);
  --info-bg: rgba(22, 93, 255, .15);
  --brand-gradient-soft: linear-gradient(90deg, rgba(22, 93, 255, .25), transparent);
}
```

### 4.2 基础样式

新建文件：`src/styles/base.css`

覆盖内容：
- `body` 背景色、字体、过渡动画
- 滚动条样式
- 链接颜色
- 与 Arco 共存的 reset 规则

### 4.3 Arco 变量覆盖

新建文件：`src/styles/arco-override.css`

通过覆盖 Arco CSS 变量，让 Arco 组件默认对齐设计令牌：

```css
:root {
  --arcoblue-6: var(--brand-blue);
  --green-6: var(--brand-green);
  --orange-6: var(--warning);
  --red-6: var(--error);
  --border-radius-small: var(--radius-sm);
  --border-radius-medium: var(--radius-md);
  --border-radius-large: var(--radius-lg);
}
```

> 注意：Arco 的 CSS 变量名需对照实际构建产物确认，必要时使用具体选择器覆盖。

---

## 5. 公共组件规范

新建目录：`src/components/ui/`

### 5.1 V2PageHeader

统一页面头部：标题 + 描述 + 操作按钮。

```vue
<template>
  <div class="v2-page-header">
    <div class="v2-page-header__meta">
      <div v-if="breadcrumb" class="v2-breadcrumb">...</div>
      <div class="v2-page-header__title">{{ title }}</div>
      <div v-if="description" class="v2-page-header__desc">{{ description }}</div>
    </div>
    <div class="v2-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>
```

使用示例：

```vue
<V2PageHeader
  :title="t('live.domains.title')"
  :description="t('live.domains.description')"
>
  <template #actions>
    <V2Button type="gradient" :icon="IconPlus" @click="showAddDialog">
      {{ t('live.domains.add') }}
    </V2Button>
  </template>
</V2PageHeader>
```

### 5.2 V2Button

封装四种类型，统一高度、圆角、字体：

| type | 说明 |
|---|---|
| `primary` | 蓝色主按钮 |
| `gradient` | 品牌渐变按钮（创建、上传、新建等主操作） |
| `secondary` | 白底边框按钮 |
| `text` | 文字按钮，可配 danger |
| `danger` | 红色按钮 |

属性：`size`（`sm` / `default`）、`icon`、`:loading`。

### 5.3 V2Card

封装卡片基础样式：
- 默认：白底 + `shadow-sm` + `radius-lg`
- `hover`：hover 上移 + 阴影变大
- `padding`：`card-pad` 默认 20px

### 5.4 V2Tag

统一为胶囊形 Tag，语义类型：
- `success`、`warning`、`error`、`info`、`neutral`

### 5.5 V2DataTable

封装 Arco Table，统一：
- 表格外框卡片
- 标题栏 `dt-title` + toolbar slot
- 表头样式（浅灰、小字、大写）
- 行 hover 背景
- 批量操作栏
- 分页按钮样式

### 5.6 V2Form / V2Input / V2Select

统一表单元素：
- 高度 34px
- 圆角 8px
- focus 蓝色边框 + 外发光
- 错误态红色边框
- label 灰色 13px

### 5.7 V2Modal

封装 Arco Modal，统一：
- 圆角 12px
- 阴影 `shadow-lg`
- 标题栏样式
- footer 默认右对齐

---

## 6. 布局改造

### 6.1 改造策略

现有 `BasicLayout.vue` 是「顶部 Header + 左侧 Sidebar + 内容区标签页」结构，功能完整。`design/v2` 是「左侧 Sidebar + 顶部 Tabbar + 内容区」结构。

**建议**：保持现有布局架构（减少重构风险），仅做视觉对齐：

1. 顶部 Header 简化，品牌区与原型一致。
2. Sidebar 视觉风格对齐原型（logo 在顶部、分组导航、选中态渐变背景）。
3. 标签页栏视觉改为原型 Tabbar 风格（圆角卡片、active 蓝色）。
4. 内容区背景改为 `--bg-page`。

如果后续需要完全对齐原型的单导航结构，可作为二期改造。

### 6.2 Sidebar 改造点

- `LayoutSidebar.vue`：
  - 顶部增加 logo 区（品牌图标 + 品牌名）。
  - 菜单分组显示（主菜单 / 直播管理 / 数据中心 / 系统）。
  - 选中态使用 `brand-gradient-soft` 背景 + 蓝色文字。
  - hover 使用 `--bg-hover`。
  - 宽度改为 220px。

### 6.3 Header 改造点

- `BasicLayout.vue`：
  - 品牌区图标改为品牌渐变背景。
  - 顶部一级菜单保持现状，但选中态对齐原型。
  - 用户操作按钮改为 `V2Button type="text"`。

### 6.4 标签页栏改造点

- `a-tabs` 覆盖样式：
  - tab 圆角改为 `radius-sm`。
  - active tab 背景 `--brand-blue`，文字白色。
  - 非 active tab 背景 `--bg-hover`。
  - 整体高度 44px。

---

## 7. 页面改造清单

### 7.1 Dashboard（标杆页面，P0）

现状：`src/pages/Dashboard.vue` 是横向流程图 + 3 列模块卡片。

目标：对齐 `pages/dashboard.html`

改造点：
1. 增加统一 `V2PageHeader`。
2. 顶部增加 4 个统计卡（直播间数、观看人数、切片数、录制数）。
3. 左侧「快速开始」4 步流程，右侧「近 7 日趋势」ECharts 图表。
4. 中间 4 列功能模块卡片，使用统一品牌渐变图标。
5. 下方「最近直播」表格 +「最新动态」列表。

### 7.2 直播域名（标杆页面，P0）

现状：`src/pages/LiveDomain.vue` 有 notice、搜索、表格、两步弹窗。

目标：对齐 `pages/live/domains.html`

改造点：
1. 移除顶部 notice（或改为更轻量的提示）。
2. 增加 `V2PageHeader`。
3. 类型 Tab 改为 `V2Button type="sm"` 切换样式。
4. 表格改用 `V2DataTable`。
5. 域名/类型/状态/CNAME 状态改用 `V2Tag`。
6. 添加域名弹窗改用 `V2Modal` + `V2Form`。

### 7.3 直播间、直播流、社媒分发、切片、录制（P1）

改造点：
1. 统一 `V2PageHeader`。
2. 列表/网格卡片统一使用 `V2Card`。
3. Tab 切换统一使用 `V2Button sm`。
4. 表格统一使用 `V2DataTable`。
5. 状态标签统一使用 `V2Tag`。

### 7.4 云盘（P1）

改造点：
1. `CloudView.vue` 增加 `V2PageHeader`。
2. 右侧配额卡片使用 `V2Card` + 品牌渐变进度条。
3. 文件网格/列表卡片使用 `V2Card` + hover 效果。
4. 拖拽上传区视觉对齐原型 `upload-zone`。

### 7.5 登录 / 欢迎 / 注册（P1）

改造点：
1. `Login.vue` 简化为统一品牌蓝绿渐变，移除按登录类型切换的多套配色。
2. 卡片圆角、阴影对齐 `V2Card`。
3. `Welcome.vue`、`CompanyRegister.vue` 同步调整。

### 7.6 权限与系统管理（P2）

改造点：
1. 统一 `V2PageHeader`。
2. 权限矩阵表格使用 `V2DataTable`。
3. 系统管理页面模块卡片使用 `V2Card` + 品牌图标。

---

## 8. 实施步骤

### 阶段一：设计系统搭建（1-2 天）

1. 创建 `src/styles/tokens.css`、`src/styles/base.css`、`src/styles/arco-override.css`。
2. 在 `src/main.ts` 引入上述样式。
3. 创建 `V2Button`、`V2Card`、`V2Tag`、`V2PageHeader` 组件。
4. 验证组件在浅色/暗色主题下表现正常。

### 阶段二：布局与公共组件（1-2 天）

1. 改造 `BasicLayout.vue` 视觉（Header、Sidebar、Tabbar）。
2. 完成 `V2DataTable`、`V2Form`、`V2Modal` 组件。
3. 在 `Dashboard.vue` 上跑通完整新风格。

### 阶段三：页面批量改造（按模块，每模块 0.5-1 天）

1. 直播模块：域名 → 直播间 → 直播流 → 社媒分发 → 切片/录制 → 指南。
2. 云盘模块：云盘首页 → 分享管理 → 我的分享 → 分享访问页。
3. 系统模块：登录 → 欢迎 → 注册 → 个人中心 → 系统管理 → 翻译管理。
4. 权限模块：权限组 → 权限配置。

### 阶段四：验收与优化（1-2 天）

1. 全链路视觉走查。
2. 暗色主题切换测试。
3. 响应式适配检查。
4. 性能检查（避免全局样式影响渲染）。

---

## 9. 文件结构建议

```
sky-web/src
├── styles/
│   ├── tokens.css          # 设计令牌
│   ├── base.css            # 基础样式
│   ├── arco-override.css   # Arco 变量覆盖
│   └── animations.css      # 公共动画（stagger、fade-in-up 等）
├── components/
│   ├── ui/                 # 统一 UI 组件
│   │   ├── V2Button.vue
│   │   ├── V2Card.vue
│   │   ├── V2Tag.vue
│   │   ├── V2PageHeader.vue
│   │   ├── V2DataTable.vue
│   │   ├── V2Form/
│   │   │   ├── V2Input.vue
│   │   │   ├── V2Select.vue
│   │   │   └── V2FormItem.vue
│   │   └── V2Modal.vue
│   ├── LanguageSwitcher.vue
│   └── ...
├── layouts/
│   ├── BasicLayout.vue
│   └── components/
│       ├── LayoutSidebar.vue
│       ├── LayoutHeader.vue
│       ├── LayoutTabsBar.vue
│       └── LayoutTabContextMenu.vue
├── pages/
│   └── ...（按改造清单逐页调整）
└── modules/
    ├── cloud/
    └── metadata/
```

---

## 10. 暗色主题实现

### 10.1 主题切换

新增 `src/stores/theme.ts`：

```ts
export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('v2_theme') || 'light')

  function applyTheme(t: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('v2_theme', t)
    theme.value = t
  }

  function toggleTheme() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  onMounted(() => applyTheme(theme.value as 'light' | 'dark'))

  return { theme, applyTheme, toggleTheme }
})
```

### 10.2 图表主题联动

ECharts 实例需监听主题变化，重新获取 CSS 变量设置图表颜色。

### 10.3 图片与装饰元素

暗色主题下，部分渐变装饰图、空状态插图可能需要额外处理。

---

## 11. 国际化考虑

- 所有新增文案必须通过 `vue-i18n` 管理，同步更新 `zh-CN.ts` 和 `en-US.ts`。
- 页面标题、描述、按钮文案、空状态、确认对话框等都需要覆盖。
- `V2PageHeader` 等组件接收 `title` / `description` prop，由调用方传入翻译后的字符串。

---

## 12. 风险与注意事项

| 风险 | 说明 | 应对措施 |
|---|---|---|
| 全局样式影响 Arco 组件 | 覆盖 Arco 变量可能导致非预期变化 | 逐组件验证，必要时用具体选择器覆盖 |
| 暗色主题遗漏 | 页面中存在硬编码白色/黑色 | 使用设计令牌，改造时全局搜索 `#fff`、`#000`、hex 色值 |
| 改造范围过大 | 一次性改所有页面容易引入回归 | 分阶段实施，每阶段做标杆页面，验证后再推广 |
| 响应式问题 | 新组件在不同屏幕下可能表现异常 | 每个改造页面都做移动端/平板端检查 |
| 图标不一致 | 原型使用 Iconify（mdi），现有使用 Arco Icon | 统一使用 Arco Icon 中语义相近的图标，或引入 Iconify |
| 动效性能 | 大量 stagger/transition 可能影响低端设备 | 使用 `prefers-reduced-motion` 做降级 |

---

## 13. 下一步行动

1. 评审本方案文档。
2. 确认是否保留现有「顶部 Header + 左侧 Sidebar」布局，还是改为原型「纯左侧 Sidebar」布局。
3. 确认 Arco 覆盖策略（变量覆盖 vs 封装组件）。
4. 进入阶段一：搭建设计系统 + 创建公共组件。
