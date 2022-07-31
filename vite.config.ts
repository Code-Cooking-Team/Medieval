import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/Medieval/',
    assetsInclude: ['**/*.gltf', '**/*.hdr'],
    plugins: [
        tsconfigPaths(),
        react({
            fastRefresh: true,
        }),
    ],
    server: {
        port: 3333,
    },
})
