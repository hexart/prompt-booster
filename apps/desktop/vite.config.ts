import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    // 添加相对路径基础配置
    base: './',
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@prompt-booster/core': resolve(__dirname, '../../packages/core/src'),
            '@prompt-booster/api': resolve(__dirname, '../../packages/api/src'),
            '@prompt-booster/ui': resolve(__dirname, '../../packages/ui/src'),
            '@web-components': resolve(__dirname, '../web/src/components'),
        },
    },
    build: {
        outDir: 'dist/renderer',
        emptyOutDir: true,
        assetsInlineLimit: 0,
        copyPublicDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
            // 确保资源使用相对路径
            output: {
                assetFileNames: 'assets/[name].[hash].[ext]',
                chunkFileNames: 'assets/[name].[hash].js',
                entryFileNames: 'assets/[name].[hash].js',
            }
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        hmr: true,
    },
    optimizeDeps: {
        include: ['@prompt-booster/core', '@prompt-booster/api', '@prompt-booster/ui'],
    },
    assetsInclude: ['**/*.svg'],
    // 添加对Electron预加载脚本的支持
    esbuild: {
        target: 'esnext'
    }
});