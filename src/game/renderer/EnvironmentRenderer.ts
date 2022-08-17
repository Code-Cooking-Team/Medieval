import { config } from '+config'
import { Game } from '+game/Game'
import { ClockInfo } from '+game/types'

import {
    AmbientLight,
    Camera,
    Color,
    DirectionalLight,
    EquirectangularReflectionMapping,
    Fog,
    Object3D,
    Scene,
    TextureLoader,
    Vector3,
} from 'three'

import { BasicRenderer } from './lib/BasicRenderer'
import hdrUrl from './textures/bg.jpg'

const SHADOW_SCALE = 3

export class EnvironmentRenderer extends BasicRenderer {
    public sun = new DirectionalLight(0xfff2c7, 133.2)
    private sunTarget = new Object3D()
    // private ambient = new AmbientLight(0xdae6e8, 0.1)
    public ambient = new DirectionalLight(0xfff2c7, 1.2)

    constructor(public game: Game, private scene: Scene, private camera: Camera) {
        super()

        if (config.renderer.fog) {
            const fog = new Fog(new Color(0xa2d3e8), 0, 150)
            this.scene.fog = fog
        }

        this.scene.background = new Color(0xa2d3e8)

        if (config.renderer.shadow) {
            this.sun.castShadow = true
            this.sun.shadow.mapSize.width = 128 * 10
            this.sun.shadow.mapSize.height = 128 * 10
            this.sun.shadow.camera.near = 0.5
            this.sun.shadow.camera.far = 200
            this.sun.shadow.camera.left = -100
            this.sun.shadow.camera.right = 100
            this.sun.shadow.camera.top = 100
            this.sun.shadow.camera.bottom = -100
            this.sun.shadow.bias = -0.0001 * config.renderer.tileSize
            this.sun.shadow.normalBias = 0.27 * config.renderer.tileSize
        }

        this.sun.position.set(4, 10, 1)

        this.sun.target = this.sunTarget

        // Helper for the sun
        // const shadowHelper = new CameraHelper(this.sun.shadow.camera)
        // this.scene.add(shadowHelper)

        const loader = new TextureLoader()

        loader.load(hdrUrl, (texture) => {
            texture.mapping = EquirectangularReflectionMapping
            this.scene.environment = texture
            // this.scene.background = texture
        })

        this.scene.add(this.sun)
        this.scene.add(this.sunTarget)
        this.scene.add(this.ambient)
    }

    public render({ elapsedTime }: ClockInfo) {
        if (!config.renderer.dayAndNightMode) return

        const time =
            elapsedTime / config.renderer.dayAndNightTimeScale +
            config.renderer.dayAndNightTimeStart

        const blur = 3
        let fx = (Math.random() - 0.5) * blur
        let fy = (Math.random() - 0.5) * blur
        let fz = (Math.random() - 0.5) * blur

        this.sun.position.x = fx + 10
        this.sun.position.y = 5 + fy
        this.sun.position.z = fz + 10

        this.sunTarget.position.copy(new Vector3(0, 0, 0))
        this.sun.target = this.sunTarget

        this.ambient.target = this.sunTarget

        fx = (Math.random() - 0.5) * blur * 2
        fy = (Math.random() - 0.5) * blur * 2
        fz = (Math.random() - 0.5) * blur * 2

        this.ambient.position.x = fx + 10
        this.ambient.position.y = 5 + fy
        this.ambient.position.z = fz + 10

        this.sun.shadow.camera.left = -SHADOW_SCALE * this.camera.position.y
        this.sun.shadow.camera.right = SHADOW_SCALE * this.camera.position.y
        this.sun.shadow.camera.top = SHADOW_SCALE * this.camera.position.y
        this.sun.shadow.camera.bottom = -SHADOW_SCALE * this.camera.position.y

        this.sun.color.setHSL(
            10 + Math.sin(time * 1) * 0.1,
            Math.sin(time * 1),
            Math.sin(time * 1 + 1.9) * 0.5 + 0.12,
        )

        this.ambient.color.setHSL(
            10 + Math.sin(time * 1) * 0.1,
            Math.sin(time * 1),
            (Math.sin(time * 1 + 1.9) * 0.5 + 0.6) / 4,
        )

        this.scene.background = new Color().setHSL(
            10 + Math.sin(time * 1) * 0.1,
            Math.sin(time * 1),
            // Math.sin(time * 1 + 1.9) * 0.4 + 0.5,
            0.3, // for bloom to keep the eyes from burning
        )

        if (config.renderer.fog) {
            const fogColor = new Color().setHSL(
                10 + Math.sin(time * 1) * 0.1,
                Math.sin(time * 1),
                Math.sin(time * 1 + 1.9) * 0.3 + 0.7,
            )

            this.scene.fog = new Fog(
                fogColor,
                config.renderer.fogTransparency,
                (Math.sin(time * 1) + config.renderer.fogTransparency * 1.5 * 50 + 200) *
                    config.renderer.tileSize,
            )
        }
    }
}
