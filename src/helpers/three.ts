import { config } from '+config'
import { DiagonalsPlaneGeometry } from '+game/renderer/lib/DiagonalsPlaneGeometry'
import { Position } from '+game/types'

import {
    AnimationAction,
    AnimationMixer,
    Group,
    Mesh,
    MeshBasicMaterial,
    Object3D,
} from 'three'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { multiplyPosition } from './math'

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

export const loadRawGLTF = (url: string) =>
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

export const updateObjectPosition = (
    object3D: Object3D,
    position: Position,
    height: number,
) => {
    const [x, y] = multiplyPosition(position, config.renderer.tileSize)
    object3D.position.x = x
    object3D.position.z = y
    object3D.position.y = height * config.renderer.tileSize
}

export const updateScale = (object3D: Object3D, scale: number = 1) => {
    object3D.scale.set(
        scale * config.renderer.tileSize,
        scale * config.renderer.tileSize,
        scale * config.renderer.tileSize,
    )
}

export class HorizontalPlaneGeometry extends DiagonalsPlaneGeometry {
    constructor(...args: any[]) {
        super(...args)
        this.rotateX(-Math.PI / 2)
    }
}
