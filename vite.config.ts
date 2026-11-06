import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/Medieval/',
    assetsInclude: ['**/*.gltf', '**/*.hdr'],
    resolve: { tsconfigPaths: true },
    plugins: [react()],
    server: {
        port: 3333,
    },
})
