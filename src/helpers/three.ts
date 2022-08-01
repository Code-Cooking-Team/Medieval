import { DiagonalsPlaneGeometry } from '+game/renderer/lib/DiagonalsPlaneGeometry'

import { AnimationAction, AnimationMixer, Group } from 'three'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const loader = new GLTFLoader()

export const loadGLTF = (url: string) =>
    new Promise<Group>((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                gltf.scene.children?.forEach((child) => {
                    child.castShadow = true
                    // child.receiveShadow = true
                    child.children?.forEach((child) => {
                        child.castShadow = true
                        // child.receiveShadow = true
                        child.children?.forEach((child) => {
                            child.castShadow = true
                            // child.receiveShadow = true
                        })
                    })
                })
                resolve(gltf.scene)
            },
            () => {},
            (error) => {
                reject(error)
            },
        )
    })

export const loadAnimationGLTF = (url: string) =>
    new Promise<GLTF>((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                gltf.scene.children?.forEach((child) => {
                    child.castShadow = true
                    child.receiveShadow = true
                    child.children?.forEach((child) => {
                        child.castShadow = true
                        child.receiveShadow = true
                        child.children?.forEach((child) => {
                            child.castShadow = true
                            child.receiveShadow = true
                        })
                    })
                })
                resolve(gltf)
            },
            () => {},
            (error) => {
                reject(error)
            },
        )
    })

export class HorizontalPlaneGeometry extends DiagonalsPlaneGeometry {
    constructor(...args: any[]) {
        super(...args)
        this.rotateX(-Math.PI / 2)
    }
}
