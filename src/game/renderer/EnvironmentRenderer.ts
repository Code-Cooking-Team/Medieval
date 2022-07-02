import { config } from '+config'
import { Game } from '+game/Game'
import { ClockInfo } from '+game/types'

import {
    AmbientLight,
    Camera,
    Color,
    DirectionalLight,
    Fog,
    Object3D,
    Scene,
} from 'three'

import { BasicRenderer } from './lib/BasicRenderer'

export class EnvironmentRenderer extends BasicRenderer {
    private sun = new DirectionalLight(0xffffbb, 0.7)
    private sunTarget = new Object3D()
    private ambient = new AmbientLight(0x404040, 2)
    private camera: Camera

    constructor(public game: Game, private scene: Scene, camera: Camera) {
        super()

        this.camera = camera

        if (config.renderer.fog) {
            const fog = new Fog(new Color(0xb5fffb), 0, 150)
            this.scene.fog = fog
        }

        this.scene.background = new Color(0xb5fffb)

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
        }

        this.sun.position.set(4, 10, 1)

        this.sun.target = this.sunTarget

        // Helper for the sun
        // const shadowHelper = new CameraHelper(this.sun.shadow.camera)
        // this.scene.add(shadowHelper)

        this.scene.add(this.sun)
        this.scene.add(this.sunTarget)
        this.scene.add(this.ambient)
    }

    public render({ elapsedTime }: ClockInfo) {
        if (!config.renderer.dayAndNightMode) return

        const time =
            (elapsedTime + config.renderer.dayAndNightTimeStart) /
            config.renderer.dayAndNightTimeScale

        this.sun.position.x = this.camera.position.x + Math.sin(time * 1) * 50
        this.sun.position.y = 100 + Math.cos(time * 1) * 50
        this.sun.position.z = this.camera.position.z + Math.cos(time * 1) * 50

        this.sunTarget.position.copy(this.camera.position)
        this.sunTarget.position.y = 0
        this.sun.target = this.sunTarget

        this.sun.shadow.camera.left = -5 * this.camera.position.y
        this.sun.shadow.camera.right = 5 * this.camera.position.y
        this.sun.shadow.camera.top = 5 * this.camera.position.y
        this.sun.shadow.camera.bottom = -5 * this.camera.position.y

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
            Math.sin(time * 1 + 1.9) * 0.4 + 0.5,
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
                Math.sin(time * 1) + config.renderer.fogTransparency * 1.5 * 50 + 200,
            )
        }
    }
}
