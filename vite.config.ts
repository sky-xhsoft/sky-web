import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
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
      allowedHosts: ['c.skyzhou.cn', 'zhibo.skyzhou.cn', '.zhibo.skyzhou.cn', '1.zhibo.skyzhou.cn', '46.zhibo.skyzhou.cn'],
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/swagger': {
          target: apiTarget,
          changeOrigin: true,
        },
        // 本地存储模式下的云盘文件访问地址
        '/files': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: mode === 'development',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-arco': ['@arco-design/web-vue'],
            // 图标不强制单独成块：首屏只带全局注册的少量图标，动态按名称渲染图标的 ButtonField 懒加载完整图标集
            'vendor-echarts': ['echarts'],
            'vendor-editor': ['@wangeditor/editor'],
            'vendor-utils': ['lodash-es', 'axios', 'dompurify', 'marked', 'fuse.js'],
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  }
})
