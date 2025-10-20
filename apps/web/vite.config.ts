// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { readFileSync } from 'fs'
import path from 'path';
import { resolve } from 'path';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: false,
    })
  ],
  define: {
    'process.env': '{}',
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
      '@': resolve(__dirname, './src'),
      '@prompt-booster/api': path.resolve(__dirname, '../../packages/api/src')
    }
  },
  optimizeDeps: {
    include: [
      'crypto-js',
      // '@mohtasham/md-to-docx' 已改为动态导入，不需要预优化
    ],
  },
  build: {
    rollupOptions: {
      external: ['fs', 'path'],
      output: {
        manualChunks: {
          'react-vendor': [
            'react',
            'react-dom'
          ],
          // i18n相关库统一打包，确保初始化顺序
          'i18n': [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
            'i18next-http-backend'
          ],
          // API客户端单独打包
          'api-client': [
            '@prompt-booster/api'
          ],
          // Markdown 渲染相关库（通常很大）
          'markdown': [
            'react-markdown',
            'remark-gfm',
            'rehype-raw'
          ],
          // UI动画库
          'animation': [
            'framer-motion'
          ]
        },
        globals: {
          fs: '{}',
          path: '{}'
        }
      }
    },
    chunkSizeWarningLimit: 800,
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    emptyOutDir: true,
    outDir: 'dist'
  },
  server: {
    hmr: {
      overlay: true,
    },
    host: true,
    watch: {
      usePolling: true,
    },
    port: 5173,
    open: true
  },
});