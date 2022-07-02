import { Group } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const loader = new GLTFLoader()

export const loadGLTF = (url: string) =>
    new Promise<Group>((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                resolve(gltf.scene)
            },
            () => {},
            (error) => {
                reject(error)
            },
        )
    })
