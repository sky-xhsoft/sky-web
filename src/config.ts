// 开发环境默认走 Vite 代理，使用相对路径可避免浏览器跨域；如需指定完整地址，可设置 VITE_API_BASE_URL。
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
export const TOKEN_STORAGE_KEY = 'sky-web:token'
export const REFRESH_TOKEN_STORAGE_KEY = 'sky-web:refresh-token'
export const USER_STORAGE_KEY = 'sky-web:user'
export const DEVICE_ID_STORAGE_KEY = 'sky-web:device-id'
