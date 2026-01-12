# sky-web 前端开发指引（对接 sky-server）

> 技术栈：Vite + Vue 3 + TypeScript + Arco Design + Vue Router 4 + Pinia + Axios

## 1. 环境要求与运行
- Node.js ≥ 20.19（推荐 22.12+），npm 已装。
- 开发：`npm run dev`（默认 5173 端口，可在 `.env` 中设置 `VITE_PORT`）。
- 构建：`npm run build`，预览：`npm run preview`。

## 2. 目录约定（后续可细化）
```
src/
  api/            // axios 实例、各业务模块请求
  components/     // 通用组件（如元数据表单/表格、字典选择器等）
  layouts/        // 布局
  pages/          // 业务页面
  router/         // 路由配置
  store/          // Pinia 状态
  styles/         // 全局样式/主题
  utils/          // 工具（权限、mask 解析等）
```

## 3. 后端基础信息
- 基址：`http://localhost:9090/api/v1`（可在 `.env` 设置 `VITE_API_BASE`）。
- 鉴权：JWT（Bearer Token），登录接口 `/auth/login`，刷新 `/auth/refresh`。
- 主要域：
  - 认证：`/auth/*`
  - 菜单：`/menus`（含 `/menus/user/tree`、`/menus/user/routers`）
  - 权限与目录：`/groups`、`/permissions`
  - 元数据：`/metadata/tables/:tableName`、`/columns`、`/actions`
  - 通用数据 CRUD：`/data/:tableName` 系列（列表使用 `POST /query`）
  - 动作：`/actions/:actionId/execute`、`/actions/by-name/:tableName/:actionName/execute`
  - 工作流：`/workflow/...`
  - 字典：`/dicts/...`
  - 序号：`/sequences/...`
  - 文件：`/files/upload`、`/download/:id`、`/preview/:id`
  - 消息：`/messages/...`，WS：`/ws/messages`

## 4. API 封装（建议）
1) 新建 `src/api/http.ts`：
   - `axios.create({ baseURL: import.meta.env.VITE_API_BASE, timeout: 15000 })`
   - 请求拦截：从 Pinia/LocalStorage 取 `token` 加 `Authorization: Bearer <token>`
   - 响应拦截：code != 200/201 时统一 Message 提示；401 时尝试刷新 token
2) 刷新 token：调用 `POST /auth/refresh`，成功后重放原请求；失败则跳转登录。
3) 错误处理：网络错误、超时单独提示；后端统一响应格式 `code/message/data`。

## 5. 认证流程
1) 登录页调用 `POST /auth/login`，入参含 `username/password/companyId/clientType(=web)/deviceId/deviceName`。
2) 返回 `token/refreshToken/user`，存储在 Pinia + localStorage。
3) 路由守卫：未登录跳 `/login`；登录状态访问登录页则重定向 `/`。
4) 退出：`POST /auth/logout`，清理本地状态。
5) 会话管理页：`GET /auth/sessions` 显示在线设备，`POST /auth/kick-device` 踢除，`POST /auth/logout-all` 全退。

## 6. 菜单与权限
1) 登录后拉取 `/menus/user/tree` 生成侧栏；如需路由配置，可用 `/menus/user/routers`。
2) 权限值：来自后端 `/permissions/user`，结合按钮/动作显示控制；字段级权限参考元数据 `Mask`。
3) 权限位可仿照后端 `groups` 的位运算（读/写/提交/审核/导出等）。

## 7. 元数据驱动 CRUD
1) 进入表页面流程：
   - 调用 `/metadata/tables/:tableName`
   - `/metadata/tables/:tableName/columns`
   - `/metadata/tables/:tableName/actions`
2) 列表查询：`POST /data/:tableName/query`，body 含分页/过滤/排序。
3) 详情：`GET /data/:tableName/:id`
4) 创建：`POST /data/:tableName`；更新：`PUT /data/:tableName/:id`；删除：`DELETE /data/:tableName/:id`；批量删除：`POST /data/:tableName/batch-delete`
5) Mask 解析（10 位）：决定字段在新增/编辑/列表/导入/导出等场景的可见/可编辑；可在 `src/utils/mask.ts` 实现，前端渲染时过滤字段或禁用表单项。
6) 字段 `SysDictID` -> 通过字典接口渲染下拉；`DisplayType` 决定组件类型（text/textarea/select/date/file/image 等）。
7) 关联：`GetTableRefs` 可用于下拉联动或详情展示。

## 8. 动作系统
- 获取动作：`/metadata/tables/:tableName/actions`
- 执行动作：`POST /actions/:actionId/execute` 或 `/actions/by-name/:tableName/:actionName/execute`
- 结果处理：可能返回跳转 URL、提示信息或后台任务状态，需要前端根据类型适配。

## 9. 工作流
- 定义/节点/流转管理：`/workflow/definitions|nodes|transitions`
- 实例：`/workflow/instances`（启动/终止/查看）
- 任务：`/workflow/tasks/my`（待办）、`/workflow/tasks/:id`、`/workflow/tasks/complete`、`claim/transfer`
- 审核历史：`/workflow/history`（在文档中示例，可依据 handler 代码对齐）

## 10. 审计与日志
- 查询日志：`/audit/logs`，支持过滤；详情 `/audit/logs/:id`
- 按资源/用户：`/audit/resources/:resource/:resourceId/logs`、`/audit/users/:userId/logs`
- 清理：`/audit/clean`

## 11. 消息与 WebSocket
- WebSocket：`/ws/messages`（带 token），用于实时消息推送。
- REST：未读数 `/messages/unread/count`，未读列表 `/messages/unread/list`，消息详情/标记已读/星标/归档/删除等均在 `/messages` 下。
- 前端：建立 WS 连接存入 Pinia，收到消息后更新消息中心和通知气泡。

## 12. 文件与云盘
- 上传：`POST /files/upload`、`/files/upload/multiple`（multipart），需表名/字段名/recordId 视业务传递。
- 下载/预览：`/files/download/:id`、`/files/preview/:id`；直链 `/files/access/:storageName`
- 列表/删除：`/files/list`（POST）、`/files/:id`（GET/DELETE）
- 前端需处理文件大小/类型限制（对齐后端配置）。

## 13. 序号与字典
- 序号：`POST /sequences/:seqName/next`，在创建单据前调用；`/current`、`/reset` 视需要。
- 字典：`/dicts/:dictId/items`、`/dicts/name/:dictName/items`；建议在 Pinia 做缓存，失效时调用 `/dicts/refresh`。

## 14. 配置与环境变量
- `.env` 示例：
  ```
  VITE_API_BASE=http://localhost:9090/api/v1
  VITE_WS_BASE=ws://localhost:9090/api/v1/ws/messages
  VITE_PORT=5173
  ```
- CORS：后端已允许 `http://localhost:3000/8080`，开发可直接使用。

## 15. 后续待办
- `src/api/http.ts`、`src/store/user.ts`、`src/utils/mask.ts`、`src/utils/permission.ts` 落地实现。
- 登录页接入真实接口并保存 token；路由守卫完善。
- 菜单树与权限控制：使用后端 `/menus/user/tree`，结合权限位/动作显示。
- 元数据驱动的 `MetaTable` / `MetaForm` 组件封装，支持字段类型映射、Mask 控制、字典/级联/日期/文件等组件。
- WebSocket 消息中心、工作流待办/处理页、审计日志、文件/云盘页、权限组与目录管理页。
