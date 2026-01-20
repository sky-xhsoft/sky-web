# Repository Guidelines

## 项目结构与模块组织
- 主代码在 `src/`（Vue 3 + TypeScript + Vite）。`pages/` 存放业务页面（如 `Dashboard.vue`、`Cloud.vue`），`layouts/` 存放布局壳，`router/` 维护路由，`stores/` 用 Pinia 管理认证与菜单，`api/` 封装接口，`components/` 为复用组件，`assets/` 放静态资源。构建产物输出到 `dist/`，公共静态资源放在 `public/`。
- 接口调用统一走 `src/api/http.ts` 的 axios 实例（自动挂载 token、刷新 token），请在 `src/api/` 新增模块，并在 `src/config.ts` 管理基础配置（如 `API_BASE_URL`、本地存储 key）。

## 构建、测试与开发命令
- `npm install`: 初始化依赖。
- `npm run dev`: 启动 Vite 开发服务（默认走代理，API 基地址可在 `.env.development.local` 设置 `VITE_API_BASE_URL`）。
- `npm run build`: 先用 `vue-tsc -b` 做类型检查，再生成生产包到 `dist/`。
- `npm run preview`: 基于构建结果起本地预览，提交前做一次冒烟检查。

## 编码风格与命名约定
- 使用 `<script setup lang="ts">` 与组合式 API，保持 2 空格缩进、单引号、尾随逗号风格。类型、接口用 `PascalCase` 命名，变量/函数用 `camelCase`，路由路径用短横线小写。
- 组件文件 `PascalCase` 命名，页面放 `src/pages/`，路由在 `src/router/index.ts` 注册。UI 统一使用 Arco 组件；全局样式集中在 `src/style.css`，页面内样式建议 `scoped`，颜色/间距尽量复用现有变量与设计。
- 调用接口请复用 `api` 模块返回的 typed 方法，避免直接 `fetch` 以保持认证拦截器生效；涉及 token 存取统一用 `src/utils/token.ts`。

## 测试与质量校验
- 当前未内置自动化测试，最少请保证 `npm run build` 通过，并在 `npm run preview` 下手动验证关键路径（登录、菜单加载、云盘上传/下载/预览）。
- 补充测试时建议使用 Vitest + Vue Test Utils，测试文件以 `*.spec.ts` 紧邻源码存放；如涉及路由/交互，可增加 Playwright 端到端冒烟脚本。

## 提交与合并规范
- Git 历史以简洁中文为主（示例：`完成菜单功能及样式`），鼓励使用前缀：`feat:`、`fix:`、`chore:`、`docs:`；例：`feat: 云盘上传进度展示`。
- 单次提交聚焦单一改动；依赖升级、样式微调与功能改动拆开提交。PR 描述需包含：变更摘要、影响范围、测试结果/截图（UI 变更必带）、关联需求或接口依赖。提交前至少跑通 `npm run build`，若有已知问题请在 PR 中注明。

## 安全与配置提示
- 后端地址与凭证放在环境变量，勿提交真实 token；前端认证信息缓存在浏览器（见 `TOKEN_STORAGE_KEY` 等常量），调试后注意清理。
- 需要新增模块时，优先复用已存在的 axios 客户端与存储键，避免硬编码 URL；如需代理或 CORS 设置，请在 Vite 配置和 `.env` 中处理。
