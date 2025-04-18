import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        // 使用 tsconfig 中的路径配置
        tsconfigPaths(),
        dts({
            insertTypesEntry: true,
            rollupTypes: true
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'PromptOptimizerCore',
            fileName: (format) => `index.${format}.js`,
            formats: ['es', 'cjs']
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'zustand',
                'zustand/traditional',
                'zustand/middleware',
                'use-sync-external-store',
                'use-sync-external-store/shim',
                'use-sync-external-store/shim/with-selector',
                'use-sync-external-store/shim/with-selector.js',
                'uuid',
                '@prompt-booster/api',
                /^@prompt-booster\/api\/.*/
            ],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    zustand: 'zustand',
                    'zustand/traditional': 'zustandTraditional',
                    'zustand/middleware': 'zustandMiddleware',
                    uuid: 'uuid',
                    '@prompt-booster/api': 'PromptOptimizerApi'
                }
            }
        },
        sourcemap: true
    }
});