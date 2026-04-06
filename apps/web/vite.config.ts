// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs'
import path from 'path';
import { resolve } from 'path';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react(),
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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') && !id.includes('@prompt-booster')) return 'react-vendor';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n';
            if (id.includes('@prompt-booster/api')) return 'api-client';
            if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('rehype-raw')) return 'markdown';
            if (id.includes('framer-motion')) return 'animation';
          }
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