import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
// import vueDevTools from 'vite-plugin-vue-devtools' // Отключено для удаления Service Worker

export default defineConfig({
  plugins: [vue()], // Убрали vueDevTools()
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
    hmr: {
      overlay: false, // Отключаем overlay ошибок
      port: 24678, // Фиксированный порт для HMR
    },
    watch: {
      usePolling: true, // Для стабильности на некоторых системах
    },
    cors: true, // Включаем CORS для dev сервера
  },
  optimizeDeps: {
    include: [
      'vue', 
      'vue-router', 
      'pinia',
      'axios',
      '@heroicons/vue',
      '@tabler/icons-vue',
      '@vueform/multiselect',
      '@vuepic/vue-datepicker',
      'chart.js',
      'sortablejs'
    ],
    force: true, // Принудительная пересборка зависимостей
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@heroicons/vue', '@tabler/icons-vue'],
          charts: ['chart.js'],
          forms: ['@vueform/multiselect', '@vuepic/vue-datepicker'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  // Настройки для стабильности разработки
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    'process.env.NODE_ENV': '"development"',
  },
  // Кэширование для стабильности
  cacheDir: 'node_modules/.vite',
})
