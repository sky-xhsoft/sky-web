# Sky-Web 文档索引

> **版本**: v1.0
> **最后更新**: 2026-01-28
> **维护者**: Sky Team

---

## 📚 文档导航

### 🚀 快速开始

- [快速开始指南](./QUICK_START.md) - 项目快速上手指南
- [开发指南](./dev-guide.md) - 开发环境配置和开发流程

### 🏗️ 系统设计

#### 元数据系统

- [元数据系统设计 Part 3](./METADATA_SYSTEM_DESIGN_PART3.md) - 元数据系统设计文档第三部分
- [元数据设计规范](./METADATA_DESIGN_SPECS.md) - 元数据设计规范和约定
- [元数据 UI 设计](./METADATA_UI_DESIGN.md) - 元数据驱动的 UI 设计
- [元数据实现进度](./METADATA_IMPLEMENTATION_PROGRESS.md) - 元数据系统实现进度
- [元数据实现总结](./METADATA_IMPLEMENTATION_SUMMARY.md) - 元数据系统实现总结
- [元数据完成报告](./METADATA_COMPLETION_REPORT.md) - 元数据系统完成报告

#### 表单系统

- [元数据表单视图设计](./METADATA_FORM_VIEW_DESIGN.md) - 表单视图设计文档
- [元数据表单视图实现](./METADATA_FORM_VIEW_IMPLEMENTATION.md) - 表单视图实现文档
- [动态表单实现](./DYNAMIC_FORM_IMPLEMENTATION.md) - 动态表单实现细节
- [动态表格实现](./DYNAMIC_TABLE_IMPLEMENTATION.md) - 动态表格实现细节

#### 外键功能

- [外键功能设计](./FK_FEATURE_DESIGN.md) - 外键关联功能设计文档

### 📖 功能文档

#### 核心组件

- [动态表单](./modules/metadata/dynamic-form.md) - 动态表单组件文档
- [动态表格](./modules/metadata/dynamic-table.md) - 动态表格组件文档
- [字段渲染器](./modules/metadata/field-renderers.md) - 字段渲染器组件文档

#### 特性功能

- [图片上传功能](./features/image-upload-feature.md) - 图片上传功能完整文档
- [字典 CSS 样式](./features/dictionary-css-styling.md) - 字典项 CSS 样式功能

#### 云盘模块

- [云盘模块概述](./modules/cloud/README.md) - 云盘模块总览
- [云盘 API](./modules/cloud/cloud-api.md) - 云盘 API 接口文档
- [云盘组件](./modules/cloud/cloud-components.md) - 云盘组件文档
- [后端集成更新](./modules/cloud/BACKEND_INTEGRATION_UPDATE.md) - 后端集成更新记录
- [批量进度实现](./modules/cloud/BATCH_PROGRESS_IMPLEMENTATION.md) - 批量操作进度实现
- [批量进度可视化指南](./modules/cloud/BATCH_PROGRESS_VISUAL_GUIDE.md) - 批量进度可视化指南
- [部署指南](./modules/cloud/DEPLOYMENT.md) - 云盘模块部署指南
- [最新更新](./modules/cloud/LATEST_UPDATE.md) - 最新功能更新
- [分片上传集成](./modules/cloud/MULTIPART_UPLOAD_INTEGRATION.md) - 分片上传集成文档
- [性能优化](./modules/cloud/PERFORMANCE_OPTIMIZATION.md) - 性能优化记录
- [项目状态](./modules/cloud/PROJECT_STATUS.md) - 项目当前状态
- [断点续传](./modules/cloud/RESUMABLE_UPLOAD.md) - 断点续传功能
- [分享管理](./modules/cloud/SHARE_MANAGEMENT.md) - 文件分享管理
- [Stage 8 总结](./modules/cloud/STAGE8_SUMMARY.md) - 第8阶段开发总结
- [Stage 9 总结](./modules/cloud/STAGE9_SUMMARY.md) - 第9阶段开发总结

### 📝 开发指南

#### 路由系统

- [路由使用指南](./guides/ROUTE_USAGE_GUIDE.md) - 路由系统使用指南
- [路由总结](./guides/ROUTE_SUMMARY.md) - 路由系统总结

#### 权限系统

- [MASK 字段权限配置说明](./guides/MASK字段权限配置说明.md) - MASK 字段权限配置详解

### 🔧 开发记录

#### 修复记录

- [字段名称修复完成](./FIELD_NAME_FIXES_COMPLETE.md) - 字段名称修复记录
- [修复应用记录](./FIXES_APPLIED.md) - 各类修复应用记录

#### 优化记录

- [优化总结](./OPTIMIZATION_SUMMARY.md) - 系统优化总结

#### 测试文档

- [测试文档](./TEST_DOCUMENTATION.md) - 测试相关文档
- [代理配置](./AGENTS.md) - 代理配置说明

---

## 🗂️ 文档分类

### 按功能分类

#### 元数据系统
- 元数据设计、表单系统、表格系统、字段渲染

#### 云盘功能
- 文件上传、断点续传、分片上传、文件分享

#### 权限管理
- MASK 字段权限、路由权限

#### UI 组件
- 动态表单、动态表格、字段渲染器

### 按文档类型分类

#### 设计文档
- 系统设计、功能设计、UI 设计

#### 开发指南
- 快速开始、开发流程、使用指南

#### 实现文档
- 功能实现、组件实现、模块实现

#### 开发记录
- 修复记录、优化记录、阶段总结

---

## 🔍 快速查找

### 我想了解...

- **如何开始开发？** → [快速开始指南](./QUICK_START.md) + [开发指南](./dev-guide.md)
- **如何使用动态表单？** → [动态表单](./modules/metadata/dynamic-form.md)
- **如何使用动态表格？** → [动态表格](./modules/metadata/dynamic-table.md)
- **如何实现图片上传？** → [图片上传功能](./features/image-upload-feature.md)
- **如何使用云盘功能？** → [云盘模块概述](./modules/cloud/README.md)
- **如何配置路由？** → [路由使用指南](./guides/ROUTE_USAGE_GUIDE.md)
- **如何配置权限？** → [MASK 字段权限配置说明](./guides/MASK字段权限配置说明.md)
- **如何自定义字段渲染？** → [字段渲染器](./modules/metadata/field-renderers.md)

### 我想实现...

- **文件上传功能** → [图片上传功能](./features/image-upload-feature.md)
- **大文件上传** → [分片上传集成](./modules/cloud/MULTIPART_UPLOAD_INTEGRATION.md) + [断点续传](./modules/cloud/RESUMABLE_UPLOAD.md)
- **自定义表单** → [动态表单实现](./DYNAMIC_FORM_IMPLEMENTATION.md)
- **自定义表格** → [动态表格实现](./DYNAMIC_TABLE_IMPLEMENTATION.md)
- **外键关联** → [外键功能设计](./FK_FEATURE_DESIGN.md)
- **字典样式** → [字典 CSS 样式](./features/dictionary-css-styling.md)

---

## 📌 重要提示

1. **文档版本**: 所有文档都标注了版本号和更新日期，请注意查看
2. **代码示例**: 文档中的代码示例均经过测试，可直接使用
3. **组件文档**: 组件文档包含完整的 Props、Events、Slots 说明
4. **问题反馈**: 如发现文档问题，请及时反馈给维护团队
5. **持续更新**: 文档会随着项目发展持续更新

---

## 🎯 开发流程

### 新功能开发流程

1. **查看设计文档** → 了解系统架构和设计规范
2. **阅读开发指南** → 配置开发环境，了解开发流程
3. **参考实现文档** → 学习现有功能的实现方式
4. **编写代码** → 按照规范编写代码
5. **测试验证** → 进行功能测试和集成测试
6. **更新文档** → 更新相关文档

### 问题排查流程

1. **查看修复记录** → 检查是否有类似问题的修复记录
2. **查看实现文档** → 了解功能的实现细节
3. **查看开发指南** → 确认是否按照规范开发
4. **联系维护团队** → 如无法解决，联系维护团队

---

## 📞 联系方式

- **项目地址**: https://github.com/sky-xhsoft/sky-web
- **维护团队**: Sky Team
- **更新日期**: 2026-01-28

---

**文档索引版本**: v1.0
**最后更新**: 2026-01-28
**维护者**: Sky Team
