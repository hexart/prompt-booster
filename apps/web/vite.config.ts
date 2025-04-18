// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react()
  ],
  define: {
    'process.env': '{}',
    'global': 'globalThis',
    'Buffer': ['buffer', 'Buffer']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@prompt-booster/core': path.resolve(__dirname, '../../packages/core/src'),
      '@prompt-booster/api': path.resolve(__dirname, '../../packages/api/src'),
      '@prompt-booster/ui': path.resolve(__dirname, '../../packages/ui/src')
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        {
          name: 'fix-node-globals-polyfill',
          setup(build) {
            build.onResolve({ filter: /_(buffer|events|process|util)/ }, () => {
              return { external: true }
            })
          },
        },
      ],
    },
    include: [
      'crypto-js',
      'buffer',
      'process',
      'stream-browserify'
    ],
    exclude: ['']
  },
  build: {
    rollupOptions: {
      external: ['fs', 'path'],
      output: {
        // 添加手动分块配置
        manualChunks: {
          // React 相关库 - 移除 react-router-dom
          'react-vendor': [
            'react', 
            'react-dom'
            // 'react-router-dom' 移除这一行
          ],
          // 其他分块保持不变
          'core-api': [
            '@prompt-booster/core',
            '@prompt-booster/api'
          ],
          'ui-components': [
            '@prompt-booster/ui'
          ]
        },
        globals: {
          fs: '{}',
          path: '{}'
        }
      }
    },
    // 提高警告阈值，避免不必要的警告
    chunkSizeWarningLimit: 800, // 从默认的500KB提高到800KB
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