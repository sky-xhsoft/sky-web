/**
 * 腾讯云播放器（TCPlayer）License
 * 按环境配置：测试环境用测试 License（域名 *.skyzhou.cn，播放器高级版），
 * 生产环境用正式 License（域名 web.zigebo.com，播放器基础版）。License 按域名校验，
 * 当前两者的 License URL 相同（同一腾讯云账号），未配置时使用该地址。
 */
const DEFAULT_LICENSE_URL = 'https://1401565388.trtcube-license.cn/license/v2/1401565388_1/v_cube.license'

export const TCPLAYER_LICENSE_URL: string = import.meta.env.VITE_TCPLAYER_LICENSE_URL || DEFAULT_LICENSE_URL
