import { config } from '+config'
import { DiagonalsPlaneGeometry } from '+game/renderer/lib/DiagonalsPlaneGeometry'

import { AnimationAction, AnimationMixer, Group, Mesh, MeshBasicMaterial } from 'three'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const loader = new GLTFLoader()

export const loadGLTF = (url: string) =>
    new Promise<Group>((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if (config.debug.wireModel) {
                        const childMesh = child as Mesh
                        childMesh.material = new MeshBasicMaterial({
                            color: 0xffccaa,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.1,
                        })
                    } else {
                        child.castShadow = true
                        child.receiveShadow = true
                    }
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
                gltf.scene.traverse((child) => {
                    child.castShadow = true
                    child.receiveShadow = true
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
