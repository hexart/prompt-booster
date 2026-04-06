// packages/api/vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    resolve: {
        tsconfigPaths: true
    },
    plugins: [
        dts({
            insertTypesEntry: true,
            rollupTypes: true
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'PromptOptimizerApi',
            fileName: (format) => `index.${format}.js`,
            formats: ['es', 'cjs']
        },
        rollupOptions: {
            external: []
        },
        sourcemap: true
    }
});