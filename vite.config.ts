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
            'vendor-arco-icons': ['@arco-design/web-vue/es/icon'],
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
