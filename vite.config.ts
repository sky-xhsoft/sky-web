import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 单独的代理目标，避免与前端 API_BASE_URL 混淆
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:9090'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['c.skyzhou.cn'],
      proxy: {
        // 通过本地 dev server 反向代理后端，避免浏览器 CORS
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/swagger': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
