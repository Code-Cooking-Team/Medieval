import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { mock } from 'bun:test'
import { Group } from 'three'

GlobalRegistrator.register()
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

// Unit tests need model groups. Vite and the browser exercise loading the GLTF assets.
const threeHelpers = await import('../src/helpers/three')
mock.module('../src/helpers/three', () => ({
    ...threeHelpers,
    loadGLTF: async () => {
        const model = new Group()
        for (const name of [
            'lod1',
            'lod2',
            'lod3',
            'lod_near',
            'lod_far',
            'lod_very_far',
        ]) {
            const level = new Group()
            level.name = name
            model.add(level)
        }
        return model
    },
}))
