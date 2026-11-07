import { defineConfig } from 'vitest/config'

export default defineConfig({
    assetsInclude: ['**/*.gltf', '**/*.hdr'],
    test: {
        globals: true,
        environment: 'happy-dom',
    },
    resolve: { tsconfigPaths: true },
})
