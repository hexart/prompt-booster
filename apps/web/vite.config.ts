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
      '@': resolve(__dirname, './src'),
      '@prompt-booster/core': path.resolve(__dirname, '../../packages/core/src'),
      '@prompt-booster/api': path.resolve(__dirname, '../../packages/api/src'),
      '@prompt-booster/ui': path.resolve(__dirname, '../../packages/ui/src')
    }
  },
  optimizeDeps: {
    include: [
      'crypto-js',
      '@mohtasham/md-to-docx',
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
          'i18n': [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
            'i18next-http-backend'
          ],
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