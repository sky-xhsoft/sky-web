/**
 * 空模块：替换仅在 Node 环境使用的依赖（如 emf-converter 引用的 @napi-rs/canvas），
 * 浏览器中这些分支不会执行，替换后避免把原生模块打进前端产物。
 */
export default {}
