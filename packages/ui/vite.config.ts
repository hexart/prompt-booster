// packages/ui/vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            rollupTypes: true
        })
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@prompt-booster/core': path.resolve(__dirname, '../../packages/core/src'),
            '@prompt-booster/api': path.resolve(__dirname, '../../packages/api/src'),
        }
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'PromptOptimizerUI',
            fileName: (format) => `index.${format}.js`,
            formats: ['es', 'cjs']
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                '@prompt-booster/core',
                'buffer',
                'crypto',
                'fs',
                'path'
            ],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    '@prompt-booster/core': 'PromptOptimizerCore'
                }
            }
        },
        sourcemap: true
    }
});