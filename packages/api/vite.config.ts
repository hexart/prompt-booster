// packages/api/vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        tsconfigPaths(),
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