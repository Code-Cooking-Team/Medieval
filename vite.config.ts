import react from '@vitejs/plugin-react'
import { defineConfig, Plugin } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const pluginSettings = {
    configFilePath: './src/config.json',
}

const handyConfigPlugin: Plugin = {
    name: 'handy-config-plugin',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            console.log(req.url)
            next()
        })
    },
}

export default defineConfig({
    base: '/Medieval/',
    assetsInclude: ['**/*.gltf', '**/*.hdr'],
    plugins: [
        tsconfigPaths(),
        react({ fastRefresh: true }),
        // Local plugin
        handyConfigPlugin,
    ],
    server: {
        port: 3333,
    },
})
